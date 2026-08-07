import { useState } from "react";
import { motion } from "framer-motion";
import { Eyebrow, DisplayHeading } from "@/components/editorial";
import { AVATAR_PRESETS, TEAMS } from "@/utils/trainerCard";
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
}

const TrainerOnboarding = ({ onSubmit, isSubmitting }: TrainerOnboardingProps) => {
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [avatarId, setAvatarId] = useState<string>(AVATAR_PRESETS[0].id);
  const [teamId, setTeamId] = useState<string>(TEAMS[0].id);

  const isValid = displayName.trim().length > 0 && birthday.length > 0 && trainerName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    onSubmit({ displayName: displayName.trim(), birthday, trainerName: trainerName.trim(), avatarId, teamId });
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background">
      <div className="container px-6 py-16 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Eyebrow>Welcome, Trainer</Eyebrow>
          <DisplayHeading className="mt-4">
            Let's set up <em>your</em> trainer card<span className="dot-accent">.</span>
          </DisplayHeading>
          <p className="text-muted-foreground mt-4 mb-8">
            Just once — this becomes your profile for the whole adventure.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block font-mono text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                Your name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-[10px] border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. Alex"
              />
            </div>

            <div>
              <label htmlFor="birthday" className="block font-mono text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                Birthday
              </label>
              <input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-[10px] border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="trainerName" className="block font-mono text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                Trainer nickname
              </label>
              <input
                id="trainerName"
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-[10px] border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="What should your card call you?"
              />
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                Pick your avatar
              </p>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAvatarId(preset.id)}
                    className={cn(
                      "aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                      avatarId === preset.id
                        ? "border-rose bg-rose/10 scale-105"
                        : "border-border bg-card hover:border-foreground"
                    )}
                  >
                    <span className="text-2xl">{preset.icon}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                Pick your team
              </p>
              <div className="grid gap-2">
                {TEAMS.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setTeamId(team.id)}
                    className={cn(
                      "rounded-[14px] border p-3 text-left transition-colors",
                      teamId === team.id ? "border-transparent" : "border-border bg-card hover:border-foreground"
                    )}
                    style={
                      teamId === team.id
                        ? { background: team.tint, boxShadow: `inset 0 0 0 1.5px ${team.accent}` }
                        : undefined
                    }
                    aria-pressed={teamId === team.id}
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: team.accent }} aria-hidden />
                      <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: team.ink }}>
                        {team.name}
                      </span>
                    </span>
                    <span className="mt-1 block font-serif text-[16px] italic text-foreground">{team.motto}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full px-6 py-3 text-base font-medium rounded-[10px] border border-rose bg-rose text-white hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              {isSubmitting ? "Saving…" : "Start the adventure"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default TrainerOnboarding;
