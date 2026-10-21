import "server-only";
import { neon } from "@neondatabase/serverless";

// Free-tier providers cap requests per day. Metering here keeps a lesson from
// burning the whole quota mid-period: once the budget is gone the engine serves
// rules-based coaching instead of letting every call fail with a provider 429.
const DEFAULT_DAILY_BUDGET = 460;

export function aiDailyBudget() {
  const raw = Number(process.env.OPTICS_AI_DAILY_BUDGET);
  return Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_DAILY_BUDGET;
}

// Gemini resets request-per-day quota at midnight Pacific, so the budget window
// must follow that boundary rather than the server's local date.
export function quotaDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function sqlClient() { if (!process.env.DATABASE_URL) throw new Error("database_not_configured"); return neon(process.env.DATABASE_URL); }

let schema: Promise<void> | undefined;
async function ensureBudgetSchema() {
  schema ??= (async () => {
    const sql = sqlClient();
    await sql`CREATE TABLE IF NOT EXISTS optics_ai_budget (
      quota_day DATE PRIMARY KEY,
      calls INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  })().catch(error => { schema = undefined; throw error; });
  await schema;
}

/**
 * Atomically claims one provider call for today. Returns false when the daily
 * budget is already spent, so the caller can fall back without a network round
 * trip. Fails open: a metering outage must not block teaching, and the provider
 * error path still degrades to rules-based feedback.
 */
export async function reserveAiCall(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return true;
  try {
    await ensureBudgetSchema();
    const sql = sqlClient();
    const rows = await sql`INSERT INTO optics_ai_budget (quota_day, calls) VALUES (${quotaDay()}, 1)
      ON CONFLICT (quota_day) DO UPDATE SET calls = optics_ai_budget.calls + 1, updated_at = NOW()
      WHERE optics_ai_budget.calls < ${aiDailyBudget()} RETURNING calls`;
    return rows.length > 0;
  } catch { return true; }
}

export async function readAiBudget() {
  if (!process.env.DATABASE_URL) return null;
  try {
    await ensureBudgetSchema();
    const sql = sqlClient();
    const day = quotaDay();
    const rows = await sql`SELECT calls FROM optics_ai_budget WHERE quota_day = ${day}`;
    const used = Number(rows[0]?.calls ?? 0);
    const limit = aiDailyBudget();
    return { used, limit, remaining: Math.max(0, limit - used), quotaDay: day };
  } catch { return null; }
}
