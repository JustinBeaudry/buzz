---
title: "feat: Show relay agents on the Agents page; remove the default bee agents"
type: feat
status: active
date: 2026-11-07
---

# feat: Show relay agents on the Agents page; remove the default bee agents

**Target repo:** JustinBeaudry/buzz (fork of block/buzz), branch `feat/agents-page-relay-agents`. Fork-only; no upstream PR for now.

## Summary

Two changes to Buzz Desktop:

1. The Agents page gains a read-only **Relay agents** section listing agents that run elsewhere (for example the ART PM agents on Railway) which the viewer owns or shares a channel with.
2. The built-in Fizz, Honey and Pollen personas, and the onboarding "starter team" that launches them, are removed. A one-time cleanup removes the six existing bee agents from the owner's install and the relay.

---

## Problem Frame

The Agents page renders only `managedAgents`: agents Desktop runs locally. Agents that run on another host are already discovered by the relay directory (`list_relay_agents`), and that directory feeds @mentions, Pulse and the sidebar, but they never appear on the page meant for agents. That makes remote agents invisible except through autocomplete.

Separately, every install seeds three bee personas and onboarding starts them as a team. For an org that runs its own purpose-built agents these are noise, and they accumulate duplicate local agents and relay records.

## Requirements

- R1. The Agents page lists every relay agent returned by the existing relay directory that is not also a local managed agent.
- R2. Each relay agent row shows name, owner ("you" or the owner's display name), response policy (owner-only / allowlist / anyone), and the channels the viewer shares with it. A channel pill navigates to that channel.
- R3. Relay agent rows are read-only: no start, stop, edit, delete or persona actions.
- R4. An agent that is both local and on the relay appears once, in the local section.
- R5. Relay agents with no shared channel do not appear (the directory already enforces this; the UI must not widen it).
- R6. Loading, error and empty states are distinct; an empty directory hides the section rather than showing an empty frame.
- R7. Desktop no longer ships the Fizz, Honey or Pollen personas and no longer creates or launches them in onboarding.
- R8. Existing installs that already have the bee personas keep working: stored records are demoted to ordinary personas, not deleted, so references in managed agents and teams don't dangle.
- R9. One-time cleanup of the owner's install: back up `managed-agents.json`, then delete the six bee-derived local agents (Fizz, Brain, Honey×2, Pollen×2) and retract their relay records. Dexter, Pinky and Software Factory are kept.

---

## Scope Boundaries

- No management of remote agents from Desktop (start/stop/config are the remote host's job).
- No change to relay directory semantics in `src-tauri/src/commands/agent_discovery/relay_directory.rs`.
- No changes to mention eligibility.

### Deferred to Follow-Up Work

- Offering either change upstream to block/buzz.
- Liveness for relay agents (the directory reports `status: "unknown"` for policy-only discovery).
- Retracting the other stale relay records that have no local agent (extra Brain copies), beyond the six named in R9.

---

## Key Technical Decisions

- **Reuse `useRelayAgentsQuery` via `useManagedAgentActions`.** The hook already fetches relay agents with a focused refetch interval and builds `channelsByPubkey` from `RelayAgent.channels`/`channelIds`. The new section consumes that rather than adding a second query.
- **A new `RelayAgentsSection` component, not new modes in `UnifiedAgentsSection`.** `UnifiedAgentsSection` is 551 lines and built around local lifecycle actions; a read-only list is a different shape. Also keeps `AgentsView.tsx` (705 lines) under the `check:file-sizes` limit.
- **Filtering lives in a pure function** (`features/agents/lib/relayAgentRows.ts`): de-dupe against managed pubkeys, normalize pubkeys, sort by name, map channel pairs. Testable with the repo's `node --test` `.test.mjs` pattern, without rendering.
- **Owner labels reuse `formatOwnerLabel`** from `features/messages/lib/mentionSuggestionMapping.ts` (and its owner-profile lookup), so the page says the same "managed by …" as autocomplete.
- **Remove built-ins by emptying `BUILT_IN_PERSONAS`, not by deleting records.** `merge_personas` already demotes stored records whose id is no longer built-in (R8). Desktop doesn't need a new migration.
- **Onboarding drops the starter team entirely.** `ensureWelcomeTeam` stops creating agents. The `team-intro` stage is skipped, and the kickoff stage stops rendering bee avatars. The welcome channel and canvas stay.
- **Cleanup is an operational step, not app code.** It runs once against the owner's install through Desktop's own delete path (which already handles relay retraction for managed agents) after a file backup. No code ships for it.

---

## Implementation Units

### U1. Relay agent row model

**Goal:** Pure function turning relay agents + managed agents + owner profiles into display rows.
**Requirements:** R1, R2, R4, R5
**Dependencies:** none
**Files:** `desktop/src/features/agents/lib/relayAgentRows.ts`, `desktop/src/features/agents/lib/relayAgentRows.test.mjs`
**Approach:** Input: `RelayAgent[]`, managed pubkeys, current pubkey, owner-profile map. Output rows `{pubkey, name, ownerLabel, respondTo, channels: {id,name}[]}`. Skip agents whose normalized pubkey is managed. Pair `channels[i]` with `channelIds[i]` and drop entries without an id (same rule as `useManagedAgentActions`). Sort by name, case-insensitively.
**Execution note:** Test-first.
**Patterns to follow:** `channelsByPubkey` in `desktop/src/features/agents/ui/useManagedAgentActions.ts`; `formatOwnerLabel` in `mentionSuggestionMapping.ts`.
**Test scenarios:**
- Relay agent owned by the viewer → owner label "you"; respondTo carried through.
- Agent owned by someone else with a known profile → their display name.
- Agent whose pubkey matches a managed agent (different case) → excluded.
- `channels`/`channelIds` length mismatch → entries without an id are dropped and no name is used as an id.
- Null `respondTo` → row marks the policy as unknown rather than throwing.
- Empty input → empty array.
**Verification:** Tests pass; the function has no React imports.

### U2. Relay agents section on the Agents page

**Goal:** Render the rows read-only below the local agents section.
**Requirements:** R1–R3, R6
**Dependencies:** U1
**Files:** `desktop/src/features/agents/ui/RelayAgentsSection.tsx`, `desktop/src/features/agents/ui/AgentsView.tsx`, `desktop/src/features/agents/ui/useManagedAgentActions.ts` (expose `relayAgentsQuery` if not already), `desktop/src/features/agents/ui/RelayAgentsSection.jsdom-test.mjs`
**Approach:** Section header "Relay agents" with a one-line description ("Agents running elsewhere that you own or share a channel with"). Each row: avatar/name (opens the profile panel, like local rows), owner label, policy badge, channel pills. No action menu. Loading skeleton while the query is pending; inline error with retry via `refetchRelayAgents`; hide the section when there are no rows.
**Patterns to follow:** `TeamsSection.tsx` for section framing; channel pills and profile-panel open from `UnifiedAgentsSection.tsx`/`AgentGroupRows.tsx`.
**Test scenarios:**
- Two relay rows → both names, owner labels, policy badges and channel pills render.
- Clicking a channel pill navigates to that channel id.
- No rows → the section is absent.
- Query error → error text and a retry control; retry calls refetch.
- Rows expose no start/stop/edit/delete controls.
**Verification:** `pnpm test`, `pnpm typecheck`, `pnpm check`, `pnpm check:file-sizes` pass. In the running app, the 11 ART agents appear under Relay agents.

### U3. Retire the built-in bee personas

**Goal:** Stop shipping Fizz, Honey and Pollen.
**Requirements:** R7, R8
**Dependencies:** none
**Files:** `desktop/src-tauri/src/managed_agents/personas.rs`, `desktop/src-tauri/src/managed_agents/personas/tests.rs`, plus Rust call sites of `POLLEN_PERSONA_ID` / `built_in_persona_definition` / `built_in_persona_avatar_url` found during implementation (e.g. `src-tauri/src/migration/pollen.rs`, `src-tauri/src/commands/workspace.rs`)
**Approach:** Empty `BUILT_IN_PERSONAS`; remove the bee prompts and avatars once nothing references them. Keep the Bumble→Pollen migration only if it still guards existing data; otherwise drop it. Update the tests that assert the three built-ins exist.
**Test scenarios:**
- Fresh load with no stored personas → no personas created.
- Stored `builtin:fizz` record flagged built-in → demoted to `is_builtin = false`, record kept, still active.
- Deleting a demoted bee persona is allowed (was blocked while built-in).
**Verification:** `cargo test -p` (desktop crate) and `cargo clippy` pass.

### U4. Remove the onboarding starter team

**Goal:** Onboarding no longer creates or introduces bee agents.
**Requirements:** R7
**Dependencies:** U3
**Files:** `desktop/src/features/onboarding/welcomeGuide.ts`, `desktop/src/features/onboarding/hooks.ts`, `desktop/src/features/onboarding/communityOnboarding.tsx`, `desktop/src/features/onboarding/ui/CommunityOnboardingFlow.tsx`, `desktop/src/features/onboarding/ui/WelcomeKickoffStage.tsx`, `desktop/src/features/onboarding/useWelcomeKickoffStagePresence.tsx`, `desktop/src/features/channels/ui/ChannelScreen.tsx`, `desktop/src/features/agents/lib/useBotRecents.ts`, and their tests
**Approach:** Remove `ensureWelcomeTeam` and the starter-team constants; skip the `team-intro` stage (go straight to finalizing); remove the kickoff stage and `pickWelcomeGuideAgent` use if they only serve the starter team; drop `DEFAULT_PERSONA_NAMES` seeding in `useBotRecents`. Keep the welcome channel and canvas.
**Test scenarios:**
- Onboarding transaction moves from the step before `team-intro` straight to finalizing.
- Welcome seeding creates the channel and canvas but no managed agents.
- `useBotRecents` with no history returns an empty list (no bee names).
**Verification:** `pnpm test`, `pnpm typecheck` and `pnpm check` pass. A fresh-onboarding run (dev fresh-onboarding helper) completes with no agents created.

### U5. One-time cleanup of the owner's install (operational)

**Goal:** Remove the six existing bee agents.
**Requirements:** R9
**Dependencies:** none (can run before or after U3/U4)
**Files:** none in the repo. The backup goes beside `managed-agents.json` in the Desktop app-support directory.
**Approach:** Back up `managed-agents.json`. Delete Fizz (`13ecdff5`), Brain (`9a67abc5`), Honey (`3a33a5ab`, `b7f2d64c`) and Pollen (`8bb9857c`, `fb4faf6a`) through Desktop's delete action, which stops the process and retracts relay records. Afterwards, query the relay to confirm their 30177 records are gone; publish owner-signed deletions for any that remain. Then delete the bee personas themselves from the catalog.
**Test expectation:** none -- an operational step on one install; verified by the relay query and the Agents page.
**Verification:** The Agents page lists only Dexter, Pinky and Software Factory locally. A relay query shows no 30177 policy for the six pubkeys.

---

## Risks & Dependencies

- **Onboarding coupling:** the welcome flow may assume a guide agent exists (`pickWelcomeGuideAgent`, kickoff stage). U4 must remove those paths, not leave them returning nothing; the e2e smoke suite covers onboarding and must pass.
- **Upstream drift:** the fork diverges from block/buzz in onboarding and personas, so future merges from upstream will conflict there.
- **Delete path coverage:** if Desktop's delete does not retract relay records, U5 falls back to owner-signed deletion events. That uses the owner key, read from Keychain and never printed.

## Open Questions (deferred to implementation)

- Whether `src-tauri/src/migration/pollen.rs` still has live callers once Pollen is gone.
- Exact skip mechanics for `team-intro` in the onboarding state machine.
