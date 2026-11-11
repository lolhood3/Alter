import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});

test("database access is optional and does not throw during module initialization", async () => {
  delete process.env.DATABASE_URL;
  const { getDb } = await import("@/db");
  assert.equal(getDb(), null);
});

test("health is OK without DATABASE_URL", async () => {
  delete process.env.DATABASE_URL;
  const { GET } = await import("./route");
  const response = await GET();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { ok: true, database: "not_configured" });
});

test("blank DATABASE_URL is treated as not configured", async () => {
  process.env.DATABASE_URL = "   ";
  const { GET } = await import("./route");
  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, database: "not_configured" });
});

test("a configured but unavailable database returns 503", async () => {
  // Port 1 is reserved and refuses local connections; no credentials are used.
  process.env.DATABASE_URL = "postgresql://127.0.0.1:1/alter_health_test";
  const { GET } = await import("./route");
  const response = await GET();

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, database: "unavailable" });
});
