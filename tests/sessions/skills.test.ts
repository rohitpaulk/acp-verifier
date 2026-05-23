import { expect, test, setDefaultTimeout } from "bun:test";
import { AcpClient } from "../../lib/acp-client";
import { AgentProcess } from "../../lib/agent-process";
import { checkCollectorRegistry, registry } from "../setup";
import { waitUntil } from "../helpers";

setDefaultTimeout(45_000);

test.each(registry.agentSlugs)("loads skills as slash commands (%s)", async (slug) => {
  const check = checkCollectorRegistry.get(slug);
  const agent = registry.agentBySlug(slug);

  using hostWorkspace = agent.createWorkspace();
  hostWorkspace.addSkill("dummy-skill", "Skill used by ACP verifier to check slash command loading.");

  using proc = new AgentProcess(agent, {
    mounts: [{ source: hostWorkspace.path, target: "/workspace" }],
  });

  const client = new AcpClient(proc);
  await client.initAndAuth();

  const session = await client.newSession();
  expect(session.sessionId).toBeTruthy();

  const foundSkill = await waitUntil(() => session.slashCommands.includes("/dummy-skill"));
  const availableCommands = foundSkill ? session.availableCommands : [];
  const skillCommand = availableCommands.find((command) => command.name === "dummy-skill");

  if (skillCommand) {
    expect(skillCommand.description).toBeTruthy();
    check.pass("loads-skills", `${agent.name} loaded skills from ${agent.skillsDir} as slash commands.`);
  } else {
    check.fail("loads-skills", `${agent.name} did not load skills from ${agent.skillsDir} as a slash commands.`);
    check.fail("loads-skills-100ms", `${agent.name} did not load skills from ${agent.skillsDir} as slash commands.`);
    return;
  }

  const secondSession = await client.newSession();
  const secondSessionStartedAt = performance.now();
  const foundSkillInSecondSession = await waitUntil(() => secondSession.slashCommands.includes("/dummy-skill"));

  if (!foundSkillInSecondSession) {
    throw new Error("expected skills in second session");
  }

  const timeTakenMs = Math.round(performance.now() - secondSessionStartedAt);

  if (timeTakenMs <= 100) {
    check.pass("loads-skills-100ms", `${agent.name} loaded skills from ${agent.skillsDir} in ${timeTakenMs}ms.`);
  } else {
    check.fail(
      "loads-skills-100ms",
      `${agent.name} loaded skills from ${agent.skillsDir} in ${timeTakenMs}ms, exceeding the 100ms target.`,
    );
  }
});
