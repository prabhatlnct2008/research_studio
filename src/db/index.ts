import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Falls back to a local SQLite file when Turso env vars are absent, so the app
// runs end-to-end without provisioning external services. In production set
// TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
const url = process.env.TURSO_DATABASE_URL || "file:./local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const globalForDb = globalThis as unknown as {
  _libsql?: ReturnType<typeof createClient>;
};

const client =
  globalForDb._libsql ?? createClient(authToken ? { url, authToken } : { url });

if (process.env.NODE_ENV !== "production") globalForDb._libsql = client;

export const db = drizzle(client, { schema });
export { schema };
