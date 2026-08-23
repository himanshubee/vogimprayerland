import { getDb } from "@/lib/mongodb";

/**
 * Exchange rates for automatic book pricing (server only).
 *
 * The ministry sets one price per book; every other currency is converted from
 * it. That conversion needs a rate table, and a shop must never make a network
 * call to a rate provider while rendering a page — so rates are fetched at most
 * a couple of times a day, cached in MongoDB, and memoised in memory on top of
 * that.
 *
 * Everything here is built so a rate provider having a bad day cannot take the
 * shop down or, worse, change what a book costs:
 *
 *  - a cached table older than the TTL is still served (marked `stale`) rather
 *    than discarded;
 *  - a failed refresh keeps the previous table;
 *  - with no table at all, books are simply sold in their base currency only —
 *    an invented rate would mean charging the wrong amount.
 *
 * The table is always USD-based; other pairs are derived as cross-rates. One
 * base means one cached document and one refresh, whatever a book is priced in.
 */

const COLLECTION = "settings";
const DOC_ID = "fx_rates";

/** How long a stored table is considered current. */
const TTL_MS = 12 * 60 * 60 * 1000;

/** How long the in-process copy is trusted before re-reading MongoDB. */
const MEMO_MS = 5 * 60 * 1000;

export type FxRates = {
  /** Units of each currency per 1 USD. */
  rates: Record<string, number>;
  fetchedAt: string;
  source: string;
  /** True when the table is past its TTL but still being served. */
  stale: boolean;
};

type FxDoc = {
  _id: string;
  rates: Record<string, number>;
  fetchedAt: Date;
  source: string;
};

/* ------------------------------- Providers ------------------------------ */

/** Both are free and need no API key, so there is no secret to leak or expire. */
type Provider = { name: string; fetch: () => Promise<Record<string, number>> };

const PROVIDERS: Provider[] = [
  {
    name: "open.er-api.com",
    fetch: async () => {
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as {
        result?: string;
        rates?: Record<string, number>;
      };
      if (body.result !== "success" || !body.rates) {
        throw new Error("unexpected payload");
      }
      return body.rates;
    },
  },
  {
    name: "fawazahmed0/currency-api",
    fetch: async () => {
      const res = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { usd?: Record<string, number> };
      if (!body.usd) throw new Error("unexpected payload");
      // This provider uses lowercase codes; normalise to match the first.
      return Object.fromEntries(
        Object.entries(body.usd).map(([k, v]) => [k.toUpperCase(), Number(v)])
      );
    },
  },
];

/** Discard anything that isn't a usable positive number. */
function clean(raw: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [code, value] of Object.entries(raw)) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) out[code.toUpperCase()] = n;
  }
  return out;
}

/* -------------------------------- Cache --------------------------------- */

let memo: { value: FxRates; at: number } | null = null;

/** Dedupes concurrent refreshes — a burst of traffic must not fan out into a
 *  burst of provider calls. */
let inFlight: Promise<FxRates | null> | null = null;

function toRates(doc: FxDoc): FxRates {
  const fetchedAt =
    doc.fetchedAt instanceof Date ? doc.fetchedAt : new Date(doc.fetchedAt);
  return {
    rates: doc.rates,
    fetchedAt: fetchedAt.toISOString(),
    source: doc.source,
    stale: Date.now() - fetchedAt.getTime() > TTL_MS,
  };
}

async function readStored(): Promise<FxRates | null> {
  try {
    const db = await getDb();
    const doc = await db.collection<FxDoc>(COLLECTION).findOne({ _id: DOC_ID });
    return doc?.rates ? toRates(doc) : null;
  } catch (err) {
    console.error("[fx] could not read stored rates:", err);
    return null;
  }
}

async function store(rates: Record<string, number>, source: string): Promise<FxRates> {
  const fetchedAt = new Date();
  try {
    const db = await getDb();
    await db
      .collection<FxDoc>(COLLECTION)
      .updateOne(
        { _id: DOC_ID },
        { $set: { rates, fetchedAt, source } },
        { upsert: true }
      );
  } catch (err) {
    // Serve what we just fetched even if we could not persist it.
    console.error("[fx] could not store rates:", err);
  }
  return { rates, fetchedAt: fetchedAt.toISOString(), source, stale: false };
}

/**
 * Fetch a fresh table, trying each provider in turn.
 * Returns null only when every provider failed.
 */
async function fetchFresh(): Promise<FxRates | null> {
  for (const provider of PROVIDERS) {
    try {
      const rates = clean(await provider.fetch());
      if (!rates.USD) rates.USD = 1; // the base, whether or not it was sent
      if (Object.keys(rates).length < 10) throw new Error("implausibly small table");
      const stored = await store(rates, provider.name);
      memo = { value: stored, at: Date.now() };
      return stored;
    } catch (err) {
      console.error(`[fx] provider ${provider.name} failed:`, err);
    }
  }
  return null;
}

/**
 * The current rate table, refreshing it if the stored one has aged out.
 *
 * Never throws. Returns null only when there is no table at all — neither
 * cached nor fetchable — in which case books fall back to base-currency-only
 * pricing rather than being priced from a guess.
 */
export async function getRates(): Promise<FxRates | null> {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.value;

  const stored = await readStored();
  if (stored && !stored.stale) {
    memo = { value: stored, at: Date.now() };
    return stored;
  }

  // Stored table is missing or past its TTL — refresh, but only once across
  // however many requests arrive while that is in flight.
  if (!inFlight) {
    inFlight = fetchFresh().finally(() => {
      inFlight = null;
    });
  }
  const fresh = await inFlight;

  // Every provider failed. A stale table is far better than no prices: rates
  // move by fractions of a percent a day, and the alternative is a shop that
  // sells in one currency.
  if (!fresh && stored) {
    memo = { value: stored, at: Date.now() };
    return stored;
  }
  return fresh;
}

/** Force a refresh, ignoring the TTL — the admin's "update rates" button. */
export async function refreshRates(): Promise<FxRates | null> {
  memo = null;
  const fresh = await fetchFresh();
  return fresh ?? (await readStored());
}

/**
 * Convert between two currencies via the USD-based table.
 * Returns null when either side is missing, so callers can decline to price
 * rather than invent a number.
 */
export function convert(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number> | null | undefined
): number | null {
  if (!rates || !(amount > 0)) return null;
  if (from === to) return amount;
  const fromRate = rates[from.toUpperCase()];
  const toRate = rates[to.toUpperCase()];
  if (!fromRate || !toRate) return null;
  return (amount / fromRate) * toRate;
}
