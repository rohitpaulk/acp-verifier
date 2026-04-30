import { expect, test, setDefaultTimeout } from "bun:test";
import { AgentProcess } from "../../lib/agent-process";
import { checkCollectorRegistry, registry } from "../setup";
import * as acp from "@agentclientprotocol/sdk";
import { initAndAuth } from "../helpers";

setDefaultTimeout(15_000);

test.each(registry.agentSlugs)("session/new (%s)", async (slug) => {
  const agent = registry.agentBySlug(slug);
  const check = checkCollectorRegistry.get(slug);

  using proc = new AgentProcess(agent);
  await initAndAuth(proc, agent);

  const session = await proc.connection.newSession({
    cwd: "/tmp",
    mcpServers: [],
  });

  expect(session.sessionId).toBeTruthy();

  session.configOptions!.forEach((option) => {
    expect(option.id).toBeTruthy();
    expect(option.name).toBeTruthy();
  });

  const modeOptions = session.configOptions!.filter((option) => option.category === "mode");

  if (modeOptions.length > 0) {
    check.pass("listing-modes");
  } else {
    check.fail("listing-modes");
  }
});
