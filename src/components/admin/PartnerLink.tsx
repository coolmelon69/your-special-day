import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Clock, Copy, Heart, Link2, RefreshCw, Unlink } from "lucide-react";
import {
  createInvite,
  formatInviteCode,
  isCodeExpired,
  loadCouple,
  unlinkCouple,
  type Couple,
} from "@/utils/couples";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type LoadState = "loading" | "ready" | "error";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatExpiry = (expiresAt: string): string => {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const days = Math.ceil(ms / MS_PER_DAY);
  if (days <= 1) return "expires within a day";
  return `expires in ${days} days`;
};

const formatLinkedDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

const PartnerLink = () => {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [couple, setCouple] = useState<Couple | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const refresh = async () => {
    setLoadState("loading");
    setActionError(null);
    try {
      const result = await loadCouple();
      setCouple(result);
      setLoadState("ready");
    } catch (error) {
      console.error("Error loading couple:", error);
      setLoadState("error");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setActionError(null);
    try {
      const code = await createInvite();
      if (!code) {
        setActionError("Could not generate an invite code. Please try again.");
        return;
      }
      await refresh();
    } catch (error) {
      console.error("Error generating invite:", error);
      setActionError("Could not generate an invite code. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!couple) return;
    try {
      await navigator.clipboard.writeText(formatInviteCode(couple.inviteCode));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying invite code:", error);
      setActionError("Could not copy the code — select and copy it manually.");
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    setActionError(null);
    try {
      const ok = await unlinkCouple();
      if (!ok) {
        setActionError("Could not unlink. Only the pair owner can — check you're signed in as them.");
        return;
      }
      // Reload rather than refresh(): unlinking flips the scope of every
      // shared read back to solo, exactly like linking does in reverse, and
      // the rest of the app is still holding couple-scoped data.
      window.location.reload();
    } catch (error) {
      console.error("Error unlinking couple:", error);
      setActionError("Could not unlink. Please try again.");
    } finally {
      setUnlinking(false);
    }
  };

  const linked = couple !== null && couple.linkedAt !== null;
  const expired = couple !== null && !linked && isCodeExpired(couple);

  const headerIconClass = linked ? "text-rose" : couple ? "text-primary" : "text-muted-foreground";

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Heart className={`w-4 h-4 mt-0.5 flex-shrink-0 ${headerIconClass}`} />
        <div>
          <p className="text-sm font-medium text-foreground">Partner link</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Linking joins your accounts into one shared adventure. Whoever redeems your code joins
            your journey — your stamps, coupons and photos become theirs too, and anything they
            collected on their own is replaced.
          </p>
        </div>
      </div>

      {loadState === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin text-muted-foreground" />
          <span className="font-mono text-[11px] uppercase tracking-wide">Loading link status…</span>
        </div>
      )}

      {loadState === "error" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="text-sm text-foreground">Could not load the partner link status.</p>
            <button
              type="button"
              onClick={refresh}
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      )}

      {loadState === "ready" && actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-destructive" />
          <p className="text-sm text-foreground">{actionError}</p>
        </div>
      )}

      {/* Solo, no invite yet */}
      {loadState === "ready" && !couple && (
        <div>
          <motion.button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[10px] border border-primary bg-primary text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50"
            whileTap={{ scale: 0.97 }}
          >
            <Link2 className="w-4 h-4" />
            <span>{generating ? "Generating…" : "Generate invite code"}</span>
          </motion.button>
        </div>
      )}

      {/* Invite pending */}
      {loadState === "ready" && couple && !linked && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
          <p
            className="font-mono font-bold text-foreground text-center select-all"
            style={{ fontSize: "2rem", letterSpacing: "0.35em", lineHeight: 1.3 }}
          >
            {formatInviteCode(couple.inviteCode)}
          </p>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-[10px] border border-border text-foreground hover:border-foreground transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-rose" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              <span>{copied ? "Copied" : "Copy code"}</span>
            </button>
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatExpiry(couple.codeExpiresAt)}
            </span>
          </div>

          {expired && (
            <div className="pt-1 border-t border-primary/20 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">This code has expired.</p>
              <motion.button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-[10px] border border-primary bg-primary text-primary-foreground hover:brightness-95 disabled:opacity-50"
                whileTap={{ scale: 0.97 }}
              >
                <RefreshCw className="w-4 h-4" />
                <span>{generating ? "Generating…" : "Generate a fresh code"}</span>
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Linked */}
      {loadState === "ready" && couple && linked && (
        <div className="rounded-lg border border-rose/40 bg-rose/5 p-4 space-y-1.5">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-rose">
            <Check className="w-4 h-4" />
            Linked
          </p>
          <p className="text-sm text-muted-foreground">
            Paired on {formatLinkedDate(couple.linkedAt as string)}. Shared from here on — stamps,
            coupons, photos and the timeline are one journey now.
          </p>

          {/* Testing control. Deliberately plain and last: unlinking is not part
              of the product, it exists so the one-shot link flow can be run
              more than once while building. */}
          <div className="pt-3 mt-1 border-t border-rose/20">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={unlinking}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <Unlink className="w-4 h-4" />
                  <span>{unlinking ? "Unlinking…" : "Unlink (testing)"}</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unlink from your partner?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        Both accounts go back to solo and the invite code is freed, so you can link
                        again. No stamps, photos or coupons are deleted.
                      </p>
                      <p>
                        They do get split by author, though: anything your partner made while linked
                        goes with them, not with you. And their own progress from before you linked
                        was already removed at link time — unlinking can't bring that back.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Stay linked</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUnlink}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Unlink
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerLink;
