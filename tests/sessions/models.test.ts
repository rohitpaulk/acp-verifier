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

async function switchOption(
  connection: acp.ClientSideConnection,
  sessionId: string,
  option: SelectConfigOption,
  newValue: string,
): Promise<void> {
  let result: acp.SetSessionConfigOptionResponse;

  result = await connection.setSessionConfigOption({
    sessionId,
    configId: option.id,
    value: newValue,
  });

  const updatedOption = result.configOptions.find((candidate) => candidate.id === option.id)!;

  if (updatedOption.currentValue !== newValue) {
    throw new Error(
      `Expected ${option.name} to switch to ${newValue}, but current value is ${updatedOption.currentValue}.`,
    );
  }
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
    `${agent.name} listed ${modelOption.options.length} models as available, with "${modelOption.currentValue}" as the default.`,
  );

  const modelValues = (modelOption.options as acp.SessionConfigSelectOption[]).map((option) => option.value);
  const modelValueToSwitchTo = modelValues.find((modelValue) => modelValue != modelOption.currentValue);

  if (!modelValueToSwitchTo) {
    throw new Error("no model value found to switch to");
  }

  const start = performance.now();
  await switchOption(connection, session.sessionId, modelOption, modelValueToSwitchTo);
  const elapsedMs = performance.now() - start;

  check.pass(
    "switch-model",
    `${agent.name} successfully switched models from "${modelOption.currentValue}" to "${modelValueToSwitchTo}".`,
  );

  if (elapsedMs <= 100) {
    check.pass(
      "switch-model-100ms",
      `${agent.name} took ${elapsedMs}ms to switch models from "${modelOption.currentValue}" to "${modelValueToSwitchTo}".`,
    );
  } else {
    check.fail(
      "switch-model-100ms",
      `${agent.name} took ${elapsedMs}ms to switch models from "${modelOption.currentValue}" to "${modelValueToSwitchTo}", exceeding the 100ms threshold.`,
    );
  }

  const thoughtLevelOption = (configOptions || []).find((configOption) => configOption.category === "thought_level");

  if (!thoughtLevelOption) {
    check.fail("switch-thinking-effort", `${agent.name} does not support switching thinking effort.`);
    check.fail("switch-thinking-effort-100ms", `${agent.name} does not support switching thinking effort.`);

    return;
  }

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
