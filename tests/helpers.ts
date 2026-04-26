import { setDefaultTimeout } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentRegistry } from "../lib/agent-registry";
import type { Agent } from "../lib/agent";

// bunfig.toml [test].timeout is not applied when running specific files
setDefaultTimeout(15_000);

export const registry = new AgentRegistry();
await registry.buildAllImages();

export async function initAndAuth(proc: { connection: acp.ClientSideConnection }, agent: Agent) {
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

  return initResult;
}
