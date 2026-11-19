import { AnimatePresence, motion } from "motion/react";
import { Bot, Check, X } from "lucide-react";

import { ComposerDockGlassBackdrop } from "@/features/messages/ui/ComposerDockBackdrop";
import { cn } from "@/shared/lib/cn";

export const WELCOME_PERSONA_ROTATION_MS = 3200;
export const WELCOME_PERSONA_EASE = [0.22, 1, 0.36, 1] as const;
const WELCOME_PERSONA_EXIT_EASE = [0.64, 0, 0.78, 0] as const;
export const WELCOME_PERSONA_ENTER_DURATION_SECONDS = 0.648;
const WELCOME_COMPOSER_BANNER_CONTENT_EXIT_DURATION_SECONDS = 0.18;
const WELCOME_COMPOSER_BANNER_CONTENT_Y_OFFSET_PX = 4;
const WELCOME_COMPOSER_BANNER_SUCCESS_ENTER_DURATION_SECONDS = 0.32;
const WELCOME_COMPOSER_BANNER_SUCCESS_COPY_DELAY_SECONDS = 0.06;
const WELCOME_COMPOSER_BANNER_SUCCESS_Y_OFFSET_PX = 6;
export const WELCOME_COMPOSER_BANNER_DISMISS_DURATION_SECONDS = 0.25;
export const WELCOME_COMPOSER_BANNER_HIDE_BUFFER_MS = 50;
const WELCOME_COMPOSER_BANNER_DISMISS_Y_OFFSET_PX = 48;
export const WELCOME_COMPOSER_BANNER_SUCCESS_SETTLE_MS = Math.round(
  (WELCOME_COMPOSER_BANNER_CONTENT_EXIT_DURATION_SECONDS +
    WELCOME_COMPOSER_BANNER_SUCCESS_COPY_DELAY_SECONDS +
    WELCOME_COMPOSER_BANNER_SUCCESS_ENTER_DURATION_SECONDS) *
    1000,
);

export type WelcomeComposerBannerState =
  | "prompt"
  | "complete"
  | "dismissing"
  | "hidden";

const welcomeComposerBannerContentVariants = {
  animate: {
    opacity: 1,
    transition: {
      duration: WELCOME_COMPOSER_BANNER_CONTENT_EXIT_DURATION_SECONDS,
      ease: WELCOME_PERSONA_EASE,
    },
    y: 0,
  },
  exit: {
    opacity: 0,
    transition: {
      duration: WELCOME_COMPOSER_BANNER_CONTENT_EXIT_DURATION_SECONDS,
      ease: WELCOME_PERSONA_EXIT_EASE,
    },
    y: -WELCOME_COMPOSER_BANNER_CONTENT_Y_OFFSET_PX,
  },
  initial: {
    opacity: 0,
    y: WELCOME_COMPOSER_BANNER_CONTENT_Y_OFFSET_PX,
  },
};

const welcomeComposerBannerSuccessIconVariants = {
  animate: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      duration: WELCOME_COMPOSER_BANNER_SUCCESS_ENTER_DURATION_SECONDS,
      ease: WELCOME_PERSONA_EASE,
    },
    y: 0,
  },
  initial: {
    opacity: 0,
    rotate: -8,
    scale: 0.72,
    y: WELCOME_COMPOSER_BANNER_SUCCESS_Y_OFFSET_PX,
  },
};

const welcomeComposerBannerSuccessCopyVariants = {
  animate: {
    opacity: 1,
    transition: {
      delay: WELCOME_COMPOSER_BANNER_SUCCESS_COPY_DELAY_SECONDS,
      duration: WELCOME_COMPOSER_BANNER_SUCCESS_ENTER_DURATION_SECONDS,
      ease: WELCOME_PERSONA_EASE,
    },
    y: 0,
  },
  initial: {
    opacity: 0,
    y: WELCOME_COMPOSER_BANNER_SUCCESS_Y_OFFSET_PX,
  },
};

type WelcomeComposerBannerProps = {
  state: WelcomeComposerBannerState;
  /**
   * Called when the user dismisses the banner manually via the close button.
   * Only rendered while `state === "prompt"`.
   */
  onDismiss?: () => void;
};

export function WelcomeComposerBanner({
  onDismiss,
  state,
}: WelcomeComposerBannerProps) {
  if (state === "hidden") {
    return null;
  }

  return (
    <AnimatePresence initial={false}>
      <motion.div
        animate={{
          height: state === "dismissing" ? 0 : "auto",
        }}
        className="overflow-hidden"
        initial={false}
        transition={{
          duration:
            state === "dismissing"
              ? WELCOME_COMPOSER_BANNER_DISMISS_DURATION_SECONDS
              : WELCOME_PERSONA_ENTER_DURATION_SECONDS,
          ease: WELCOME_PERSONA_EASE,
        }}
      >
        <motion.div
          animate={{
            opacity: 1,
            y:
              state === "dismissing"
                ? WELCOME_COMPOSER_BANNER_DISMISS_Y_OFFSET_PX
                : 0,
          }}
          className={cn(
            "relative z-[1] mx-5 mb-0 flex items-center gap-2 rounded-t-2xl border border-b-0 px-4 pb-5 pt-2.5 text-sm leading-5 transition-colors",
            state !== "prompt"
              ? "border-emerald-500/30 bg-emerald-500/15 text-foreground"
              : "border-border/60 bg-muted/55 text-muted-foreground",
          )}
          data-state={state}
          data-testid="welcome-composer-guide-banner"
          data-tone={state !== "prompt" ? "success" : "neutral"}
          initial={false}
          transition={{
            duration:
              state === "dismissing"
                ? WELCOME_COMPOSER_BANNER_DISMISS_DURATION_SECONDS
                : WELCOME_PERSONA_ENTER_DURATION_SECONDS,
            ease: WELCOME_PERSONA_EASE,
          }}
        >
          <AnimatePresence initial={false} mode="wait">
            {state !== "prompt" ? (
              <motion.span
                animate="animate"
                className="flex h-4 w-4 shrink-0 items-center justify-center text-foreground"
                data-animation-target="success-icon"
                initial="initial"
                key="complete-icon"
                variants={welcomeComposerBannerSuccessIconVariants}
              >
                <Check
                  aria-hidden
                  className="h-4 w-4"
                  data-testid="welcome-composer-complete-icon"
                />
              </motion.span>
            ) : (
              <motion.span
                animate="animate"
                className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground"
                exit="exit"
                initial="initial"
                key="prompt-icon"
                variants={welcomeComposerBannerContentVariants}
              >
                <Bot aria-hidden className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false} mode="wait">
            {state !== "prompt" ? (
              <motion.span
                animate="animate"
                className="min-w-0 flex-1"
                data-animation-target="success-copy"
                initial="initial"
                key="complete-copy"
                variants={welcomeComposerBannerSuccessCopyVariants}
              >
                Nice work.
              </motion.span>
            ) : (
              <motion.span
                animate="animate"
                className="min-w-0 flex-1"
                exit="exit"
                initial="initial"
                key="prompt-copy"
                variants={welcomeComposerBannerContentVariants}
              >
                Mention an agent with @ whenever you want their help.
              </motion.span>
            )}
          </AnimatePresence>
          {state === "prompt" && onDismiss ? (
            <button
              aria-label="Dismiss hint"
              className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="welcome-composer-dismiss-button"
              onClick={onDismiss}
              type="button"
            >
              <X aria-hidden className="h-3 w-3" />
            </button>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function WelcomeComposerGuidanceLayer({
  onDismiss,
  state,
}: WelcomeComposerBannerProps) {
  if (state === "hidden") {
    return null;
  }

  return (
    <div className="relative" data-testid="welcome-composer-guidance-layer">
      <ComposerDockGlassBackdrop
        className="absolute inset-x-5 top-0 bottom-3 z-0 rounded-t-2xl"
        testId="welcome-composer-guidance-backdrop"
      />
      <WelcomeComposerBanner onDismiss={onDismiss} state={state} />
    </div>
  );
}
