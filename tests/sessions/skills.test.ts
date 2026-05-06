import { expect, test, setDefaultTimeout } from "bun:test";
import { AcpClient } from "../../lib/acp-client";
import { AgentProcess } from "../../lib/agent-process";
import { checkCollectorRegistry, registry } from "../setup";
import { waitUntil } from "../helpers";

setDefaultTimeout(15_000);

test.each(registry.agentSlugs)("loads skills as slash commands (%s)", async (slug) => {
  const check = checkCollectorRegistry.get(slug);
  const agent = registry.agentBySlug(slug);

  using hostWorkspace = agent.createWorkspace();
  hostWorkspace.addSkill("dummy-skill", "Skill used by ACP verifier to check slash command loading.");

  const loadStart = performance.now();

  using proc = new AgentProcess(agent, {
    mounts: [{ source: hostWorkspace.path, target: "/workspace" }],
  });

  const client = new AcpClient(proc);
  await client.initAndAuth();

  const session = await client.newSession();

  expect(session.sessionId).toBeTruthy();

  const foundSkill = await waitUntil(() => session.slashCommands.includes("/dummy-skill"));
  const availableCommands = foundSkill ? session.availableCommands : [];
  const loadElapsedMs = Math.round(performance.now() - loadStart);
  const skillCommand = availableCommands.find((command) => command.name === "dummy-skill");

  if (skillCommand) {
    expect(skillCommand.description).toBeTruthy();
    check.pass("loads-skills", `${agent.name} advertised the dummy-skill skill as a slash command.`);
  } else {
    check.fail(
      "loads-skills",
      `${agent.name} did not advertise the dummy-skill skill as a slash command within 5000ms.`,
    );
  }

  if (skillCommand && loadElapsedMs <= 500) {
    check.pass("loads-skills-500ms", `${agent.name} advertised the dummy-skill skill in ${loadElapsedMs}ms.`);
  } else if (skillCommand) {
    check.fail(
      "loads-skills-500ms",
      `${agent.name} advertised the dummy-skill skill in ${loadElapsedMs}ms, exceeding the 500ms target.`,
    );
  } else {
    check.fail("loads-skills-500ms", `${agent.name} did not advertise the dummy-skill skill within the 500ms target.`);
  }
});
