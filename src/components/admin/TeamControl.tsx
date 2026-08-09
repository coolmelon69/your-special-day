import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2, RefreshCw, Shield } from "lucide-react";
import PokeSprite from "@/components/PokeSprite";
import { loadCoupleTeams, setTeam, type CoupleTeam } from "@/utils/couples";
import { TEAMS, teamFor } from "@/utils/trainerCard";
import { cn } from "@/lib/utils";

/**
 * The only place a team can be changed after onboarding.
 *
 * Teams are picked once, on the last step of the wizard, and then left alone —
 * a card whose colour can be swapped from the card itself stops feeling like an
 * allegiance. This panel is the deliberate exception: the pair owner can fix a
 * mis-tap, on their own card or their partner's.
 *
 * A solo account sees one row. `couple_teams()` narrows to the caller when they
 * own no pair, so there is no separate solo path to keep in step here.
 */
const TeamControl = () => {
  // Three states, not two: undefined is still loading, null is a load that
  // failed. Collapsing the failure into an empty array is what made a missing
  // RPC read as "no trainer card yet" — the one message guaranteed to be wrong,
  // since a trainer looking at this panel always has a card.
  const [rows, setRows] = useState<CoupleTeam[] | null | undefined>(undefined);
  const [savingFor, setSavingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setRows(undefined);
    return loadCoupleTeams().then(setRows);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePick = async (target: CoupleTeam, teamId: string) => {
    if (target.teamId === teamId || savingFor) return;
    const previous = target.teamId;

    setError(null);
    setSavingFor(target.userId);
    // Optimistic: the chips are the only feedback, so waiting on the round-trip
    // reads as a dead tap. Reverted below if the write is refused.
    setRows((current) =>
      (current ?? []).map((row) => (row.userId === target.userId ? { ...row, teamId } : row))
    );

    const ok = await setTeam(teamId, target.userId);
    if (!ok) {
      setRows((current) =>
        (current ?? []).map((row) => (row.userId === target.userId ? { ...row, teamId: previous } : row))
      );
      setError(
        target.isSelf
          ? "Couldn't change your team. Check your connection and try again."
          : "Couldn't change your partner's team. Only the trainer who created the invite can do that."
      );
    }
    setSavingFor(null);
  };

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">Teams</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Picked once during setup and locked on the card itself. Change one here if it was a
            mis-tap — it recolours that trainer's whole card.
          </p>
        </div>
      </div>

      {rows === undefined ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Loading teams…
        </p>
      ) : rows === null ? (
        <div className="space-y-2">
          <p className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
            Couldn't load teams. The database is missing the team functions — run{" "}
            <code className="font-mono text-xs">sql/2026-08-09-set-team.sql</code>, then reload.
          </p>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 rounded-[10px] border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" aria-hidden />
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No trainer card yet — finish the setup and the team will show up here.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const current = teamFor(row.teamId);
            return (
              <div key={row.userId} className="rounded-[12px] border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {row.displayName}
                    {row.isSelf && (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        You
                      </span>
                    )}
                  </p>
                  {savingFor === row.userId && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" aria-hidden />
                  )}
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label={`Team for ${row.displayName}`}>
                  {TEAMS.map((t) => {
                    const active = t.id === current.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handlePick(row, t.id)}
                        disabled={savingFor !== null}
                        aria-pressed={active}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-[10px] border p-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60",
                          active ? "border-transparent" : "border-border hover:border-foreground"
                        )}
                        style={active ? { background: t.tint, boxShadow: `inset 0 0 0 1.5px ${t.accent}` } : undefined}
                      >
                        <PokeSprite dex={t.dex} fallback="✨" className="h-9 w-9" />
                        <span
                          className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide"
                          style={{ color: active ? t.ink : undefined }}
                        >
                          {active && <Check className="w-3 h-3" aria-hidden />}
                          {t.name.replace("Team ", "")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default TeamControl;
