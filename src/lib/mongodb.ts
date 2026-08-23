import { MongoClient, type Db } from "mongodb";

/**
 * The MongoDB connection, created on first use.
 *
 * Deliberately lazy. This module used to read MONGODB_URI at import time and
 * throw if it was missing — which meant the *build* could not run at all
 * without a database URI, because `next build` imports every route to collect
 * page data. A deploy that lost its env file therefore died with
 * "Failed to collect page data for /sitemap.xml" and no hint at the cause.
 *
 * Everything that reads the database already handles failure (listPublishedBooks
 * returns [], getSettings falls back to defaults, and so on), so raising the
 * error from getDb() instead lets those paths do their job: the build succeeds
 * and pages render their empty states rather than the whole thing collapsing.
 *
 * Configuration is still verified loudly at deploy time — see the preflight
 * check in deploy.sh, which refuses to build when the required keys are absent.
 */

const DB_NAME = () => process.env.MONGODB_DB || "vogim";

/**
 * Fail a dead connection in ten seconds rather than the driver's default
 * thirty. A build renders dozens of pages; at the default a single unreachable
 * cluster turns a two-minute build into a twenty-minute one before it gives up.
 */
const SERVER_SELECTION_TIMEOUT_MS = 10_000;

/**
 * How long a failed connection is remembered before another attempt is made.
 *
 * Both extremes are wrong here. Caching a rejected promise forever means one
 * blip at boot breaks the app until someone restarts it. Clearing it on every
 * failure is worse: each caller then opens its own fresh connection and waits
 * out the full timeout, so an unreachable cluster makes every page crawl. A
 * short cooldown gives fast failures while still letting the app heal on its
 * own once the database comes back.
 */
const RETRY_COOLDOWN_MS = 10_000;

// Cache the client across hot reloads in development so we don't open a new
// connection on every request (and exhaust the Atlas connection pool).
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoFailedAt: number | undefined;
}

const isDev = () => process.env.NODE_ENV === "development";

/** Dev keeps its cache on `global` so hot reload doesn't reconnect each time. */
let localPromise: Promise<MongoClient> | undefined;
let localFailedAt = 0;

const cached = () => (isDev() ? global._mongoClientPromise : localPromise);
const failedAt = () => (isDev() ? (global._mongoFailedAt ?? 0) : localFailedAt);

function remember(promise: Promise<MongoClient> | undefined, failed: number) {
  if (isDev()) {
    global._mongoClientPromise = promise;
    global._mongoFailedAt = failed;
  } else {
    localPromise = promise;
    localFailedAt = failed;
  }
}

function connect(): Promise<MongoClient> {
  const existing = cached();
  if (existing) return existing;

  // Still inside the cooldown from the last failure — fail immediately rather
  // than making this caller wait out another timeout.
  const since = Date.now() - failedAt();
  if (failedAt() && since < RETRY_COOLDOWN_MS) {
    return Promise.reject(
      new Error(
        "MongoDB is unreachable (retrying shortly). Check MONGODB_URI and that " +
          "this server's IP is allowed in Atlas → Network Access."
      )
    );
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI environment variable. On the server it belongs in " +
        ".env.production.local; locally, .env.local."
    );
  }

  const promise = new MongoClient(uri, {
    serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
  })
    .connect()
    .catch((err) => {
      // Drop the cached promise and start the cooldown, so the app recovers by
      // itself once the database is reachable again.
      remember(undefined, Date.now());
      throw err;
    });

  remember(promise, 0);
  return promise;
}

export async function getDb(): Promise<Db> {
  const client = await connect();
  return client.db(DB_NAME());
}
