import * as acp from "@agentclientprotocol/sdk";
import { expect, setDefaultTimeout, test } from "bun:test";
import { AgentProcess } from "../../lib/agent-process";
import { initAndAuth } from "../helpers";
import { checkCollectorRegistry, registry } from "../setup";

setDefaultTimeout(15_000);

async function switchOption(
  connection: acp.ClientSideConnection,
  sessionId: string,
  option: acp.SessionConfigOption & { type: "select" },
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
  const elapsedMs = Math.round(performance.now() - start);

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

  const reasoningOption = (configOptions || []).find((configOption) => configOption.category === "thought_level");

  if (!reasoningOption) {
    check.fail("switch-thinking-effort", `${agent.name} does not support switching thinking effort.`);
    check.fail("switch-thinking-effort-100ms", `${agent.name} does not support switching thinking effort.`);

    return;
  }

  if (reasoningOption.type != "select") {
    throw new Error("Expected reasoningOption to be a select");
  }

  const reasoningValues = (reasoningOption.options as acp.SessionConfigSelectOption[]).map((option) => option.value);
  const reasoningValueToSwitchTo = reasoningValues.find((value) => value != reasoningOption.currentValue);

  if (!reasoningValueToSwitchTo) {
    throw new Error("no reasoning value found to switch to");
  }

  const tStart = performance.now();
  await switchOption(connection, session.sessionId, reasoningOption, reasoningValueToSwitchTo);
  const tElapsedMs = Math.round(performance.now() - tStart);

  check.pass(
    "switch-thinking-effort",
    `${agent.name} successfully switched thinking effort from "${reasoningOption.currentValue}" to "${reasoningValueToSwitchTo}".`,
  );

  if (elapsedMs <= 100) {
    check.pass(
      "switch-thinking-effort-100ms",
      `${agent.name} took ${tElapsedMs}ms to switch thinking effort from "${reasoningOption.currentValue}" to "${reasoningValueToSwitchTo}".`,
    );
  } else {
    check.fail(
      "switch-thinking-effort-100ms",
      `${agent.name} took ${tElapsedMs}ms to switch thinking effort from "${reasoningOption.currentValue}" to "${reasoningValueToSwitchTo}", exceeding the 100ms threshold.`,
    );
  }
});
