import { setDefaultTimeout } from "bun:test";
import { AgentRegistry } from "../lib/agent-registry";

setDefaultTimeout(15_000);

export const registry = new AgentRegistry();
await registry.buildAllImages();
