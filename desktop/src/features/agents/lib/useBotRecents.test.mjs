import assert from "node:assert/strict";
import test from "node:test";

import { pickQuickBotPersonas } from "./useBotRecents.ts";

function createPersona(id, displayName) {
  return {
    id,
    displayName,
    avatarUrl: null,
    systemPrompt: `${displayName} prompt`,
    runtime: null,
    model: null,
    isBuiltIn: false,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

test("pickQuickBotPersonas prefers recents before the rest of the catalog", () => {
  const personas = [
    createPersona("custom:planner", "Planner"),
    createPersona("custom:reviewer", "Reviewer"),
  ];

  assert.deepEqual(
    pickQuickBotPersonas(personas, ["custom:reviewer"]).map(
      (persona) => persona.id,
    ),
    ["custom:reviewer", "custom:planner"],
  );
});

test("pickQuickBotPersonas with no history keeps catalog order and promotes no bee names", () => {
  const personas = [
    createPersona("custom:reviewer", "Reviewer"),
    createPersona("custom:pollen", "Pollen"),
    createPersona("custom:honey", "Honey"),
    createPersona("custom:fizz", "Fizz"),
  ];

  assert.deepEqual(
    pickQuickBotPersonas(personas, []).map((persona) => persona.id),
    ["custom:reviewer", "custom:pollen", "custom:honey"],
  );
});

test("pickQuickBotPersonas with no history and no personas returns nothing", () => {
  assert.deepEqual(pickQuickBotPersonas([], []), []);
});

test("pickQuickBotPersonas skips duplicate and missing recents", () => {
  const personas = [
    createPersona("custom:planner", "Planner"),
    createPersona("custom:writer", "Writer"),
  ];

  assert.deepEqual(
    pickQuickBotPersonas(personas, [
      "custom:planner",
      "missing",
      "custom:planner",
      "custom:writer",
    ]).map((persona) => persona.id),
    ["custom:planner", "custom:writer"],
  );
});
