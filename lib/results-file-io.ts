import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { ResultsFile, type ResultsFileJSON } from "../web/src/results-file";

export function readResultsFile(path: string): ResultsFile {
  if (!existsSync(path)) {
    return ResultsFile.empty();
  }

  const parsed = JSON.parse(readFileSync(path, "utf-8")) as ResultsFileJSON;

  return ResultsFile.fromJSON(parsed);
}

export function writeResultsFile(path: string, results: ResultsFile): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(results, null, 2) + "\n");
}
