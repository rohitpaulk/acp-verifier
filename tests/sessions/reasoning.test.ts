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

  await client.connection.prompt({
    sessionId: session.sessionId,
    prompt: [
      {
        type: "text",
        text: "Use your reasoning capability to count from 1 till 25, then pick a random number. Respond with only the final number, but include the full thinking in your reasoning.",
      },
    ],
  });

  if (session.agentMessages.length != 1) {
    throw new Error(`Expected 1 agent message, got ${session.agentMessages.length}`);
  }

  const thoughtChunkUpdates = session.thoughtChunkUpdates;

  if (thoughtChunkUpdates.length > 5) {
    check.pass("streams-reasoning", `${agent.name} streamed reasoning traces before the final answer.`);
  } else if (thoughtChunkUpdates.length === 0) {
    check.fail(
      "streams-reasoning",
      `${agent.name} did not stream any reasoning traces via agent_thought_chunk session updates.`,
    );
  } else {
    throw new Error("handle cases where reasoning traces are not streamed? <5 updates is sus");
  }
});
