import "server-only";
import { neon } from "@neondatabase/serverless";
import { createHash, randomUUID } from "node:crypto";
import { createLessonState, forceCompleteAiState, type AiState } from "./optics-ai-engine";
import { aiLessons, type AiLessonConfig } from "./ai-lessons";

function sqlClient() { if (!process.env.DATABASE_URL) throw new Error("database_not_configured"); return neon(process.env.DATABASE_URL); }
export function aiTokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
let schema: Promise<void> | undefined;
async function ensureAiSchema() {
  // Additive only; deliberately does not call the legacy schema/grade migrations.
  schema ??= (async () => {
    const sql = sqlClient();
    await sql`CREATE TABLE IF NOT EXISTS optics_ai_sessions (
      id UUID PRIMARY KEY, school_year VARCHAR(5) NOT NULL, class_name VARCHAR(8) NOT NULL,
      student_number INTEGER NOT NULL CHECK (student_number BETWEEN 1 AND 33),
      lesson_version VARCHAR(40) NOT NULL, token_hash TEXT NOT NULL, state JSONB NOT NULL,
      revision INTEGER NOT NULL DEFAULT 0, lock_id UUID, lock_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (school_year, class_name, student_number, lesson_version)
    )`;
  })().catch(error => { schema = undefined; throw error; });
  await schema;
}
/** Every lesson shares the table; `lesson_version` separates them. */
export async function isAiLessonOpen(lesson: AiLessonConfig) {
  const sql = sqlClient();
  const rows = await sql`SELECT is_open FROM activity_settings WHERE activity_key = ${lesson.activityKey}`;
  return Boolean(rows[0]?.is_open);
}
export async function isOpticsAiOpen() { return isAiLessonOpen(aiLessons.optics); }
export async function startAiSession(lesson: AiLessonConfig, schoolYear: string, className: string, studentNumber: number, token: string): Promise<AiState> {
  await ensureAiSchema(); const sql = sqlClient(); const id = randomUUID(); const state = createLessonState(lesson, id); const hash = aiTokenHash(token);
  const rows = await sql`INSERT INTO optics_ai_sessions (id, school_year, class_name, student_number, lesson_version, token_hash, state)
    VALUES (${id}, ${schoolYear}, ${className}, ${studentNumber}, ${lesson.version}, ${hash}, ${JSON.stringify(state)}::jsonb)
    ON CONFLICT (school_year, class_name, student_number, lesson_version) DO NOTHING RETURNING state`;
  if (rows.length) return rows[0].state as AiState;
  const existing = await sql`SELECT state FROM optics_ai_sessions WHERE school_year=${schoolYear} AND class_name=${className} AND student_number=${studentNumber} AND lesson_version=${lesson.version} AND token_hash=${hash}`;
  if (existing.length) return existing[0].state as AiState;
  throw new Error("identity_in_use");
}
export async function readAiSession(id: string, token: string): Promise<AiState | null> {
  await ensureAiSchema(); const sql = sqlClient();
  const rows = await sql`SELECT state FROM optics_ai_sessions WHERE id=${id} AND token_hash=${aiTokenHash(token)}`;
  return rows[0]?.state as AiState ?? null;
}
export async function claimAiSession(id: string, token: string, version: number) {
  await ensureAiSchema(); const sql = sqlClient(); const lockId = randomUUID();
  const rows = await sql`UPDATE optics_ai_sessions SET lock_id=${lockId}, lock_until=NOW()+INTERVAL '45 seconds'
    WHERE id=${id} AND token_hash=${aiTokenHash(token)} AND revision=${version}
      AND (lock_until IS NULL OR lock_until < NOW()) RETURNING state`;
  return rows.length ? { lockId, state: rows[0].state as AiState } : null;
}
export async function commitAiSession(state: AiState, lockId: string, previousVersion: number) {
  const sql = sqlClient();
  const rows = await sql`UPDATE optics_ai_sessions SET state=${JSON.stringify(state)}::jsonb, revision=${state.version}, lock_id=NULL, lock_until=NULL, updated_at=NOW()
    WHERE id=${state.id} AND lock_id=${lockId} AND revision=${previousVersion} RETURNING id`;
  if (!rows.length) throw new Error("stale_version");
}
export async function releaseAiSession(id: string, lockId: string) { const sql = sqlClient(); await sql`UPDATE optics_ai_sessions SET lock_id=NULL, lock_until=NULL WHERE id=${id} AND lock_id=${lockId}`; }
export async function listAiSessions(year: string, className: string, lessonVersion?: string) {
  await ensureAiSchema(); const sql = sqlClient();
  const rows = lessonVersion
    ? await sql`SELECT id, student_number, lesson_version, state, created_at, updated_at FROM optics_ai_sessions WHERE school_year=${year} AND class_name=${className} AND lesson_version=${lessonVersion} ORDER BY student_number, created_at`
    : await sql`SELECT id, student_number, lesson_version, state, created_at, updated_at FROM optics_ai_sessions WHERE school_year=${year} AND class_name=${className} ORDER BY student_number, created_at`;
  return rows.map(row => ({ id: String(row.id), studentNumber: Number(row.student_number), lessonVersion: String(row.lesson_version), state: row.state as AiState, createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString() }));
}
/**
 * Ends the lesson for a whole class at once, so the teacher can stop the period
 * on time. Deliberately clears any student lock: the teacher's decision wins.
 * Each row is written on its own, so one failure cannot leave half a class in a
 * state nobody asked for.
 */
export async function forceSubmitAiClass(lesson: AiLessonConfig, year: string, className: string) {
  await ensureAiSchema(); const sql = sqlClient();
  const rows = await sql`SELECT state FROM optics_ai_sessions
    WHERE school_year=${year} AND class_name=${className} AND lesson_version=${lesson.version}`;
  let stopped = 0;
  for (const row of rows) {
    const state = row.state as AiState;
    if (state.phase === "complete") continue;
    const next = forceCompleteAiState(state);
    await sql`UPDATE optics_ai_sessions SET state=${JSON.stringify(next)}::jsonb, revision=${next.version},
      lock_id=NULL, lock_until=NULL, updated_at=NOW() WHERE id=${next.id}`;
    stopped++;
  }
  return { stopped, sessions: rows.length };
}
/** Every session of one lesson across all classes, for the analytics view. */
export async function listAiSessionsForYear(year: string, lessonVersion?: string) {
  await ensureAiSchema(); const sql = sqlClient();
  const rows = lessonVersion
    ? await sql`SELECT id, class_name, student_number, lesson_version, state, created_at, updated_at FROM optics_ai_sessions WHERE school_year=${year} AND lesson_version=${lessonVersion} ORDER BY class_name, student_number, created_at`
    : await sql`SELECT id, class_name, student_number, lesson_version, state, created_at, updated_at FROM optics_ai_sessions WHERE school_year=${year} ORDER BY class_name, student_number, created_at`;
  return rows.map(row => ({ id: String(row.id), className: String(row.class_name), studentNumber: Number(row.student_number), lessonVersion: String(row.lesson_version), state: row.state as AiState, createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString() }));
}
