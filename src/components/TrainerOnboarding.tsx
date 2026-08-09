import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { DisplayHeading, Eyebrow } from "@/components/editorial";
import PokeSprite from "@/components/PokeSprite";
import { AVATAR_PRESETS, TEAMS, avatarFor, teamFor, trainerIdFor } from "@/utils/trainerCard";
import { cn } from "@/lib/utils";

export interface TrainerOnboardingData {
  displayName: string;
  birthday: string;
  trainerName: string;
  avatarId: string;
  teamId: string;
}

interface TrainerOnboardingProps {
  onSubmit: (data: TrainerOnboardingData) => void;
  isSubmitting: boolean;
  /** Only used to preview the card's trainer ID on the last step. */
  userId?: string | null;
}

/** One question per screen. The three text fields were one scrolling form before;
 *  split, each gets the whole screen and nobody reads three labels at once. */
const STEPS = ["name", "birthday", "nickname", "buddy", "team", "reveal"] as const;
type Step = (typeof STEPS)[number];

/** Names are worn on a card, not stored for a bank. 24 characters is generous for
 *  a nickname and short enough that the card never has to shrink its type. */
const NAME_LIMIT = 24;

const TrainerOnboarding = ({ onSubmit, isSubmitting, userId }: TrainerOnboardingProps) => {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [avatarId, setAvatarId] = useState<string>(AVATAR_PRESETS[0].id);
  const [teamId, setTeamId] = useState<string>(TEAMS[0].id);

  const step: Step = STEPS[index];
  const buddy = avatarFor(avatarId);
  const team = teamFor(teamId);

  /** A birthday in the future is a typo, not a birthday. */
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const stepValid: Record<Step, boolean> = {
    name: displayName.trim().length > 0,
    birthday: birthday.length > 0 && birthday <= today,
    nickname: trainerName.trim().length > 0,
    buddy: true,
    team: true,
    reveal: true,
  };

  const canAdvance = stepValid[step] && !isSubmitting;

  const go = (delta: number) => {
    setDirection(delta);
    setIndex((i) => Math.min(STEPS.length - 1, Math.max(0, i + delta)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdvance) return;
    if (step !== "reveal") {
      go(1);
      return;
    }
    onSubmit({
      displayName: displayName.trim(),
      birthday,
      trainerName: trainerName.trim(),
      avatarId,
      teamId,
    });
  };

  // Slide the outgoing screen out the way the reader is travelling. Distance is
  // small on purpose — this is a page turn, not a carousel.
  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: direction * 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -28 },
      };

  const fieldClass =
    "w-full rounded-[12px] border border-border bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-6 py-10">
        {/* progress rail — six segments, filled behind you, hollow ahead */}
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" role="presentation">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-[3px] flex-1 rounded-full transition-colors duration-300",
                  i <= index ? "bg-primary" : "bg-border"
                )}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
            {index + 1} / {STEPS.length}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              {...slide}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-1 flex-col pt-10"
            >
              {step === "name" && (
                <StepShell
                  eyebrow="Welcome, trainer"
                  title={
                    <>
                      What should we <em>call you</em>?
                    </>
                  }
                  hint="Your real name. It's only ever shown to the two of you."
                >
                  <input
                    id="displayName"
                    type="text"
                    autoFocus
                    autoComplete="given-name"
                    maxLength={NAME_LIMIT}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={fieldClass}
                    placeholder="e.g. Alex"
                  />
                </StepShell>
              )}

              {step === "birthday" && (
                <StepShell
                  eyebrow="One more thing"
                  title={
                    <>
                      When's your <em>birthday</em>?
                    </>
                  }
                  hint="So the app knows when to make a fuss of you."
                >
                  <input
                    id="birthday"
                    type="date"
                    autoFocus
                    max={today}
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className={fieldClass}
                  />
                  {birthday.length > 0 && birthday > today && (
                    <p className="mt-2 text-sm text-destructive">
                      That date hasn't happened yet — check the year.
                    </p>
                  )}
                </StepShell>
              )}

              {step === "nickname" && (
                <StepShell
                  eyebrow="Almost there"
                  title={
                    <>
                      What does your <em>card</em> call you?
                    </>
                  }
                  hint="The name printed across your trainer card. Make it fun."
                >
                  <input
                    id="trainerName"
                    type="text"
                    autoFocus
                    maxLength={NAME_LIMIT}
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    className={fieldClass}
                    placeholder="e.g. Ace Wanderer"
                  />
                </StepShell>
              )}

              {step === "buddy" && (
                <StepShell
                  eyebrow="Pick one"
                  title={
                    <>
                      Choose your <em>buddy</em>
                    </>
                  }
                  hint="Rides along on your card. You can swap it any time."
                >
                  <div className="grid place-items-center gap-1 rounded-[18px] bg-primary-light/60 py-5">
                    <PokeSprite dex={buddy.dex} fallback={buddy.icon} className="h-[104px] w-[104px] text-5xl" />
                    <span className="font-serif text-[22px] italic text-foreground">{buddy.label}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                      {buddy.species} · No. {String(buddy.dex).padStart(3, "0")}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatarId(preset.id)}
                        aria-pressed={avatarId === preset.id}
                        aria-label={`${preset.label}, ${preset.species}`}
                        className={cn(
                          "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-[14px] border bg-card p-1 transition-all focus:outline-none focus:ring-2 focus:ring-ring",
                          avatarId === preset.id
                            ? "border-rose bg-rose-light/40 shadow-[inset_0_0_0_1px_hsl(var(--rose))]"
                            : "border-border hover:-translate-y-0.5 hover:border-primary"
                        )}
                      >
                        <PokeSprite dex={preset.dex} fallback={preset.icon} className="h-11 w-11 text-2xl" />
                        <span className="font-mono text-[8.5px] text-muted-foreground">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </StepShell>
              )}

              {step === "team" && (
                <StepShell
                  eyebrow="Last choice"
                  title={
                    <>
                      Choose your <em>team</em>
                    </>
                  }
                  hint="Sets the colour of your card. Only the admin can change it later."
                >
                  <div className="grid gap-2.5">
                    {TEAMS.map((t) => {
                      const active = t.id === teamId;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTeamId(t.id)}
                          aria-pressed={active}
                          className={cn(
                            "flex items-center gap-3 rounded-[16px] border p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-ring",
                            active
                              ? "border-transparent"
                              : "border-border bg-card hover:-translate-y-0.5 hover:border-foreground"
                          )}
                          style={
                            active
                              ? { background: t.tint, boxShadow: `inset 0 0 0 1.5px ${t.accent}` }
                              : undefined
                          }
                        >
                          <PokeSprite dex={t.dex} fallback="✨" className="h-14 w-14 flex-none text-3xl" />
                          <span className="min-w-0 flex-1">
                            <span
                              className="block font-mono text-[10px] uppercase tracking-wide"
                              style={{ color: active ? t.ink : undefined }}
                            >
                              {t.name}
                            </span>
                            <span className="mt-0.5 block font-serif text-[17px] italic text-foreground">
                              {t.motto}
                            </span>
                            {/* On the tint, muted grey drops under 4.5:1 — the team's
                                own ink is the only secondary colour that holds. */}
                            <span
                              className={cn(
                                "font-mono text-[9px] uppercase tracking-wide",
                                !active && "text-muted-foreground"
                              )}
                              style={active ? { color: t.ink, opacity: 0.8 } : undefined}
                            >
                              {t.mascot}
                            </span>
                          </span>
                          {active && (
                            <Check className="h-4 w-4 flex-none" style={{ color: t.accent }} aria-hidden />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </StepShell>
              )}

              {step === "reveal" && (
                <RevealStep
                  displayName={displayName.trim()}
                  trainerName={trainerName.trim()}
                  birthday={birthday}
                  buddy={buddy}
                  team={team}
                  userId={userId}
                  reduceMotion={!!reduceMotion}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="sticky bottom-0 mt-8 flex items-center gap-3 bg-background pb-2 pt-4">
            {index > 0 && (
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={!canAdvance}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-rose bg-rose px-6 py-3 text-base font-medium text-white transition-all hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === "reveal" ? (
                isSubmitting ? (
                  "Saving…"
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Start the adventure
                  </>
                )
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface StepShellProps {
  eyebrow: string;
  title: React.ReactNode;
  hint: string;
  children: React.ReactNode;
}

/** Every step is the same four things in the same places, so moving between them
 *  reads as one screen changing its question rather than six different screens. */
const StepShell = ({ eyebrow, title, hint, children }: StepShellProps) => (
  <div>
    <Eyebrow>{eyebrow}</Eyebrow>
    <DisplayHeading className="mt-3 text-balance !text-[34px] !leading-[1.08]">{title}</DisplayHeading>
    <p className="mb-7 mt-2.5 text-sm text-muted-foreground">{hint}</p>
    {children}
  </div>
);

interface RevealStepProps {
  displayName: string;
  trainerName: string;
  birthday: string;
  buddy: ReturnType<typeof avatarFor>;
  team: ReturnType<typeof teamFor>;
  userId?: string | null;
  reduceMotion: boolean;
}

/**
 * The payoff. Everything picked over five screens assembles into the card, in
 * the order it was chosen — team wash, then portrait, then the printed details.
 *
 * This is the one authored moment in the flow; the steps before it stay quiet so
 * this one lands. Nothing here is a second source of truth: it renders the same
 * values the submit sends, so it cannot show a card the profile won't match.
 */
const RevealStep = ({
  displayName,
  trainerName,
  birthday,
  buddy,
  team,
  userId,
  reduceMotion,
}: RevealStepProps) => {
  const trainerId = trainerIdFor(userId ?? displayName);
  const joined = new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" });
  const born = birthday
    ? new Date(`${birthday}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : "—";

  const beat = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <div>
      <Eyebrow>Your card</Eyebrow>
      <DisplayHeading className="mt-3 text-balance !text-[34px] !leading-[1.08]">
        Looking good, <em>{trainerName || displayName}</em>
      </DisplayHeading>
      <p className="mb-7 mt-2.5 text-sm text-muted-foreground">
        This is yours from here on. Change anything but the team whenever you like.
      </p>

      <motion.div
        {...(reduceMotion
          ? {}
          : {
              initial: { opacity: 0, y: 16, scale: 0.97 },
              animate: { opacity: 1, y: 0, scale: 1 },
              transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
            })}
        className="overflow-hidden rounded-[20px] border border-border bg-card"
        style={{ boxShadow: `0 18px 40px -24px rgba(${team.glow} / 0.55)` }}
      >
        {/* team wash — the colour arriving is the first thing you notice */}
        <motion.div
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { delay: 0.18, duration: 0.6 },
              })}
          className="flex items-center gap-4 px-5 py-5"
          style={{ background: team.tint }}
        >
          <motion.span
            {...(reduceMotion
              ? {}
              : {
                  initial: { opacity: 0, y: -14 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: 0.34, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
                })}
            className="grid h-[86px] w-[86px] flex-none place-items-center rounded-[16px] bg-card"
            style={{ boxShadow: `0 0 0 3px ${team.accent}` }}
          >
            <PokeSprite dex={buddy.dex} fallback={buddy.icon} className="h-16 w-16 text-4xl" />
          </motion.span>

          <span className="min-w-0">
            <span className="block font-mono text-[10px] uppercase tracking-wide" style={{ color: team.ink }}>
              {team.name}
            </span>
            <span className="mt-0.5 block truncate font-serif text-[26px] font-bold leading-tight text-foreground">
              {trainerName || displayName}
            </span>
            <span
              className="block font-mono text-[10px] uppercase tracking-wide"
              style={{ color: team.ink, opacity: 0.8 }}
            >
              {buddy.species}
            </span>
          </span>
        </motion.div>

        <motion.dl {...beat(0.5)} className="grid grid-cols-3 gap-3 px-5 py-4">
          <CardStat label="Trainer ID" value={trainerId} mono />
          <CardStat label="Birthday" value={born} />
          <CardStat label="Joined" value={joined} />
        </motion.dl>
      </motion.div>
    </div>
  );
};

const CardStat = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div className="min-w-0">
    <dt className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">{label}</dt>
    <dd
      className={cn(
        "mt-0.5 truncate text-[13px] text-foreground tabular-nums",
        mono ? "font-mono text-[11px]" : "font-sans"
      )}
    >
      {value}
    </dd>
  </div>
);

export default TrainerOnboarding;
