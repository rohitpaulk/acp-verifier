import { expect, test, setDefaultTimeout } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../lib/agent-process";
import { checkCollectorRegistry, registry } from "./setup";
import { initAndAuth } from "./helpers";

setDefaultTimeout(15_000);

test.each(registry.agentSlugs)("responds to initialize within 500ms (%s)", async (slug) => {
  const check = checkCollectorRegistry.get(slug);
  const agent = registry.agentBySlug(slug);

  using proc = new AgentProcess(agent);

  const connection = proc.connect();
  const start = performance.now();

  await connection.initialize({
    protocolVersion: acp.PROTOCOL_VERSION,
    clientCapabilities: {},
    clientInfo: { name: "acp-verifier", version: "0.1.0" },
  });

  const elapsedMs = Math.round(performance.now() - start);

  if (elapsedMs <= 500) {
    check.pass(
      "boot-time-500ms",
      `${agent.name} booted and responded to initialize in ${elapsedMs}ms.`,
    );
  } else {
    check.fail(
      "boot-time-500ms",
      `${agent.name} booted and responded to initialize in ${elapsedMs}ms, exceeding the 500ms target.`,
    );
  }
});

test.each(registry.agentSlugs)("new session within 500ms (%s)", async (slug) => {
  const agent = registry.agentBySlug(slug);
  const check = checkCollectorRegistry.get(slug);

  using proc = new AgentProcess(agent);

  const connection = proc.connect();
  const start = performance.now();

  await initAndAuth(connection, agent);

  const session = await connection.newSession({
    cwd: "/tmp",
    mcpServers: [],
  });

  const elapsedMs = Math.round(performance.now() - start);

  expect(session.sessionId).toBeTruthy();

  if (elapsedMs <= 500) {
    check.pass(
      "new-session-500ms",
      `${agent.name} initialized and created a new session in ${elapsedMs}ms.`,
    );
  } else {
    check.fail(
      "new-session-500ms",
      `${agent.name} took ${elapsedMs}ms to initialize and create a new session, exceeding the 500ms target.`,
    );
  }
});
