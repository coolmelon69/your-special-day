/**
 * What each Poké item actually *does* in real life.
 *
 * Every item in the bag is a coupon: PokéAPI supplies the sprite and the
 * in-game flavour text, this file supplies the promise attached to it. The two
 * are shown together — theirs on top, ours underneath — so the joke lands: the
 * action is a translation of the real effect, not a random favour. A 20 HP
 * Potion is a small favour; 100 HP of Moomoo Milk is a whole cooked meal; a
 * catch-rate ball is "you can't say no".
 *
 * Redeeming consumes the coupon (`redeem_item` stamps `redeemedAt`), so the
 * wording is always a single, finishable thing — never a standing rule.
 *
 * `spicy` items are hidden behind the reveal toggle. They're teasing, not
 * explicit, but they're nobody's business on a shared screen.
 */

export interface ItemAction {
  /** The promise. Second person, imperative-ish, one sentence. */
  action: string;
  /** Hidden until the reveal toggle is on. */
  spicy?: boolean;
}

export const ITEM_ACTIONS: Record<string, ItemAction> = {
  // ---- Shop shelf: healing ------------------------------------------------
  // Restore-HP items scale with the number in their flavour text.
  "berry-juice": { action: "I make you a drink. Your recipe, your glass, brought to you." },
  "fresh-water": { action: "I bring you water and you drink the whole thing, right now." },
  potion: { action: "Five minutes of shoulders, no phone in my other hand." },
  "soda-pop": { action: "Fizzy drink and a snack, delivered, and no comment about the sugar." },
  casteliacone: { action: "Ice cream run. Whatever the weather, whatever the hour." },
  "sweet-heart": { action: "Chocolate, hand-fed, in the passenger seat. Your hands stay down.", spicy: true },
  lemonade: { action: "Dessert run at a stupid hour. I drive, you choose." },
  "moomoo-milk": { action: "I cook you a full meal start to finish. You don't touch the kitchen." },
  "super-potion": { action: "Fifteen minutes of back massage, properly, not the lazy version." },
  leftovers: { action: "Tea in your hands every night for a week. Seven nights, I'm counting." },
  revive: { action: "Bad day rescue. I take every chore tonight and you do nothing at all." },
  "max-revive": { action: "Total rescue. Sleep in as long as you want — I handle the entire day." },
  "full-restore": { action: "A reset day. Nothing on the calendar, and you pick every single thing." },

  // ---- Shop shelf: status cures -----------------------------------------
  "pecha-berry": { action: "Cancel one bad mood. Argument dropped, and I never bring it back up." },
  // Paralysis heals → so you don't have to move.
  "cheri-berry": { action: "You don't get up for the next hour. Whatever you need, I fetch." },
  // Burn heals → I take the thing that's smouldering.
  "rawst-berry": { action: "I do the dishes tonight. All of them, and you don't come and check." },
  "full-heal": { action: "One do-over. Whatever went wrong today, we agree it didn't happen." },
  "leppa-berry": { action: "Coffee or boba, your order, I go and get it." },
  "escape-rope": { action: "Get out of anything — dinner, party, phone call. I make the excuse." },
  // Attracts what's out there → so does saying it out loud.
  honey: { action: "One compliment every hour, out loud, for a whole day." },

  // ---- Shop shelf: capture ----------------------------------------------
  // Catch rate becomes "how hard is it for me to refuse you".
  "great-ball": { action: "I say yes to one small thing, no questions asked.", spicy: true },
  "ultra-ball": { action: "I say yes to one big thing. You already know which one.", spicy: true },
  "love-ball": {
    action: "Three minutes of kissing in the car before either of us goes inside. Timer on.",
    spicy: true,
  },

  // ---- Shop shelf: hold items -------------------------------------------
  everstone: {
    action: "Park somewhere quiet and neither of us gets out for thirty minutes. Engine off.",
    spicy: true,
  },
  "soothe-bell": { action: "Twenty minutes of cuddling with both phones in another room." },
  "amulet-coin": { action: "Double coins for a day, and I match it for real — your spend is on me." },
  // Takes a share of everything earned.
  "exp-share": { action: "Whatever good thing happens to me this week, you get half of it." },
  // Rewards the move used again and again.
  metronome: { action: "Our favourite thing, again. Same place, same order, same everything." },
  // A pair item — it only ever works on two of them.
  "soul-dew": { action: "One thing we only ever do together. You choose it, I don't get a say." },
  "destiny-knot": {
    action: "Whatever I feel, you feel. Matching something — outfit, ink, promise. You pick.",
    spicy: true,
  },

  // ---- Shop shelf: evolution stones -------------------------------------
  // "Makes certain species evolve" → the night changes into something else.
  "fire-stone": {
    action: "My hand goes wherever you put it, and stays there the whole drive home.",
    spicy: true,
  },
  "water-stone": {
    action: "Drive out to water and stay in the car until it's dark. What happens in there is your call.",
    spicy: true,
  },
  "thunder-stone": { action: "Drop everything right now. We go out, no plan, no destination." },
  // Sparkles like eyes, first thing.
  "dawn-stone": { action: "I'm up before you. Coffee made, curtains open, the morning already handled." },
  // As dark as dark can be.
  "dusk-stone": { action: "One whole evening. Both phones off, nowhere to be, nobody else invited." },
  "moon-stone": { action: "Late-night walk, just us, until one of us wants to turn back." },

  // ---- Checkpoint drops --------------------------------------------------
  "oran-berry": { action: "A snack, delivered to wherever you are, whatever you're doing." },
  "sitrus-berry": { action: "Breakfast in bed tomorrow morning. You stay horizontal." },
  "sun-stone": { action: "A sunrise or a sunset, together. Your call which one." },
  "heart-scale": { action: "One honest thing I've never said out loud. Ask and I answer." },
  "lucky-egg": { action: "You pick everything for a whole day. I don't get a veto." },
  "star-piece": { action: "The next date is on me, and we don't talk about the bill." },

  // ---- Rares -------------------------------------------------------------
  "rare-candy": { action: "One wish, granted on the spot. No saving it for later.", spicy: true },
  "shiny-charm": { action: "You dress up however you want and I shoot a whole photo set of you." },
  "master-ball": { action: "The unrefusable. One thing, anything. I cannot say no.", spicy: true },
};

export const actionFor = (slug: string): ItemAction | null => ITEM_ACTIONS[slug] ?? null;

/** Reveal toggle for the teasing coupons. Device-local on purpose: it's a
 *  "someone is looking over my shoulder" switch, not a preference worth syncing
 *  to a row her partner can read. */
const SPICY_KEY = "bag-reveal-teasing";

export const loadSpicyRevealed = (): boolean => {
  try {
    return localStorage.getItem(SPICY_KEY) === "1";
  } catch {
    return false;
  }
};

export const saveSpicyRevealed = (on: boolean): void => {
  try {
    localStorage.setItem(SPICY_KEY, on ? "1" : "0");
  } catch {
    // Private mode / storage disabled: the toggle just doesn't persist.
  }
};
