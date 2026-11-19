import assert from "node:assert/strict";
import test from "node:test";

import { pickDefaultProjectsAgent } from "./projectAgentSelection.ts";

test("picks the first running agent", () => {
  const builder = { name: "Builder", personaId: "custom:builder" };
  const reviewer = { name: "Reviewer", personaId: "custom:reviewer" };
  assert.equal(pickDefaultProjectsAgent([builder, reviewer]), builder);
});

test("returns null when no agent is running", () => {
  assert.equal(pickDefaultProjectsAgent([]), null);
});
