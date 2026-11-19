import assert from "node:assert/strict";
import test from "node:test";

import { buildRelayAgentRows } from "./relayAgentRows.ts";

const VIEWER = "a".repeat(64);
const OTHER_OWNER = "b".repeat(64);

function relayAgent(overrides = {}) {
  return {
    pubkey: "c".repeat(64),
    ownerPubkey: VIEWER,
    name: "Planner",
    agentType: "agent",
    channels: [],
    channelIds: [],
    capabilities: [],
    status: "unknown",
    respondTo: "owner-only",
    respondToAllowlist: [],
    ...overrides,
  };
}

function build(relayAgents, overrides = {}) {
  return buildRelayAgentRows({
    relayAgents,
    managedPubkeys: [],
    currentPubkey: VIEWER,
    ownerProfiles: undefined,
    ...overrides,
  });
}

test("a relay agent owned by the viewer is labelled as yours and keeps its policy", () => {
  const rows = build([relayAgent({ respondTo: "allowlist" })]);

  assert.deepEqual(rows, [
    {
      pubkey: "c".repeat(64),
      name: "Planner",
      ownerLabel: "you",
      respondTo: "allowlist",
      channels: [],
    },
  ]);
});

test("a relay agent owned by someone else shows the owner's display name", () => {
  const rows = build([relayAgent({ ownerPubkey: OTHER_OWNER })], {
    ownerProfiles: {
      [OTHER_OWNER]: {
        displayName: "Sam Example",
        avatarUrl: null,
        nip05Handle: null,
        ownerPubkey: null,
      },
    },
  });

  assert.equal(rows[0].ownerLabel, "Sam Example");
});

test("a relay agent that is also a local managed agent is left to the local section", () => {
  const sharedPubkey = "d".repeat(64);
  const rows = build(
    [
      relayAgent({ pubkey: sharedPubkey.toUpperCase(), name: "Local twin" }),
      relayAgent({ pubkey: "e".repeat(64), name: "Remote only" }),
    ],
    { managedPubkeys: [sharedPubkey] },
  );

  assert.deepEqual(
    rows.map((row) => row.name),
    ["Remote only"],
  );
});

test("channel names without a matching id are dropped instead of used as ids", () => {
  const rows = build([
    relayAgent({
      channels: ["general", "design", "orphan"],
      channelIds: ["chan-1", "", undefined],
    }),
  ]);

  assert.deepEqual(rows[0].channels, [{ id: "chan-1", name: "general" }]);
});

test("a relay agent without a published policy is marked unknown", () => {
  const rows = build([relayAgent({ respondTo: null })]);

  assert.equal(rows[0].respondTo, "unknown");
});

test("rows are sorted by name without regard to case", () => {
  const rows = build([
    relayAgent({ pubkey: "1".repeat(64), name: "zeta" }),
    relayAgent({ pubkey: "2".repeat(64), name: "Alpha" }),
    relayAgent({ pubkey: "3".repeat(64), name: "beta" }),
  ]);

  assert.deepEqual(
    rows.map((row) => row.name),
    ["Alpha", "beta", "zeta"],
  );
});

test("no relay agents produce no rows", () => {
  assert.deepEqual(build([]), []);
});
