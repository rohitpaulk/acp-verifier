import chalk from "chalk";
import { execa, parseCommandString } from "execa";
import { resolve } from "path";

const AGENTS_DIR = resolve(import.meta.dir, "../agents");

class CommandRunner {
  public static async run(commandWithArgs: string, options: { logPrefix: string }): Promise<void> {
    const colorizedPrefix = `${chalk.cyan(options.logPrefix)}]`;

    const logTransform = function* (line: unknown) {
      yield `${colorizedPrefix} ${line}`;
    };

    const [command, ...args] = parseCommandString(commandWithArgs);

    await execa(command!, args, {
      stdout: [logTransform, "inherit"],
      stderr: [logTransform, "inherit"],
    });
  }
}

export default CommandRunner;
