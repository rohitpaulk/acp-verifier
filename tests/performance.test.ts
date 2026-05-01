import { expect, test, setDefaultTimeout } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../lib/agent-process";
import { checkCollectorRegistry, registry } from "./setup";
import { initAndAuth } from "./helpers";

setDefaultTimeout(15_000);

test.each(registry.agentSlugs)("responds to initialize within 500ms (%s)", async (slug) => {
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
    check.pass("first-session-500ms", `${agent.name} booted and created a new session in ${elapsedMs}ms.`);
  } else {
    check.fail(
      "first-session-500ms",
      `${agent.name} took ${elapsedMs}ms to boot and create a new session, exceeding the 500ms target.`,
    );
  }
});

test.each(registry.agentSlugs)("new session within 500ms (%s)", async (slug) => {
  const agent = registry.agentBySlug(slug);
  const check = checkCollectorRegistry.get(slug);

  using proc = new AgentProcess(agent);

  const connection = proc.connect();

  await initAndAuth(connection, agent);

  const firstSession = await connection.newSession({
    cwd: "/tmp",
    mcpServers: [],
  });

  expect(firstSession.sessionId).toBeTruthy();

  const start = performance.now();

  const nextSession = await connection.newSession({
    cwd: "/tmp",
    mcpServers: [],
  });

  const elapsedMs = Math.round(performance.now() - start);

  expect(nextSession.sessionId).toBeTruthy();

  if (elapsedMs <= 500) {
    check.pass("new-session-500ms", `${agent.name} created a new session in ${elapsedMs}ms.`);
  } else {
    check.fail(
      "new-session-500ms",
      `${agent.name} took ${elapsedMs}ms to create a new session, exceeding the 500ms target.`,
    );
  }
});
