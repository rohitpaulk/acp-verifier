import * as acp from "@agentclientprotocol/sdk";
import _ from "lodash";

type NewSessionResult = Awaited<ReturnType<acp.ClientSideConnection["newSession"]>>;

export class AcpClientSession {
  readonly updates: acp.SessionUpdate[] = [];

  constructor(
    readonly connection: acp.ClientSideConnection,
    readonly sessionId: string,
    public newSessionResult?: NewSessionResult,
  ) {}

  get availableCommands(): acp.AvailableCommand[] {
    return this.latestAvailableCommandsUpdate()?.availableCommands ?? [];
  }

  get agentMessageChunkUpdates(): (acp.SessionUpdate & { sessionUpdate: "agent_message_chunk" })[] {
    return this.updates.filter((update) => update.sessionUpdate === "agent_message_chunk");
  }

  get agentMessages(): string[] {
    return _.values(_.groupBy(this.agentMessageChunkUpdates, (update) => update.messageId)).map((group) =>
      group.map((update) => (update.content.type === "text" ? update.content.text : "")).join(""),
    );
  }

  get slashCommands(): string[] {
    return this.availableCommands.map((command) => `/${command.name}`);
  }

  get thoughtChunkUpdates(): (acp.SessionUpdate & { sessionUpdate: "agent_thought_chunk" })[] {
    return this.updates.filter((update) => update.sessionUpdate === "agent_thought_chunk");
  }

  addUpdate(update: acp.SessionUpdate): void {
    this.updates.push(update);
  }

  async switchOption(option: acp.SessionConfigOption & { type: "select" }, newValue: string): Promise<void> {
    let result: acp.SetSessionConfigOptionResponse;

    result = await this.connection.setSessionConfigOption({
      sessionId: this.sessionId,
      configId: option.id,
      value: newValue,
    });

    const updatedOption = result.configOptions.find((candidate) => candidate.id === option.id)!;

    if (updatedOption.currentValue !== newValue) {
      throw new Error(
        `Expected ${option.name} to switch to ${newValue}, but current value is ${updatedOption.currentValue}.`,
      );
    }
  }

  private latestAvailableCommandsUpdate():
    | (acp.SessionUpdate & { sessionUpdate: "available_commands_update" })
    | undefined {
    return this.updates.filter((update) => update.sessionUpdate === "available_commands_update").at(-1);
  }
}
