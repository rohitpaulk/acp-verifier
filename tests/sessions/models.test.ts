import { expect, test, setDefaultTimeout } from "bun:test";
import { AgentProcess } from "../../lib/agent-process";
import { checkCollectorRegistry, registry } from "../setup";
import * as acp from "@agentclientprotocol/sdk";
import { initAndAuth } from "../helpers";

setDefaultTimeout(15_000);

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

  if (!session.configOptions) {
    check.fail("list-models", `${agent.name} did not list any models as config options.`);
    check.fail("switch-model", `${agent.name} does not support switching models`);
    check.fail("switch-model-500ms", `${agent.name} does not support switching models`);
    check.fail("switch-thinking-effort", `${agent.name} does not support switching thinking effort`);
    check.fail("switch-thinking-effort-500ms", `${agent.name} does not support switching thinking effort`);

    return;
  }
});
