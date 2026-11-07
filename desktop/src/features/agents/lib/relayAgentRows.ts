import type { UserProfileLookup } from "@/features/profile/lib/identity";
import { formatOwnerLabel } from "@/features/profile/lib/identity";
import type { RelayAgent, RespondToMode } from "@/shared/api/types";
import { normalizePubkey } from "@/shared/lib/pubkey";

export type RelayAgentRow = {
  pubkey: string;
  name: string;
  /** "you", the owner's display name, or null when the relay names no owner. */
  ownerLabel: string | null;
  /** "unknown" when the agent has not published a response policy. */
  respondTo: RespondToMode | "unknown";
  channels: { id: string; name: string }[];
};

/**
 * Relay-directory agents to list on the Agents page: every agent the viewer
 * can see that this device does not already manage, sorted by name.
 */
export function buildRelayAgentRows({
  relayAgents,
  managedPubkeys,
  currentPubkey,
  ownerProfiles,
}: {
  relayAgents: readonly RelayAgent[];
  managedPubkeys: Iterable<string>;
  currentPubkey: string | null | undefined;
  ownerProfiles: UserProfileLookup | undefined;
}): RelayAgentRow[] {
  const excluded = new Set(Array.from(managedPubkeys, normalizePubkey));
  const rows: RelayAgentRow[] = [];

  for (const agent of relayAgents) {
    const key = normalizePubkey(agent.pubkey);
    if (excluded.has(key)) continue;
    excluded.add(key);
    rows.push({
      pubkey: agent.pubkey,
      name: agent.name,
      ownerLabel: formatOwnerLabel(
        agent.ownerPubkey,
        currentPubkey,
        ownerProfiles,
      ),
      respondTo: agent.respondTo ?? "unknown",
      // Pair by index and drop names without an id: falling back to the name
      // would produce a pill that navigates to a channel name as if it were an
      // id (same rule as channelsByPubkey in useManagedAgentActions).
      channels: agent.channels.flatMap((name, i) => {
        const id = agent.channelIds[i];
        return id ? [{ id, name }] : [];
      }),
    });
  }

  return rows.sort(
    (left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }) ||
      left.pubkey.localeCompare(right.pubkey),
  );
}
