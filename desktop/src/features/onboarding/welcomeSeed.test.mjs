import assert from "node:assert/strict";
import test from "node:test";

import {
  ensureWelcomeChannel,
  hasEnsuredWelcomeChannel,
  WELCOME_CHANNEL_NAME,
} from "./welcome.ts";
import { WELCOME_CANVAS_CONTENT } from "./welcomeCanvas.ts";
import { seedWelcomeExperience } from "./welcomeSeed.ts";

function installWindowLocalStorage() {
  const storage = new Map();
  const previousWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    },
  };
  return () => {
    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = previousWindow;
    }
  };
}

/**
 * A client that records every method the seed touches. Any method outside
 * `methods` (a managed-agent create, a persona lookup, a team ensure) throws,
 * so a seed that reaches for agents fails the test.
 */
function recordingClient(calls, methods) {
  return new Proxy(
    {},
    {
      get(_target, property) {
        if (typeof property !== "string" || property === "then") {
          return undefined;
        }
        const method = methods[property];
        if (!method) {
          throw new Error(`welcome seeding called unexpected ${property}`);
        }
        return async (...args) => {
          calls.push(property);
          return method(...args);
        };
      },
    },
  );
}

test("welcome seeding creates the channel and canvas but no managed agents", async () => {
  const restoreWindow = installWindowLocalStorage();
  try {
    const calls = [];
    const canvasWrites = [];
    const channelClient = recordingClient(calls, {
      getChannels: () => [],
      createChannel: (input) => ({
        id: "welcome-seed-channel",
        name: input.name,
        channelType: input.channelType,
        visibility: input.visibility,
        description: input.description,
        isMember: true,
        archivedAt: null,
      }),
    });
    const canvasClient = recordingClient(calls, {
      getCanvas: () => ({ content: "", updatedAt: null, author: null }),
      setCanvas: (input) => {
        canvasWrites.push(input);
        return { ok: true, eventId: "canvas-event" };
      },
    });

    const channel = await ensureWelcomeChannel(channelClient);
    await seedWelcomeExperience({
      channelId: channel.id,
      communityScope: "wss://relay.example",
      canvasClient,
      pubkey: "seed-user",
    });

    assert.equal(channel.name, WELCOME_CHANNEL_NAME);
    assert.deepEqual(calls, [
      "getChannels",
      "createChannel",
      "getCanvas",
      "setCanvas",
    ]);
    assert.deepEqual(canvasWrites, [
      { channelId: "welcome-seed-channel", content: WELCOME_CANVAS_CONTENT },
    ]);
    assert.equal(
      hasEnsuredWelcomeChannel("seed-user", "wss://relay.example"),
      true,
    );
  } finally {
    restoreWindow();
  }
});

test("welcome seeding leaves the channel un-ensured when the canvas fails", async () => {
  const restoreWindow = installWindowLocalStorage();
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    await seedWelcomeExperience({
      channelId: "welcome-failing-canvas",
      communityScope: "wss://relay.example",
      canvasClient: {
        getCanvas: async () => {
          throw new Error("relay offline");
        },
        setCanvas: async () => ({ ok: true, eventId: "unused" }),
      },
      pubkey: "seed-user-2",
    });

    assert.equal(
      hasEnsuredWelcomeChannel("seed-user-2", "wss://relay.example"),
      false,
    );
  } finally {
    console.warn = originalWarn;
    restoreWindow();
  }
});
