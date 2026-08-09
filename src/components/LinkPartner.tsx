import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, Link2, Loader2, AlertCircle, PartyPopper, ArrowRight, ShieldCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DisplayHeading, Eyebrow } from "@/components/editorial";
import {
  normalizeInviteCode,
  redeemInvite,
  CODE_LENGTH,
  REDEEM_MESSAGES,
  type RedeemFailure,
} from "@/utils/couples";
import { heartRain } from "@/utils/particles";

export type LinkPartnerVariant = "settings" | "onboarding";

interface LinkPartnerProps {
  /** "settings" renders as a self-contained card for the settings screen.
   *  "onboarding" renders as a fuller prompt for a fresh account, with room
   *  for the caller to offer a way to skip and stay solo. */
  variant: LinkPartnerVariant;
  /** Fires once `redeemInvite` reports `{ status: "linked" }`. The journey is
   *  shared from this point — the caller should refresh whatever couple/profile
   *  state it holds (e.g. reload the context) and, for onboarding, may use this
   *  to advance past the prompt once the celebration has had its moment. */
  onLinked?: () => void;
  /** Onboarding only: lets a fresh account decline and continue solo. */
  onSkip?: () => void;
  className?: string;
}

type Step = "entry" | "confirm" | "submitting" | "linked";

/** Mirrors the `ABC-123` shape the invite creator sees, so typing it back in
 *  feels like matching a code rather than filling out a form field. */
const formatForDisplay = (code: string) =>
  code.length <= 3 ? code : `${code.slice(0, 3)}-${code.slice(3)}`;

const LinkPartner = ({ variant, onLinked, onSkip, className }: LinkPartnerProps) => {
  const reduceMotion = useReducedMotion();
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("entry");
  const [error, setError] = useState<RedeemFailure | null>(null);

  const isComplete = code.length === CODE_LENGTH;
  const isBusy = step === "submitting";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setCode(normalizeInviteCode(event.target.value).slice(0, CODE_LENGTH));
  };

  const handleAskToLink = () => {
    if (!isComplete || isBusy) return;
    setStep("confirm");
  };

  const handleCancelConfirm = () => {
    if (isBusy) return;
    setStep("entry");
  };

  const handleConfirmLink = async () => {
    if (isBusy) return;
    setStep("submitting");
    setError(null);

    const result = await redeemInvite(code);

    if (result.status === "linked") {
      setStep("linked");
      if (!reduceMotion) {
        heartRain({ duration: 2200, heartCount: 26 });
      }
      onLinked?.();
    } else {
      setError(result.reason);
      setStep("entry");
    }
  };

  const isOnboarding = variant === "onboarding";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 sm:p-8",
        isOnboarding && "sm:p-10",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {step === "linked" ? (
          <motion.div
            key="linked"
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="text-center"
          >
            <motion.span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose bg-rose/10 text-rose"
              initial={reduceMotion ? undefined : { rotate: -12, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
            >
              <PartyPopper className="h-6 w-6" aria-hidden />
            </motion.span>
            <DisplayHeading as="h2" className="mt-5">
              You're <em>linked</em><span className="dot-accent">.</span>
            </DisplayHeading>
            <p className="mx-auto mt-3 max-w-[38ch] text-muted-foreground">
              Your journeys are shared from here — stamps, coupons, timeline, and photos, all one
              story now.
            </p>
            {isOnboarding && (
              <button
                type="button"
                onClick={() => onLinked?.()}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-[10px] border border-rose bg-rose px-5 py-3 font-medium text-white transition-all hover:brightness-95"
              >
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </motion.div>
        ) : step === "confirm" ? (
          <motion.div
            key="confirm"
            initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Eyebrow>Before you link</Eyebrow>
            <DisplayHeading as="h2" className="mt-3">
              This one's <em>permanent</em><span className="dot-accent">.</span>
            </DisplayHeading>

            <ul className="mt-6 space-y-3">
              <li className="flex gap-2.5 text-sm text-foreground">
                <Heart className="mt-0.5 h-4 w-4 shrink-0 text-rose" aria-hidden />
                <span>
                  You join <strong>their</strong> journey — their stamps, coupons, timeline and
                  photos become yours too, and every one from here on is shared.
                </span>
              </li>
              <li className="flex gap-2.5 text-sm text-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>
                  Your bag, coins, and trainer card stay <strong>personal</strong> — you each
                  remain a distinct trainer.
                </span>
              </li>
              <li className="flex gap-2.5 text-sm text-foreground">
                <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  Anything you collected on your own is <strong>replaced</strong>, not merged — and
                  the link is permanent, so there's no undo for this one.
                </span>
              </li>
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleConfirmLink}
                disabled={isBusy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-rose bg-rose px-5 py-3 font-medium text-white transition-all hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Linking…
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" aria-hidden />
                    Yes, link us
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={isBusy}
                className="inline-flex items-center justify-center rounded-[10px] border border-border px-5 py-3 font-medium text-foreground transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                Not yet
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="entry"
            initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Eyebrow>{isOnboarding ? "Got a code?" : "Partner"}</Eyebrow>
            <DisplayHeading as="h2" className="mt-3">
              {isOnboarding ? (
                <>
                  Link up with <em>your partner</em><span className="dot-accent">.</span>
                </>
              ) : (
                <>
                  Link your <em>partner's</em> account<span className="dot-accent">.</span>
                </>
              )}
            </DisplayHeading>
            <p className="mt-3 max-w-[46ch] text-muted-foreground">
              {isOnboarding
                ? "If they've already sent you a code, enter it below to join their world."
                : "Enter the code they generated to share one journey from here on."}
            </p>

            <div className="mt-6">
              <label
                htmlFor="invite-code"
                className="block font-mono text-[11px] uppercase tracking-wide text-muted-foreground mb-2"
              >
                Invite code
              </label>
              <input
                id="invite-code"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                value={formatForDisplay(code)}
                onChange={handleChange}
                disabled={isBusy}
                placeholder="ABC-123"
                className="w-full rounded-[10px] border border-border bg-background px-4 py-3 text-center font-mono text-lg uppercase tracking-[0.2em] text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>

            {error === "no_profile" ? (
              // Recoverable, not a hard failure: the code is still good, the redeemer
              // just doesn't have a `profiles` row yet (redeem_invite touched zero rows
              // for them). Point at finishing the trainer profile, then retry.
              <div
                role="alert"
                className="mt-4 rounded-[10px] border border-primary/40 bg-primary/10 px-4 py-2.5 text-[13px] text-foreground"
              >
                <p className="flex items-start gap-2">
                  <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {REDEEM_MESSAGES[error]}
                </p>
                {isOnboarding && onSkip && (
                  <button
                    type="button"
                    onClick={onSkip}
                    className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-primary hover:underline"
                  >
                    Finish my profile first
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </div>
            ) : (
              error && (
                <p
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-[10px] border border-rose/40 bg-rose/10 px-4 py-2.5 text-[13px] text-rose"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {REDEEM_MESSAGES[error]}
                </p>
              )
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAskToLink}
                disabled={!isComplete || isBusy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-primary bg-primary px-5 py-3 font-medium text-primary-foreground transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Link2 className="h-4 w-4" aria-hidden />
                Link accounts
              </button>
              {isOnboarding && onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center rounded-[10px] border border-border px-5 py-3 font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  I'll do this later
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LinkPartner;
