import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  // PostgreSQL is optional for the local-first MVP. An absent database must not
  // make an otherwise healthy deployment (or its production build) fail.
  if (!db) {
    return Response.json(
      { ok: true, database: "not_configured" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await db.execute(sql`select 1`);
    return Response.json(
      { ok: true, database: "connected" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, database: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
