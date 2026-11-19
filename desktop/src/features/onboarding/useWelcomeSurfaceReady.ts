import * as React from "react";

import {
  isWelcomeChannel,
  notifyWelcomeSurfaceReady,
} from "@/features/onboarding/welcome";
import type { Channel } from "@/shared/api/types";

/**
 * Announce the Welcome surface's first settled render (per channel) so the
 * onboarding "entering" curtain knows it can fade. Harmless outside
 * onboarding: nothing listens unless the curtain is up.
 */
export function useWelcomeSurfaceReady(
  activeChannel: Channel | null,
  isTimelineLoading: boolean,
) {
  const announcedChannelIdRef = React.useRef<string | null>(null);
  const channelId = activeChannel?.id ?? null;
  React.useEffect(() => {
    if (!channelId || isTimelineLoading) return;
    if (!isWelcomeChannel(activeChannel)) return;
    if (announcedChannelIdRef.current === channelId) return;
    announcedChannelIdRef.current = channelId;
    notifyWelcomeSurfaceReady(channelId);
  }, [activeChannel, channelId, isTimelineLoading]);
}
