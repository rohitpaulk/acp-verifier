import { expect, test, setDefaultTimeout } from "bun:test";
import { AgentProcess } from "../../lib/agent-process";
import { checkCollectorRegistry, registry } from "../setup";
import * as acp from "@agentclientprotocol/sdk";
import { initAndAuth } from "../helpers";
import type { CheckCollector } from "../../lib/check-collector";

setDefaultTimeout(15_000);

type SelectConfigOption = acp.SessionConfigOption & { type: "select" };
type SelectConfigCheckSlug = "switch-model" | "switch-thinking-effort";
type SelectConfigTimingCheckSlug = "switch-model-100ms" | "switch-thinking-effort-100ms";

function isSelectConfigOption(option: acp.SessionConfigOption): option is SelectConfigOption {
  return option.type === "select";
}

function selectValues(option: SelectConfigOption): acp.SessionConfigSelectOption[] {
  return option.options.flatMap((entry) => ("value" in entry ? [entry] : entry.options));
}

function optionMatches(option: acp.SessionConfigOption, category: string, keywords: string[]): boolean {
  if (option.category === category) {
    return true;
  }

  const searchableText = `${option.id} ${option.name}`.toLowerCase();
  return keywords.some((keyword) => searchableText.includes(keyword));
}

function findSelectConfigOption(
  options: acp.SessionConfigOption[],
  category: string,
  keywords: string[],
): SelectConfigOption | undefined {
  return options.find((option) => isSelectConfigOption(option) && optionMatches(option, category, keywords)) as
    | SelectConfigOption
    | undefined;
}

function setConfigErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function checkSwitchSelectConfigOption(params: {
  agentName: string;
  check: CheckCollector;
  connection: acp.ClientSideConnection;
  sessionId: string;
  option: SelectConfigOption | undefined;
  optionLabel: string;
  switchSlug: SelectConfigCheckSlug;
  timingSlug: SelectConfigTimingCheckSlug;
}): Promise<acp.SessionConfigOption[] | undefined> {
  const { agentName, check, connection, sessionId, option, optionLabel, switchSlug, timingSlug } = params;

  if (!option) {
    check.fail(switchSlug, `${agentName} did not expose a ${optionLabel} selector as a session config option.`);
    check.fail(timingSlug, `${agentName} did not expose a ${optionLabel} selector as a session config option.`);
    return undefined;
  }

  const values = selectValues(option);
  const target = values.find((value) => value.value !== option.currentValue);

  if (!target) {
    check.fail(
      switchSlug,
      `${agentName} listed ${optionLabel} in session config options, but did not include another value to switch to.`,
    );
    check.fail(
      timingSlug,
      `${agentName} listed ${optionLabel} in session config options, but did not include another value to switch to.`,
    );
    return undefined;
  }

  const start = performance.now();

  let result: acp.SetSessionConfigOptionResponse;
  try {
    result = await connection.setSessionConfigOption({
      sessionId,
      configId: option.id,
      value: target.value,
    });
  } catch (error) {
    const errorMessage = setConfigErrorMessage(error);
    check.fail(switchSlug, `${agentName} failed to switch ${optionLabel}: ${errorMessage}`);
    check.fail(timingSlug, `${agentName} failed to switch ${optionLabel}: ${errorMessage}`);
    return undefined;
  }

  const elapsedMs = Math.round(performance.now() - start);
  const updatedOption = result.configOptions.find(
    (candidate) => candidate.id === option.id && isSelectConfigOption(candidate),
  ) as SelectConfigOption | undefined;

  if (updatedOption?.currentValue !== target.value) {
    check.fail(
      switchSlug,
      `${agentName} acknowledged a ${optionLabel} switch, but did not report ${target.name} as the current value.`,
    );
    check.fail(
      timingSlug,
      `${agentName} acknowledged a ${optionLabel} switch, but did not report ${target.name} as the current value.`,
    );
    return result.configOptions;
  }

  check.pass(switchSlug, `${agentName} switched ${optionLabel} from ${option.currentValue} to ${target.value}.`);

  if (elapsedMs <= 100) {
    check.pass(timingSlug, `${agentName} switched ${optionLabel} in ${elapsedMs}ms.`);
  } else {
    check.fail(timingSlug, `${agentName} took ${elapsedMs}ms to switch ${optionLabel}, exceeding the 100ms target.`);
  }

  return result.configOptions;
}

test.each(registry.agentSlugs)("can list and switch models (%s)", async (slug) => {
  const agent = registry.agentBySlug(slug);
  const check = checkCollectorRegistry.get(slug);

  using proc = new AgentProcess(agent);
  const connection = proc.connect();
  await initAndAuth(connection, agent);

  const session = await connection.newSession({
    cwd: "/tmp",
    mcpServers: [],
  });

  expect(session.sessionId).toBeTruthy();

  let configOptions = session.configOptions;
  const modelOption = (configOptions || []).find((configOption) => configOption.category === "model");

  if (!modelOption) {
    const modelLikeOption = (configOptions || []).find((configOption) => configOption.name.toLowerCase() === "model");

    if (modelLikeOption) {
      const errorMessage = `${agent.name} did include a "${modelLikeOption.name}" config option, but it didn't use the "model" category.`;
      check.fail("list-models", errorMessage);
      check.fail("switch-model", errorMessage);
      check.fail("switch-model-100ms", errorMessage);
    } else {
      check.fail("list-models", `${agent.name} did not list any models as session config options.`);
      check.fail("switch-model", `${agent.name} does not support switching models.`);
      check.fail("switch-model-100ms", `${agent.name} does not support switching models.`);
    }

    return;
  }

  if (modelOption.type != "select") {
    throw new Error("Expected modelOption to be a select");
  }

  if (modelOption.options.length < 2) {
    throw new Error("Expected at least 2 models options to be present");
  }

  check.pass(
    "list-models",
    `${agent.name} listed ${modelOption.options.length} models as available, with ${modelOption.currentValue} as the default.`,
  );

  // if (currentModel) {
  //   check.pass(
  //     "list-models",
  //     `${agent.name} listed ${modelValues.length} model${modelValues.length === 1 ? "" : "s"} as session config options.`,
  //   );
  // } else {
  //   check.fail(
  //     "list-models",
  //     `${agent.name} exposed a model selector, but the current model was not present in its values.`,
  //   );
  //   check.fail("switch-model", `${agent.name} did not report a valid current model to switch from.`);
  //   check.fail("switch-model-100ms", `${agent.name} did not report a valid current model to switch from.`);
  // }

  // if (currentModel) {
  //   configOptions =
  //     (await checkSwitchSelectConfigOption({
  //       agentName: agent.name,
  //       check,
  //       connection,
  //       sessionId: session.sessionId,
  //       option: modelOption,
  //       optionLabel: "model",
  //       switchSlug: "switch-model",
  //       timingSlug: "switch-model-100ms",
  //     })) ?? configOptions;
  // }

  // const thinkingEffortOption = findSelectConfigOption(configOptions, "thought_level", [
  //   "thinking",
  //   "thought",
  //   "reasoning",
  //   "effort",
  // ]);

  // await checkSwitchSelectConfigOption({
  //   agentName: agent.name,
  //   check,
  //   connection,
  //   sessionId: session.sessionId,
  //   option: thinkingEffortOption,
  //   optionLabel: "thinking effort",
  //   switchSlug: "switch-thinking-effort",
  //   timingSlug: "switch-thinking-effort-100ms",
  // });
});
