import * as React from "react";

import { buildRelayAgentRows } from "@/features/agents/lib/relayAgentRows";
import { useUsersBatchQuery } from "@/features/profile/hooks";
import { useIdentityQuery } from "@/shared/api/hooks";
import type { ManagedAgent, RelayAgent } from "@/shared/api/types";

/**
 * Rows for the read-only Relay agents section, plus the profile lookup that
 * resolved their owner labels (also used for the agents' own avatars).
 */
export function useRelayAgentRows(
  relayAgents: readonly RelayAgent[] | undefined,
  managedAgents: readonly ManagedAgent[],
) {
  const currentPubkey = useIdentityQuery().data?.pubkey ?? null;
  const profilePubkeys = React.useMemo(() => {
    const pubkeys = new Set<string>();
    for (const agent of relayAgents ?? []) {
      pubkeys.add(agent.pubkey);
      if (agent.ownerPubkey) pubkeys.add(agent.ownerPubkey);
    }
    return [...pubkeys];
  }, [relayAgents]);
  const profilesQuery = useUsersBatchQuery(profilePubkeys);
  const profiles = profilesQuery.data?.profiles;

  const rows = React.useMemo(
    () =>
      buildRelayAgentRows({
        relayAgents: relayAgents ?? [],
        managedPubkeys: managedAgents.map((agent) => agent.pubkey),
        currentPubkey,
        ownerProfiles: profiles,
      }),
    [relayAgents, managedAgents, currentPubkey, profiles],
  );

  return { rows, profiles };
}
