import * as acp from "@agentclientprotocol/sdk";
import _ from "lodash";

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

  get agentMessageChunkUpdates(): (acp.SessionUpdate & { sessionUpdate: "agent_message_chunk" })[] {
    return this.updates.filter((update) => update.sessionUpdate === "agent_message_chunk");
  }

  get agentMessages(): string[] {
    return _.values(_.groupBy(this.agentMessageChunkUpdates, (update) => update.messageId)).map(
      (group) =>
        group
          .map((update) => (update.content.type === "text" ? update.content.text : ""))
          .join(""),
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

  private latestAvailableCommandsUpdate():
    | (acp.SessionUpdate & { sessionUpdate: "available_commands_update" })
    | undefined {
    return this.updates.filter((update) => update.sessionUpdate === "available_commands_update").at(-1);
  }
}
