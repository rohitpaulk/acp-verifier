import * as acp from "@agentclientprotocol/sdk";

type NewSessionResult = Awaited<ReturnType<acp.ClientSideConnection["newSession"]>>;

export class AcpClientSession {
  readonly updates: acp.SessionUpdate[] = [];

  constructor(
    readonly sessionId: string,
    public newSessionResult?: NewSessionResult,
  ) {}

  get availableCommands(): acp.AvailableCommand[] {
    return this.latestAvailableCommandsUpdate()?.availableCommands ?? [];
  }

  get slashCommands(): string[] {
    return this.availableCommands.map((command) => `/${command.name}`);
  }

  addUpdate(update: acp.SessionUpdate): void {
    this.updates.push(update);
  }

  private latestAvailableCommandsUpdate():
    | (acp.SessionUpdate & { sessionUpdate: "available_commands_update" })
    | undefined {
    return this.updates.filter((update) => update.sessionUpdate === "available_commands_update").at(-1);
  }
}
