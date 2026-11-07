import { markWelcomeChannelEnsured } from "@/features/onboarding/welcome";
import {
  ensureWelcomeCanvas,
  type WelcomeCanvasClient,
} from "@/features/onboarding/welcomeCanvas";

const welcomeSeedPromises = new Map<string, Promise<void>>();

/**
 * Seed the private Welcome channel's content once it exists. Welcome ships
 * with a canvas only: Desktop no longer creates or invites starter agents.
 * Concurrent calls for the same channel share one in-flight seed.
 */
export function seedWelcomeExperience({
  channelId,
  communityScope,
  canvasClient,
  pubkey,
}: {
  channelId: string;
  communityScope: string | null;
  canvasClient?: WelcomeCanvasClient;
  pubkey: string | null;
}): Promise<void> {
  const key = `${communityScope ?? ""}:${channelId}`;
  const current = welcomeSeedPromises.get(key);
  if (current) return current;

  const promise = (async () => {
    try {
      await ensureWelcomeCanvas(channelId, canvasClient);
      markWelcomeChannelEnsured(pubkey, communityScope);
    } catch (error) {
      console.warn("Failed to seed the private Welcome experience.", error);
    }
  })().finally(() => welcomeSeedPromises.delete(key));
  welcomeSeedPromises.set(key, promise);
  return promise;
}
