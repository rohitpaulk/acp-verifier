import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { expect, test, setDefaultTimeout } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../../lib/agent-process";
import { checkCollectorRegistry, registry } from "../setup";
import { initAndAuth } from "../helpers";

setDefaultTimeout(45_000);

const COMMAND_OUTPUT = "acp-verifier-terminal-output";

test.each(registry.agentSlugs)("terminal commands (%s)", async (slug) => {
  const check = checkCollectorRegistry.get(slug);
  const agent = registry.agentBySlug(slug);
  const terminalClient = new TestTerminalClient();
  const updates: acp.SessionUpdate[] = [];

  const markerDir = await mkdtemp(join(tmpdir(), "acp-verifier-marker-"));
  const markerFilePath = join(markerDir, `marker-${randomUUID()}.txt`);

  using proc = new AgentProcess(agent, {
    mounts: [{ source: markerDir, target: markerDir }],
  });

  const connection = proc.connect({
    async sessionUpdate(params) {
      updates.push(params.update);
    },
    async requestPermission(params) {
      const allowedOption = params.options.find(
        (option) =>
          option.kind === "allow_once" || option.kind === "allow_always",
      );

      if (!allowedOption) {
        return { outcome: { outcome: "cancelled" } };
      }

      return {
        outcome: { outcome: "selected", optionId: allowedOption.optionId },
      };
    },
    createTerminal: terminalClient.createTerminal,
    terminalOutput: terminalClient.terminalOutput,
    waitForTerminalExit: terminalClient.waitForTerminalExit,
    killTerminal: terminalClient.killTerminal,
    releaseTerminal: terminalClient.releaseTerminal,
  });

  try {
    await initAndAuth(connection, agent, { terminal: true });

    const session = await connection.newSession({
      cwd: markerDir,
      mcpServers: [],
    });

    expect(session.sessionId).toBeTruthy();

    await connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: `Run a single terminal command that (1) prints exactly ${JSON.stringify(COMMAND_OUTPUT)} to stdout, and (2) creates a file at the absolute path ${JSON.stringify(markerFilePath)}. Use the ACP terminal capability rather than simulating the output.`,
        },
      ],
    });

    if (existsSync(markerFilePath)) {
      check.pass(
        "executes-terminal-commands",
        `${agent.name} executed a terminal command that created the expected marker file.`,
      );
    } else {
      check.fail(
        "executes-terminal-commands",
        `${agent.name} did not execute a terminal command (no marker file was created at ${markerFilePath}).`,
      );
    }

    const executeToolCallUpdates = terminalExecuteToolCallUpdates(updates);
    const executeToolOutput = executeToolCallOutputIncludes(
      updates,
      COMMAND_OUTPUT,
    );

    if (terminalClient.outputRequests.length > 0) {
      check.pass(
        "streams-terminal-command-output",
        `${agent.name} requested terminal output ${terminalClient.outputRequests.length} time(s) while the command ran.`,
      );
    } else if (executeToolOutput) {
      check.pass(
        "streams-terminal-command-output",
        `${agent.name} reported terminal command output through ACP execute tool call updates.`,
      );
    } else {
      check.fail(
        "streams-terminal-command-output",
        `${agent.name} did not request terminal output or report command output through ACP execute tool call updates.`,
      );
    }

    const terminalIdsInUpdates = terminalIdsEmbeddedInToolCalls(updates);
    if (terminalIdsInUpdates.length > 0) {
      check.pass(
        "displays-terminal-command-when-in-progress",
        `${agent.name} embedded terminal content in ${terminalIdsInUpdates.length} in-progress tool call update(s).`,
      );
    } else if (executeToolCallUpdates.length > 0) {
      check.pass(
        "displays-terminal-command-when-in-progress",
        `${agent.name} reported the running command through ${executeToolCallUpdates.length} ACP execute tool call update(s).`,
      );
    } else {
      check.fail(
        "displays-terminal-command-when-in-progress",
        `${agent.name} did not embed the active terminal or report an ACP execute tool call update.`,
      );
    }

    const displayedOutput = await terminalOutputWasDisplayed(
      updates,
      terminalClient,
    );
    if (displayedOutput) {
      check.pass(
        "displays-terminal-command-output",
        `${agent.name} left the terminal output containing ${JSON.stringify(COMMAND_OUTPUT)} visible through terminal content.`,
      );
    } else if (executeToolOutput) {
      check.pass(
        "displays-terminal-command-output",
        `${agent.name} left the terminal output containing ${JSON.stringify(COMMAND_OUTPUT)} visible through ACP execute tool call content.`,
      );
    } else {
      check.fail(
        "displays-terminal-command-output",
        `${agent.name} did not leave the terminal output containing ${JSON.stringify(COMMAND_OUTPUT)} visible through terminal or ACP execute tool call content.`,
      );
    }
  } finally {
    await terminalClient.releaseAll();
    await rm(markerDir, { recursive: true, force: true }).catch(() => {});
  }
});

class TestTerminalClient {
  readonly createdTerminals: acp.CreateTerminalRequest[] = [];
  readonly outputRequests: acp.TerminalOutputRequest[] = [];
  readonly terminals = new Map<string, TestTerminal>();
  readonly releasedTerminalOutputs = new Map<string, string>();

  createTerminal = async (
    params: acp.CreateTerminalRequest,
  ): Promise<acp.CreateTerminalResponse> => {
    const id = randomUUID();
    const terminal = new TestTerminal(params);
    this.createdTerminals.push(params);
    this.terminals.set(id, terminal);
    return { terminalId: id };
  };

  terminalOutput = async (
    params: acp.TerminalOutputRequest,
  ): Promise<acp.TerminalOutputResponse> => {
    this.outputRequests.push(params);
    return this.getTerminal(params.terminalId).currentOutput();
  };

  waitForTerminalExit = async (
    params: acp.WaitForTerminalExitRequest,
  ): Promise<acp.WaitForTerminalExitResponse> => {
    return this.getTerminal(params.terminalId).waitForExit();
  };

  killTerminal = async (
    params: acp.KillTerminalRequest,
  ): Promise<acp.KillTerminalResponse> => {
    this.getTerminal(params.terminalId).kill();
    return {};
  };

  releaseTerminal = async (
    params: acp.ReleaseTerminalRequest,
  ): Promise<acp.ReleaseTerminalResponse> => {
    const terminal = this.getTerminal(params.terminalId);
    await terminal.release();
    this.releasedTerminalOutputs.set(
      params.terminalId,
      terminal.currentOutput().output,
    );
    this.terminals.delete(params.terminalId);
    return {};
  };

  async releaseAll(): Promise<void> {
    await Promise.all(
      [...this.terminals.values()].map((terminal) => terminal.release()),
    );
    this.terminals.clear();
  }

  private getTerminal(id: string): TestTerminal {
    const terminal = this.terminals.get(id);
    if (!terminal) {
      throw new Error(`Unknown terminal: ${id}`);
    }
    return terminal;
  }
}

class TestTerminal {
  private readonly childProcess: ChildProcess;
  private output = "";
  private truncated = false;
  private exitStatus: acp.TerminalExitStatus | null | undefined;
  private readonly exited: Promise<acp.TerminalExitStatus>;
  private readonly outputByteLimit?: number | null;

  constructor(params: acp.CreateTerminalRequest) {
    this.outputByteLimit = params.outputByteLimit;
    this.childProcess = spawn(params.command, params.args ?? [], {
      cwd: validCwd(params.cwd),
      env: applyEnvironment(params.env),
      stdio: ["ignore", "pipe", "pipe"],
    });

    this.childProcess.stdout?.on("data", (chunk: Buffer) =>
      this.appendOutput(chunk),
    );
    this.childProcess.stderr?.on("data", (chunk: Buffer) =>
      this.appendOutput(chunk),
    );

    this.exited = new Promise((resolve) => {
      this.childProcess.on("error", (error) => {
        this.appendOutput(Buffer.from(`${error.message}\n`));
        this.exitStatus = { exitCode: 1, signal: null };
        resolve(this.exitStatus);
      });

      this.childProcess.on("exit", (exitCode, signal) => {
        this.exitStatus = {
          exitCode,
          signal,
        };
        resolve(this.exitStatus);
      });
    });
  }

  currentOutput(): acp.TerminalOutputResponse {
    return {
      output: this.output,
      truncated: this.truncated,
      exitStatus: this.exitStatus,
    };
  }

  async waitForExit(): Promise<acp.WaitForTerminalExitResponse> {
    return this.exited;
  }

  kill(): void {
    if (!this.childProcess.killed && this.exitStatus === undefined) {
      this.childProcess.kill();
    }
  }

  async release(): Promise<void> {
    this.kill();
    await Promise.race([this.exited, Bun.sleep(1_000)]);
  }

  private appendOutput(chunk: Buffer): void {
    this.output += chunk.toString();

    if (
      this.outputByteLimit &&
      Buffer.byteLength(this.output) > this.outputByteLimit
    ) {
      this.truncated = true;
      while (Buffer.byteLength(this.output) > this.outputByteLimit) {
        this.output = this.output.slice(1);
      }
    }
  }
}

function applyEnvironment(env?: acp.EnvVariable[]): NodeJS.ProcessEnv {
  const result = { ...process.env };

  for (const variable of env ?? []) {
    result[variable.name] = variable.value;
  }

  return result;
}

function validCwd(cwd?: string | null): string | undefined {
  return cwd && existsSync(cwd) ? cwd : undefined;
}

function terminalIdsEmbeddedInToolCalls(
  updates: acp.SessionUpdate[],
): string[] {
  return updates.flatMap((update) =>
    toolCallContent(update)
      .filter(
        (content): content is acp.Terminal & { type: "terminal" } =>
          content.type === "terminal",
      )
      .map((content) => content.terminalId),
  );
}

function terminalExecuteToolCallUpdates(
  updates: acp.SessionUpdate[],
): acp.SessionUpdate[] {
  const executeToolCallIds = terminalExecuteToolCallIds(updates);

  return updates.filter((update) => {
    if (
      update.sessionUpdate !== "tool_call" &&
      update.sessionUpdate !== "tool_call_update"
    ) {
      return false;
    }

    return executeToolCallIds.has(update.toolCallId);
  });
}

function terminalExecuteToolCallIds(updates: acp.SessionUpdate[]): Set<string> {
  const ids = new Set<string>();

  for (const update of updates) {
    if (
      update.sessionUpdate !== "tool_call" &&
      update.sessionUpdate !== "tool_call_update"
    ) {
      continue;
    }

    if (update.kind === "execute" || update.title === "Terminal") {
      ids.add(update.toolCallId);
    }
  }

  return ids;
}

function executeToolCallOutputIncludes(
  updates: acp.SessionUpdate[],
  text: string,
): boolean {
  return terminalExecuteToolCallUpdates(updates).some((update) =>
    toolCallContent(update).some(
      (content) =>
        content.type === "content" &&
        content.content.type === "text" &&
        content.content.text.includes(text),
    ),
  );
}

async function terminalOutputWasDisplayed(
  updates: acp.SessionUpdate[],
  terminalClient: TestTerminalClient,
): Promise<boolean> {
  const terminalIds = terminalIdsEmbeddedInToolCalls(updates);
  await waitUntilTerminalOutputIncludes(
    terminalClient,
    terminalIds,
    COMMAND_OUTPUT,
    1_000,
  );

  return terminalIds.some((terminalId) => {
    const terminal = terminalClient.terminals.get(terminalId);
    const output =
      terminal?.currentOutput().output ??
      terminalClient.releasedTerminalOutputs.get(terminalId);
    return output?.includes(COMMAND_OUTPUT) ?? false;
  });
}

async function waitUntilTerminalOutputIncludes(
  terminalClient: TestTerminalClient,
  terminalIds: string[],
  text: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = performance.now() + timeoutMs;

  while (performance.now() < deadline) {
    if (
      terminalIds.some((terminalId) => {
        const terminal = terminalClient.terminals.get(terminalId);
        const output =
          terminal?.currentOutput().output ??
          terminalClient.releasedTerminalOutputs.get(terminalId);
        return output?.includes(text) ?? false;
      })
    ) {
      return;
    }

    await Bun.sleep(25);
  }
}

function toolCallContent(update: acp.SessionUpdate): acp.ToolCallContent[] {
  if (
    update.sessionUpdate !== "tool_call" &&
    update.sessionUpdate !== "tool_call_update"
  ) {
    return [];
  }

  return update.content ?? [];
}
