import type { RelayAgentRow } from "@/features/agents/lib/relayAgentRows";
import type { UserProfileLookup } from "@/features/profile/lib/identity";
import { normalizePubkey } from "@/shared/lib/pubkey";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { SectionHeader } from "@/shared/ui/PageHeader";
import { Skeleton } from "@/shared/ui/skeleton";
import { UserAvatar } from "@/shared/ui/UserAvatar";

const RESPOND_TO_LABELS: Record<RelayAgentRow["respondTo"], string> = {
  "owner-only": "Owner only",
  allowlist: "Allowlist",
  anyone: "Anyone",
  unknown: "Policy unknown",
};

type RelayAgentsSectionProps = {
  rows: RelayAgentRow[];
  /** Agent profiles, used only for avatars. */
  profiles?: UserProfileLookup;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onOpenProfile: (pubkey: string) => void;
  onOpenChannel: (channelId: string) => void;
};

/**
 * Read-only list of agents running elsewhere (another device or a server)
 * that the viewer owns or shares a channel with. Lifecycle stays with the
 * host that runs them, so rows offer no start/stop/edit/delete controls.
 */
export function RelayAgentsSection({
  rows,
  profiles,
  isLoading,
  error,
  onRetry,
  onOpenProfile,
  onOpenChannel,
}: RelayAgentsSectionProps) {
  if (!isLoading && !error && rows.length === 0) return null;

  return (
    <section className="space-y-4" data-testid="agents-relay-agents">
      <SectionHeader
        title="Relay agents"
        description="Agents running elsewhere that you own or share a channel with."
      />

      {isLoading ? (
        <div
          aria-busy="true"
          aria-label="Loading relay agents"
          role="status"
          className="divide-y divide-border/50 rounded-2xl border border-border/60"
        >
          {[0, 1].map((index) => (
            <div className="flex items-center gap-3 px-4 py-3" key={index}>
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && rows.length > 0 ? (
        <ul className="divide-y divide-border/50 rounded-2xl border border-border/60">
          {rows.map((row) => (
            <RelayAgentListItem
              avatarUrl={
                profiles?.[normalizePubkey(row.pubkey)]?.avatarUrl ?? null
              }
              key={row.pubkey}
              row={row}
              onOpenChannel={onOpenChannel}
              onOpenProfile={onOpenProfile}
            />
          ))}
        </ul>
      ) : null}

      {error && !isLoading ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <span>Couldn't load relay agents: {error.message}</span>
          <Button onClick={onRetry} size="sm" type="button" variant="outline">
            Retry
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function RelayAgentListItem({
  avatarUrl,
  row,
  onOpenChannel,
  onOpenProfile,
}: {
  avatarUrl: string | null;
  row: RelayAgentRow;
  onOpenChannel: (channelId: string) => void;
  onOpenProfile: (pubkey: string) => void;
}) {
  return (
    <li
      className="flex items-start gap-3 px-4 py-3"
      data-testid={`relay-agent-row-${row.pubkey}`}
    >
      <UserAvatar avatarUrl={avatarUrl} displayName={row.name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="truncate rounded-sm text-left font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onOpenProfile(row.pubkey)}
            type="button"
          >
            {row.name}
          </button>
          <Badge
            data-testid="relay-agent-policy"
            variant={row.respondTo === "unknown" ? "warning" : "secondary"}
          >
            {RESPOND_TO_LABELS[row.respondTo]}
          </Badge>
        </div>
        {row.ownerLabel ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Managed by {row.ownerLabel}
          </p>
        ) : null}
        {row.channels.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {row.channels.map((channel) => (
              <button
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                key={channel.id}
                onClick={() => onOpenChannel(channel.id)}
                type="button"
              >
                <Badge
                  className="cursor-pointer normal-case tracking-normal hover:opacity-80"
                  variant="outline"
                >
                  # {channel.name}
                </Badge>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
