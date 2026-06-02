import * as acp from "@agentclientprotocol/sdk";
import { expect, test, setDefaultTimeout } from "bun:test";
import { AcpClient } from "../../lib/acp-client";
import { AgentProcess } from "../../lib/agent-process";
import { checkCollectorRegistry, registry } from "../setup";

setDefaultTimeout(60_000);

test.each(registry.agentSlugs)("streams reasoning via agent_thought_chunk (%s)", async (slug) => {
  const check = checkCollectorRegistry.get(slug);
  const agent = registry.agentBySlug(slug);

  using proc = new AgentProcess(agent);

  const client = new AcpClient(proc);
  await client.initAndAuth();

  const session = await client.newSession({ cwd: "/tmp", mcpServers: [] });
  expect(session.sessionId).toBeTruthy();

  // Try to switch to a GPT model first, since GPT models support streaming reasoning traces.
  const configOptions = session.newSessionResult?.configOptions;
  const modelOption = (configOptions || []).find(
    (configOption) => configOption.category === "model" || configOption.name.toLowerCase() == "model",
  );

  if (modelOption && modelOption.type === "select") {
    const modelValues = (modelOption.options as acp.SessionConfigSelectOption[]).map((option) => option.value);
    const gptModelValue = modelValues.find((modelValue) => modelValue.toLowerCase().includes("5.5"));

    if (gptModelValue && gptModelValue !== modelOption.currentValue) {
      await session.switchOption(modelOption, gptModelValue);
    }
  }

  await client.connection.prompt({
    sessionId: session.sessionId,
    prompt: [
      {
        type: "text",
        text: `Step 1: In your thinking section, list all the days in the week
Step 2: Count the total times the letter "e" & "a" appear across all those days
Step 3: Respond to the user with just the number (no extra output)`,
      },
    ],
  });

  if (session.agentMessages.length != 1) {
    throw new Error(`Expected 1 agent message, got ${session.agentMessages.length}`);
  }

  if (session.agentThoughtMessages.join("").trim().length === 0) {
    check.fail(
      "streams-reasoning",
      `${agent.name} did not include any reasoning traces via agent_thought_chunk session updates.`,
    );
    return;
  }

  const thoughtChunkUpdates = session.thoughtChunkUpdates;

  // Our heuristic is the block was streamed if thoughtChunkUpdates.length > 3 & there are actual contents in the updates
  if (thoughtChunkUpdates.length > 3) {
    check.pass("streams-reasoning", `${agent.name} streamed reasoning traces before the final answer.`);
  } else if (thoughtChunkUpdates.length === 0) {
    check.fail(
      "streams-reasoning",
      `${agent.name} did not stream any reasoning traces via agent_thought_chunk session updates.`,
    );
  } else {
    check.fail(
      "streams-reasoning",
      `${agent.name} emitted a reasoning block but did not stream its contents via agent_thought_chunk session updates.`,
    );
  }
});
