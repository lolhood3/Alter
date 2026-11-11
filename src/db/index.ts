import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

interface DatabaseConnection {
  url: string;
  pool: Pool;
  db: NodePgDatabase;
}

const globalForDb = globalThis as typeof globalThis & {
  __alterDatabaseConnection?: DatabaseConnection;
};

/**
 * Returns the optional PostgreSQL connection without doing work at module load.
 *
 * ALTER's MVP persists product data in the browser. Database-backed features can
 * call this when they run and handle `null` when DATABASE_URL is not configured.
 */
export function getDb(): NodePgDatabase | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;

  const cached = globalForDb.__alterDatabaseConnection;
  if (cached?.url === url) return cached.db;

  const pool = new Pool({
    connectionString: url,
    // Keep health checks bounded when a configured database is unreachable.
    connectionTimeoutMillis: 5_000,
  });
  const db = drizzle(pool);
  globalForDb.__alterDatabaseConnection = { url, pool, db };
  return db;
}
