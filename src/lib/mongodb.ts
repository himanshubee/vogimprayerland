import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "vogim";

if (!uri) {
  throw new Error(
    "Missing MONGODB_URI environment variable. Add it to .env.local / .env.production."
  );
}

// Cache the client across hot reloads in development so we don't open a new
// connection on every request (and exhaust the Atlas connection pool).
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export default clientPromise;
