import { expect, test } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentRegistry } from "../lib/agent-registry";
import { AgentProcess } from "../lib/agent-process";

const registry = new AgentRegistry();
await registry.buildAllImages();

test.each(registry.agentNames)(
  "%s: agent responds with single word",
  async (name) => {
    const agent = registry.agentByName(name);
    const agentTextChunks: string[] = [];

    using proc = new AgentProcess(agent, {
      async sessionUpdate(params) {
        const update = params.update;
        if (update.sessionUpdate === "agent_message_chunk" && update.content.type === "text") {
          agentTextChunks.push(update.content.text);
        }
      },
    });

    const initResult = await proc.connection.initialize({
      protocolVersion: acp.PROTOCOL_VERSION,
      clientCapabilities: {},
      clientInfo: { name: "acp-verifier", version: "0.1.0" },
    });

    if (initResult.authMethods?.length) {
      const envVarMethod = initResult.authMethods.find(
        (m): m is acp.AuthMethodEnvVar & { type: "env_var" } =>
          "type" in m &&
          m.type === "env_var" &&
          m.vars.every((v) => v.optional || agent.envVars.includes(v.name)),
      );
      if (envVarMethod) {
        await proc.connection.authenticate({ methodId: envVarMethod.id });
      }
    }

    const sessionResult = await proc.connection.newSession({
      cwd: "/tmp",
      mcpServers: [],
    });
    expect(sessionResult.sessionId).toBeTruthy();

    const configOptions = sessionResult.configOptions;

    if (configOptions) {
      for (const [id, pickIndex] of [
        ["model", -1],
        ["reasoning_effort", 0],
      ] as const) {
        const option = configOptions.find((o) => o.id === id);
        if (!option || option.type !== "select") continue;

        const flatOptions = option.options.flatMap((o) => ("options" in o ? o.options : [o]));
        if (flatOptions.length === 0) continue;

        const picked = flatOptions.at(pickIndex) ?? flatOptions[flatOptions.length - 1]!;
        try {
          await proc.connection.setSessionConfigOption({
            sessionId: sessionResult.sessionId,
            configId: id,
            value: picked.value,
          });
        } catch {
          // Some agents reject certain config options (e.g. reasoning_effort for models that don't support it)
        }
      }
    }

    const promptResult = await proc.connection.prompt({
      sessionId: sessionResult.sessionId,
      prompt: [{ type: "text", text: "say exactly one word: hi" }],
    });

    expect(promptResult.stopReason).toBe("end_turn");

    const agentText = agentTextChunks.join("");
    expect(agentText.trim().toLowerCase()).toBe("hi");
  },
);
