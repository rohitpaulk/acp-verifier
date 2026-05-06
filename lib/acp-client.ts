import * as acp from "@agentclientprotocol/sdk";
import type { AgentProcess } from "./agent-process";
import { AcpClientSession } from "./acp-client-session";

export { AcpClientSession } from "./acp-client-session";

type NewSessionParams = Parameters<acp.ClientSideConnection["newSession"]>[0];
type NewSessionResult = Awaited<ReturnType<acp.ClientSideConnection["newSession"]>>;

export class AcpClient {
  readonly connection: acp.ClientSideConnection;
  readonly sessions = new Map<string, AcpClientSession>();
  initResult?: acp.InitializeResponse;

  constructor(readonly proc: AgentProcess) {
    this.connection = proc.connect({
      sessionUpdate: async (params) => {
        this.processSessionUpdate(params.sessionId, params.update);
      },
    });
  }

  async initAndAuth(clientCapabilities: acp.ClientCapabilities = {}): Promise<acp.InitializeResponse> {
    const initResult = await this.connection.initialize({
      protocolVersion: acp.PROTOCOL_VERSION,
      clientCapabilities,
      clientInfo: { name: "acp-verifier", version: "0.1.0" },
    });

    if (initResult.authMethods?.length) {
      const envVarMethod = initResult.authMethods.find(
        (m): m is acp.AuthMethodEnvVar & { type: "env_var" } =>
          "type" in m &&
          m.type === "env_var" &&
          m.vars.every((v) => v.optional || Object.keys(this.proc.agent.env).includes(v.name)),
      );

      if (envVarMethod) {
        await this.connection.authenticate({ methodId: envVarMethod.id });
      }
    }

    this.initResult = initResult;
    return initResult;
  }

  async newSession(params: NewSessionParams = { cwd: "/workspace", mcpServers: [] }): Promise<AcpClientSession> {
    const result = await this.connection.newSession(params);
    const session = this.sessionFor(result.sessionId, result);
    return session;
  }

  private processSessionUpdate(sessionId: string, update: acp.SessionUpdate): void {
    this.sessionFor(sessionId).addUpdate(update);
  }

  private sessionFor(sessionId: string, newSessionResult?: NewSessionResult): AcpClientSession {
    const existing = this.sessions.get(sessionId);

    if (existing) {
      existing.newSessionResult ??= newSessionResult;
      return existing;
    }

    const session = new AcpClientSession(sessionId, newSessionResult);
    this.sessions.set(sessionId, session);
    return session;
  }
}
