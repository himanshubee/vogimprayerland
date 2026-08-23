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

// Cache the client across hot reloads in development so we don't open a new
// connection on every request (and exhaust the Atlas connection pool).
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI environment variable. On the server it belongs in " +
        ".env.production.local; locally, .env.local."
    );
  }

  if (process.env.NODE_ENV === "development") {
    global._mongoClientPromise ??= new MongoClient(uri).connect();
    return global._mongoClientPromise;
  }

  clientPromise ??= new MongoClient(uri).connect();
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  try {
    const client = await connect();
    return client.db(DB_NAME());
  } catch (err) {
    // A failed connection attempt must not be cached as a permanently rejected
    // promise — the next request should be free to try again.
    clientPromise = undefined;
    global._mongoClientPromise = undefined;
    throw err;
  }
}
