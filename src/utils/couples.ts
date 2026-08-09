/**
 * Pairing two accounts into a couple — invite codes, the shared journey link,
 * and the admin-identity RPCs that ride along with it (`is_pair_owner`,
 * `grant_coins`). See docs/superpowers/specs/2026-08-09-couples-pairing-design.md.
 *
 * The `couples` row is the source of truth. `create_invite`/`redeem_invite`
 * are `security definer` RPCs — ownership and linking are decided server-side,
 * the client never sends a user id or a couple id.
 */
// Lazy rather than a static import: `supabaseClient.ts` reads `import.meta.env`
// at module scope, which only exists under Vite. A static import would pull
// that in the moment anything imports this file — including `couples.check.ts`
// running under plain `node`, which has no `import.meta.env` and would crash
// before a single assertion runs. Deferring to first RPC call keeps the pure
// helpers below testable with no bundler in the loop.
const getSupabase = async () => (await import("./supabaseClient.ts")).supabase;

export interface Couple {
  id: string;
  ownerId: string;
  partnerId: string | null;
  inviteCode: string;
  codeExpiresAt: string; // ISO
  linkedAt: string | null; // ISO
  createdAt: string | null;
}

export type RedeemFailure =
  | "not_found"
  | "expired"
  | "already_used"
  | "already_linked"
  | "own_code"
  | "no_profile"
  | "error";

export type RedeemResult = { status: "linked" } | { status: "error"; reason: RedeemFailure };

/** No O, 0, I, 1 — codes get read aloud and retyped on a phone. */
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;

/**
 * Client-side code generator. NOT what actually mints an invite — the
 * authoritative code always comes back from `create_invite()` on the server.
 * This exists only so the self-check can exercise the alphabet/length rules
 * without a database, and for any optimistic UI that wants to preview a shape
 * before the RPC resolves. Never send a client-generated code to `redeem_invite`
 * expecting it to work; only a server-minted code is ever valid.
 */
export const generateInviteCode = (rng: () => number = Math.random): string => {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)];
  }
  return code;
};

/** "ABC234" -> "ABC-234" — display only, never sent back over the wire like this. */
export const formatInviteCode = (code: string): string =>
  `${code.slice(0, 3)}-${code.slice(3)}`;

/** "abc-234", "abc 234", "ABC234" -> "ABC234". Strip separators, uppercase.
 *  The SQL side normalises too; doing it here as well means a bad-looking
 *  code never round-trips through the network just to get rejected. */
export const normalizeInviteCode = (input: string): string =>
  input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

/** Pure comparison so the UI can show "expired" without waiting on a round trip. */
export const isCodeExpired = (couple: Couple, now: Date = new Date()): boolean =>
  new Date(couple.codeExpiresAt).getTime() <= now.getTime();

type CoupleRow = {
  id: string;
  owner_id: string;
  partner_id: string | null;
  invite_code: string;
  code_expires_at: string;
  linked_at: string | null;
  created_at: string | null;
};

const mapCouple = (row: CoupleRow): Couple => ({
  id: row.id,
  ownerId: row.owner_id,
  partnerId: row.partner_id ?? null,
  inviteCode: row.invite_code,
  codeExpiresAt: row.code_expires_at,
  linkedAt: row.linked_at ?? null,
  createdAt: row.created_at ?? null,
});

/**
 * Create (or re-fetch) this account's invite. Calling it twice before
 * redemption is safe — the RPC returns the existing code instead of minting a
 * second one, so a page refresh can't orphan invites. Raises server-side if
 * the caller is already in a couple; that surfaces here as a null return.
 */
export const createInvite = async (): Promise<string | null> => {
  const supabase = await getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc("create_invite");
    if (error) {
      console.error("Error creating invite:", error);
      return null;
    }
    return typeof data === "string" ? data : null;
  } catch (error) {
    console.error("Error creating invite:", error);
    return null;
  }
};

/** The caller's couple row, selectable directly under RLS by either member.
 *  Null means solo — no couple row, or no session. */
export const loadCouple = async (): Promise<Couple | null> => {
  const supabase = await getSupabase();
  if (!supabase) return null;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("couples")
      .select("id, owner_id, partner_id, invite_code, code_expires_at, linked_at, created_at")
      .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
      .maybeSingle();

    if (error || !data) return null;
    return mapCouple(data as CoupleRow);
  } catch (error) {
    console.error("Error loading couple:", error);
    return null;
  }
};

/** User-facing copy for each redeem failure. Specific per case on purpose — a
 *  vague or silent failure here is the worst outcome in this app: she would
 *  believe she's paired, see an empty journey, and read her old data as gone. */
export const REDEEM_MESSAGES: Record<RedeemFailure, string> = {
  not_found: "That code doesn't match anything — double-check the letters and try again.",
  expired: "That code has expired. Ask them to open their invite again for a fresh one.",
  already_used: "That code has already been used to link an account.",
  already_linked: "You're already paired with someone — this account can't link twice.",
  own_code: "That's your own code! Send it to them instead, and they can type it in here.",
  no_profile: "Almost there — finish setting up your trainer profile first, then come back and link.",
  error: "Something went wrong linking your accounts. Nothing changed — please try again.",
};

/**
 * Redeem an invite code. Normalises client-side before sending (the SQL side
 * also normalises, so this is belt-and-suspenders, not the source of truth).
 * The RPC returns one of a fixed set of strings rather than a boolean so every
 * rejection reason can be surfaced on its own — no silent no-ops.
 */
export const redeemInvite = async (code: string): Promise<RedeemResult> => {
  const supabase = await getSupabase();
  if (!supabase) return { status: "error", reason: "error" };

  try {
    const { data, error } = await supabase.rpc("redeem_invite", {
      p_code: normalizeInviteCode(code),
    });
    if (error) {
      console.error("Error redeeming invite:", error);
      return { status: "error", reason: "error" };
    }
    if (data === "linked") return { status: "linked" };
    if (
      data === "not_found" ||
      data === "expired" ||
      data === "already_used" ||
      data === "already_linked" ||
      data === "own_code" ||
      data === "no_profile"
    ) {
      return { status: "error", reason: data };
    }
    return { status: "error", reason: "error" };
  } catch (error) {
    console.error("Error redeeming invite:", error);
    return { status: "error", reason: "error" };
  }
};

/** Whether the signed-in account is the couple's owner — the admin. Every
 *  admin action gates on this server-side too; this is for the UI to decide
 *  what to show, not the actual security boundary. */
export const isPairOwner = async (): Promise<boolean> => {
  const supabase = await getSupabase();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("is_pair_owner");
    if (error) {
      console.error("Error checking pair owner:", error);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error("Error checking pair owner:", error);
    return false;
  }
};

/**
 * Testing control: dissolve the pair. Owner only — the RPC raises for anyone
 * else, so a false here means either "not the owner" or "no couple".
 *
 * Returns both accounts to solo, keeping every shared row but handing it back
 * to whoever authored it. It does NOT restore the partner's pre-link rows:
 * `adopt_owner_journey` deleted those at link time. See
 * sql/2026-08-09-unlink-couple.sql.
 */
export const unlinkCouple = async (): Promise<boolean> => {
  const supabase = await getSupabase();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("unlink_couple");
    if (error) {
      console.error("Error unlinking couple:", error);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error("Error unlinking couple:", error);
    return false;
  }
};

/**
 * Admin escape hatch: grant coins to either trainer's own balance. "partner"
 * needs the partner's uuid, which only the couple row has — load it, pick
 * whichever of ownerId/partnerId isn't the caller, and pass that as p_target.
 * With no couple or no partner linked yet, there's nobody to grant to, so this
 * returns false without calling the RPC at all.
 */
export const grantCoins = async (amount: number, target: "me" | "partner"): Promise<boolean> => {
  const supabase = await getSupabase();
  if (!supabase) return false;

  try {
    if (target === "me") {
      const { data, error } = await supabase.rpc("grant_coins", { p_amount: amount });
      if (error) {
        console.error("Error granting coins:", error);
        return false;
      }
      return data === true;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const couple = await loadCouple();
    if (!couple || !couple.partnerId) return false;

    const partnerId = couple.ownerId === user.id ? couple.partnerId : couple.ownerId;
    if (!partnerId) return false;

    const { data, error } = await supabase.rpc("grant_coins", {
      p_amount: amount,
      p_target: partnerId,
    });
    if (error) {
      console.error("Error granting coins:", error);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error("Error granting coins:", error);
    return false;
  }
};

/** One trainer's team, as the admin panel sees it. */
export interface CoupleTeam {
  userId: string;
  displayName: string;
  /** Null on a profile saved before teams existed — `teamFor()` resolves it. */
  teamId: string | null;
  isSelf: boolean;
}

/**
 * Both halves' current team. Owner only, and only ever two rows.
 *
 * This needs an RPC because `profiles_select` is `auth.uid() = user_id`: the
 * admin can set the partner's team but, without this, could not read what it
 * currently is — so the panel would render every partner row preselected to
 * whatever the fallback happens to be, and "change" would look like a no-op.
 * Never returns an empty array in practice — the caller always has their own
 * profile row. Null means the call itself failed, which the panel must show as
 * an error rather than as "you have no card": the two look identical from an
 * empty array, and the likeliest failure is this file's SQL not having been run
 * on the database yet.
 */
export const loadCoupleTeams = async (): Promise<CoupleTeam[] | null> => {
  const supabase = await getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc("couple_teams");
    if (error) {
      console.error("Error loading couple teams:", error);
      return null;
    }
    return (data ?? []).map((row: { user_id: string; display_name: string; team_id: string | null; is_self: boolean }) => ({
      userId: row.user_id,
      displayName: row.display_name,
      teamId: row.team_id ?? null,
      isSelf: row.is_self,
    }));
  } catch (error) {
    console.error("Error loading couple teams:", error);
    return null;
  }
};

/**
 * Set a trainer's team. Owner only — the RPC raises for anyone else, and
 * rejects any id that isn't one of the three.
 *
 * Takes the target uuid directly rather than a "me" | "partner" flag the way
 * `grantCoins` does: the caller already has both uuids in hand from
 * `loadCoupleTeams`, so re-deriving one here would only be a second chance to
 * pick the wrong row.
 */
export const setTeam = async (teamId: string, targetUserId: string): Promise<boolean> => {
  const supabase = await getSupabase();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("set_team", {
      p_team_id: teamId,
      p_target: targetUserId,
    });
    if (error) {
      console.error("Error setting team:", error);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error("Error setting team:", error);
    return false;
  }
};
