import assert from "node:assert/strict";
import test from "node:test";

import React, { act } from "react";
import { createRoot } from "react-dom/client";

import { RelayAgentsSection } from "./RelayAgentsSection.tsx";

const PLANNER = "a".repeat(64);
const REVIEWER = "b".repeat(64);

const ROWS = [
  {
    pubkey: PLANNER,
    name: "Planner",
    ownerLabel: "you",
    respondTo: "owner-only",
    channels: [
      { id: "chan-general", name: "general" },
      { id: "chan-design", name: "design" },
    ],
  },
  {
    pubkey: REVIEWER,
    name: "Reviewer",
    ownerLabel: "Sam Example",
    respondTo: "anyone",
    channels: [{ id: "chan-review", name: "review" }],
  },
];

async function renderSection(overrides = {}) {
  const calls = { channels: [], profiles: [], retries: 0 };
  const props = {
    rows: ROWS,
    isLoading: false,
    error: null,
    onRetry: () => {
      calls.retries += 1;
    },
    onOpenProfile: (pubkey) => calls.profiles.push(pubkey),
    onOpenChannel: (channelId) => calls.channels.push(channelId),
    ...overrides,
  };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () =>
    root.render(React.createElement(RelayAgentsSection, props)),
  );
  const cleanup = async () => {
    await act(async () => root.unmount());
    container.remove();
  };
  return { calls, container, cleanup };
}

function buttonByText(container, text) {
  return [...container.querySelectorAll("button")].find(
    (button) => button.textContent.trim() === text,
  );
}

test("relay agent rows show name, owner, response policy and channel pills", async () => {
  const { container, cleanup } = await renderSection();
  try {
    const planner = container.querySelector(
      `[data-testid="relay-agent-row-${PLANNER}"]`,
    );
    const reviewer = container.querySelector(
      `[data-testid="relay-agent-row-${REVIEWER}"]`,
    );
    assert.ok(planner && reviewer);

    assert.ok(planner.textContent.includes("Planner"));
    assert.ok(planner.textContent.includes("Managed by you"));
    assert.ok(planner.textContent.includes("Owner only"));
    assert.ok(planner.textContent.includes("# general"));
    assert.ok(planner.textContent.includes("# design"));

    assert.ok(reviewer.textContent.includes("Reviewer"));
    assert.ok(reviewer.textContent.includes("Managed by Sam Example"));
    assert.ok(reviewer.textContent.includes("Anyone"));
    assert.ok(reviewer.textContent.includes("# review"));
  } finally {
    await cleanup();
  }
});

test("clicking a channel pill navigates to that channel id", async () => {
  const { calls, container, cleanup } = await renderSection();
  try {
    await act(async () => buttonByText(container, "# design").click());

    assert.deepEqual(calls.channels, ["chan-design"]);
  } finally {
    await cleanup();
  }
});

test("clicking an agent name opens its profile", async () => {
  const { calls, container, cleanup } = await renderSection();
  try {
    await act(async () => buttonByText(container, "Reviewer").click());

    assert.deepEqual(calls.profiles, [REVIEWER]);
  } finally {
    await cleanup();
  }
});

test("the section is absent when there are no relay agents", async () => {
  const { container, cleanup } = await renderSection({ rows: [] });
  try {
    assert.equal(
      container.querySelector('[data-testid="agents-relay-agents"]'),
      null,
    );
  } finally {
    await cleanup();
  }
});

test("a directory error shows the message and retry refetches", async () => {
  const { calls, container, cleanup } = await renderSection({
    rows: [],
    error: new Error("relay unreachable"),
  });
  try {
    const alert = container.querySelector('[role="alert"]');
    assert.ok(alert?.textContent.includes("relay unreachable"));

    await act(async () => buttonByText(container, "Retry").click());

    assert.equal(calls.retries, 1);
  } finally {
    await cleanup();
  }
});

test("relay agent rows expose no lifecycle controls", async () => {
  const { container, cleanup } = await renderSection();
  try {
    const labels = [...container.querySelectorAll("button")].map((button) =>
      [button.textContent, button.getAttribute("aria-label") ?? ""]
        .join(" ")
        .toLowerCase(),
    );

    for (const forbidden of ["start", "stop", "edit", "delete", "manage"]) {
      assert.ok(
        labels.every((label) => !label.includes(forbidden)),
        `unexpected "${forbidden}" control`,
      );
    }
    assert.deepEqual(
      labels.map((label) => label.trim()),
      ["planner", "# general", "# design", "reviewer", "# review"],
    );
  } finally {
    await cleanup();
  }
});

test("while the directory loads the section shows a placeholder, not rows", async () => {
  const { container, cleanup } = await renderSection({ isLoading: true });
  try {
    assert.ok(container.querySelector('[aria-busy="true"]'));
    assert.equal(
      container.querySelector(`[data-testid="relay-agent-row-${PLANNER}"]`),
      null,
    );
  } finally {
    await cleanup();
  }
});
