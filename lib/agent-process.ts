import { spawn, type ChildProcess } from "node:child_process";
import { Writable, Readable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
import type { Agent } from "./agent";

export class AgentProcess {
  readonly connection: acp.ClientSideConnection;
  private childProcess: ChildProcess;

  constructor(agent: Agent, client?: Partial<acp.Client>) {
    const envFlags = agent.envVars.flatMap((v) => ["-e", v]);

    this.childProcess = spawn("docker", ["run", "-i", "--rm", ...envFlags, agent.imageName], {
      stdio: ["pipe", "pipe", "inherit"],
    });

    const input = Writable.toWeb(this.childProcess.stdin!);
    const output = Readable.toWeb(this.childProcess.stdout!) as ReadableStream<Uint8Array>;

    const fullClient: acp.Client = {
      async requestPermission() {
        throw new Error("denied by test client");
      },
      async sessionUpdate() {},
      ...client,
    };

    const stream = acp.ndJsonStream(input, output);
    this.connection = new acp.ClientSideConnection((_agent) => fullClient, stream);
  }

  [Symbol.dispose](): void {
    this.childProcess.kill();
  }
}
