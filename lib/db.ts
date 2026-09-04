import "server-only";

import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { revalidateTag, unstable_cache } from "next/cache";
import { activityDefinitions, type ActivityKey } from "@/lib/activities";
import type { ExperimentSubmission, OhmPayload, PrismColorPayload, ResistanceFactorsPayload } from "@/lib/experiments";
import type { RefractionQuizAnswers } from "@/lib/refraction-quiz";
import { scoreRefractionQuiz, type RefractionQuizEvaluation } from "@/lib/refraction-quiz-score";
import { getCurrentSchoolYear } from "@/lib/school-years";
import type { TeamAssignments } from "@/lib/team";
import { formatStudentNumber } from "@/lib/classes";
import { emptyPracticeAnswers, scorePracticeAttempt } from "@/lib/practice-attempt-score";
import type { PracticeAttemptStatus, PracticeKey, TeacherPracticeAttempt } from "@/lib/practice-attempt-types";

export type Measurement = {
  sequence: number;
  incidenceAngle: number;
  refractionAngle: number;
  sinIncidence: number;
  sinRefraction: number;
};

export type Submission = {
  id: string;
  schoolYear: string;
  className: string;
  groupName: string;
  teamAssignments: TeamAssignments | null;
  incidenceMedium: string | null;
  refractionMedium: string | null;
  conclusionAngles: string | null;
  conclusionSines: string | null;
  createdAt: string;
  measurements: Measurement[];
};

export type ActivitySetting = {
  key: ActivityKey;
  isOpen: boolean;
  constructionOpen: boolean;
  applicationOpen: boolean;
  colorOpen: boolean;
  iuPracticeOpen: boolean;
  ohmLawPracticeOpen: boolean;
  resistivityOpen: boolean;
  resistanceFactorsPracticeOpen: boolean;
  updatedAt: string;
};

export type RefractionQuizSubmission = {
  id: string;
  schoolYear: string;
  className: string;
  studentName: string;
  studentNumber: number | null;
  bonusPoint: number;
  correctCount: number;
  totalItems: number;
  releasedAt: string | null;
  createdAt: string;
};

export type RefractionQuizClassSummary = {
  submittedCount: number;
  releasedCount: number;
};

export type RefractionQuizSubmissionStatus =
  | { submitted: false; released: false }
  | { submitted: true; released: false }
  | { submitted: true; released: true; bonusPoint: number; correctCount: number; totalItems: number };

export class DuplicateRefractionQuizSubmissionError extends Error {
  constructor() {
    super("This class roster number has already submitted the quiz.");
    this.name = "DuplicateRefractionQuizSubmissionError";
  }
}

const ACTIVITY_SETTINGS_CACHE_TAG = "activity-settings";
const SCHOOL_YEARS_CACHE_TAG = "school-years";
const TEACHER_PROGRESS_CACHE_TAG = "teacher-progress";
const REFRACTION_QUIZ_CACHE_TAG = "refraction-quiz-submissions";
const PRACTICE_ATTEMPTS_CACHE_TAG = "practice-attempts";

function expireCacheTag(tag: string) {
  revalidateTag(tag, { expire: 0 });
}

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  return neon(connectionString);
}

let schemaPromise: Promise<void> | null = null;

async function initializeSchema() {
  const sql = getSql();

  const schemaStatus = await sql`
    SELECT (
      to_regclass('public.submissions') IS NOT NULL AND
      to_regclass('public.measurements') IS NOT NULL AND
      to_regclass('public.activity_settings') IS NOT NULL AND
      to_regclass('public.experiment_submissions') IS NOT NULL AND
      to_regclass('public.refraction_quiz_submissions') IS NOT NULL AND
      to_regclass('public.practice_attempts') IS NOT NULL AND
      to_regclass('public.submissions_year_class_group_unique_idx') IS NOT NULL AND
      to_regclass('public.experiment_submissions_year_activity_class_group_unique_idx') IS NOT NULL AND
      to_regclass('public.refraction_quiz_year_class_number_unique_idx') IS NOT NULL AND
      to_regclass('public.submissions_school_year_class_created_idx') IS NOT NULL AND
      to_regclass('public.experiment_submissions_year_activity_class_created_idx') IS NOT NULL AND
      to_regclass('public.refraction_quiz_year_class_created_idx') IS NOT NULL AND
      to_regclass('public.practice_attempts_year_key_class_status_idx') IS NOT NULL AND
      to_regclass('public.practice_attempts_year_key_class_student_unique_idx') IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'activity_settings' AND column_name = 'construction_open'
      ) AND
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'activity_settings' AND column_name = 'application_open'
      ) AND
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'activity_settings' AND column_name = 'color_open'
      ) AND
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'activity_settings' AND column_name = 'iu_practice_open'
      ) AND
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'activity_settings' AND column_name = 'ohm_law_practice_open'
      ) AND
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'activity_settings' AND column_name = 'resistivity_open'
      ) AND
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'activity_settings' AND column_name = 'resistance_factors_practice_open'
      ) AND
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'refraction_quiz_submissions' AND column_name = 'student_number'
      ) AND
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'refraction_quiz_submissions' AND column_name = 'released_at'
      )
    ) AS ready
  `;

  if (Boolean(schemaStatus[0]?.ready)) {
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id UUID PRIMARY KEY,
      school_year VARCHAR(5) NOT NULL,
      class_name VARCHAR(30) NOT NULL,
      group_name VARCHAR(60) NOT NULL,
      team_assignments JSONB,
      incidence_medium VARCHAR(80),
      refraction_medium VARCHAR(80),
      conclusion_angles VARCHAR(600),
      conclusion_sines VARCHAR(600),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS school_year VARCHAR(5),
      ADD COLUMN IF NOT EXISTS team_assignments JSONB,
      ADD COLUMN IF NOT EXISTS incidence_medium VARCHAR(80),
      ADD COLUMN IF NOT EXISTS refraction_medium VARCHAR(80),
      ADD COLUMN IF NOT EXISTS conclusion_angles VARCHAR(600),
      ADD COLUMN IF NOT EXISTS conclusion_sines VARCHAR(600)
  `;

  await sql`UPDATE submissions SET school_year = '26-27' WHERE school_year IS NULL`;
  await sql`ALTER TABLE submissions ALTER COLUMN school_year SET NOT NULL`;

  await sql`
    CREATE TABLE IF NOT EXISTS measurements (
      id BIGSERIAL PRIMARY KEY,
      submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      sequence INTEGER NOT NULL,
      incidence_angle NUMERIC(7, 3) NOT NULL,
      refraction_angle NUMERIC(7, 3) NOT NULL,
      sin_incidence NUMERIC(9, 6) NOT NULL,
      sin_refraction NUMERIC(9, 6) NOT NULL,
      UNIQUE (submission_id, sequence)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS submissions_created_at_idx
    ON submissions (created_at DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS submissions_school_year_class_created_idx
    ON submissions (school_year, class_name, created_at DESC)
  `;

  await sql`
    DROP INDEX IF EXISTS submissions_class_group_unique_idx
  `;

  await sql`
    DELETE FROM submissions older
    USING submissions newer
    WHERE older.school_year = newer.school_year
      AND older.class_name = newer.class_name
      AND older.group_name = newer.group_name
      AND (
        older.created_at < newer.created_at OR
        (older.created_at = newer.created_at AND older.id::TEXT < newer.id::TEXT)
      )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS submissions_year_class_group_unique_idx
    ON submissions (school_year, class_name, group_name)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS activity_settings (
      activity_key VARCHAR(40) PRIMARY KEY,
      is_open BOOLEAN NOT NULL DEFAULT FALSE,
      construction_open BOOLEAN NOT NULL DEFAULT TRUE,
      application_open BOOLEAN NOT NULL DEFAULT FALSE,
      color_open BOOLEAN NOT NULL DEFAULT FALSE,
      iu_practice_open BOOLEAN NOT NULL DEFAULT FALSE,
      ohm_law_practice_open BOOLEAN NOT NULL DEFAULT FALSE,
      resistivity_open BOOLEAN NOT NULL DEFAULT FALSE,
      resistance_factors_practice_open BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE activity_settings
    ADD COLUMN IF NOT EXISTS construction_open BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS application_open BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS color_open BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS iu_practice_open BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ohm_law_practice_open BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS resistivity_open BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS resistance_factors_practice_open BOOLEAN NOT NULL DEFAULT FALSE
  `;

  for (const activity of activityDefinitions) {
    await sql`
      INSERT INTO activity_settings (activity_key, is_open)
      VALUES (${activity.key}, ${activity.key === "refraction"})
      ON CONFLICT (activity_key) DO NOTHING
    `;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS experiment_submissions (
      id UUID PRIMARY KEY,
      school_year VARCHAR(5) NOT NULL,
      activity_key VARCHAR(40) NOT NULL,
      class_name VARCHAR(30) NOT NULL,
      group_name VARCHAR(60) NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE experiment_submissions ADD COLUMN IF NOT EXISTS school_year VARCHAR(5)`;
  await sql`UPDATE experiment_submissions SET school_year = '26-27' WHERE school_year IS NULL`;
  await sql`ALTER TABLE experiment_submissions ALTER COLUMN school_year SET NOT NULL`;

  await sql`
    CREATE INDEX IF NOT EXISTS experiment_submissions_activity_created_idx
    ON experiment_submissions (activity_key, created_at DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS experiment_submissions_year_activity_class_created_idx
    ON experiment_submissions (school_year, activity_key, class_name, created_at DESC)
  `;

  await sql`
    DROP INDEX IF EXISTS experiment_submissions_activity_class_group_unique_idx
  `;

  await sql`
    DELETE FROM experiment_submissions older
    USING experiment_submissions newer
    WHERE older.school_year = newer.school_year
      AND older.activity_key = newer.activity_key
      AND older.class_name = newer.class_name
      AND older.group_name = newer.group_name
      AND (
        older.created_at < newer.created_at OR
        (older.created_at = newer.created_at AND older.id::TEXT < newer.id::TEXT)
      )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS experiment_submissions_year_activity_class_group_unique_idx
    ON experiment_submissions (school_year, activity_key, class_name, group_name)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS refraction_quiz_submissions (
      id UUID PRIMARY KEY,
      school_year VARCHAR(5) NOT NULL,
      class_name VARCHAR(30) NOT NULL,
      student_name VARCHAR(100) NOT NULL,
      student_key VARCHAR(120) NOT NULL,
      student_number SMALLINT,
      answers JSONB NOT NULL,
      score NUMERIC(4, 2) NOT NULL,
      correct_count INTEGER NOT NULL,
      total_items INTEGER NOT NULL,
      released_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE refraction_quiz_submissions
    ADD COLUMN IF NOT EXISTS student_number SMALLINT,
    ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ
  `;

  await sql`DROP INDEX IF EXISTS refraction_quiz_year_class_student_unique_idx`;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS refraction_quiz_year_class_number_unique_idx
    ON refraction_quiz_submissions (school_year, class_name, student_number)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS refraction_quiz_year_class_created_idx
    ON refraction_quiz_submissions (school_year, class_name, created_at DESC)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS practice_attempts (
      id UUID PRIMARY KEY,
      school_year VARCHAR(5) NOT NULL,
      practice_key VARCHAR(50) NOT NULL,
      class_name VARCHAR(30) NOT NULL,
      student_number SMALLINT NOT NULL,
      answers JSONB NOT NULL DEFAULT '{}'::jsonb,
      completed_count INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      total_items INTEGER NOT NULL,
      bonus_point INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(12) NOT NULL DEFAULT 'draft',
      forced BOOLEAN NOT NULL DEFAULT FALSE,
      released_at TIMESTAMPTZ,
      submitted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT practice_attempts_status_check CHECK (status IN ('draft', 'submitted'))
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS practice_attempts_year_key_class_student_unique_idx
    ON practice_attempts (school_year, practice_key, class_name, student_number)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS practice_attempts_year_key_class_status_idx
    ON practice_attempts (school_year, practice_key, class_name, status, updated_at DESC)
  `;
}

const ensureSchemaAcrossInstances = unstable_cache(async () => {
  await initializeSchema();
  return true;
}, ["physics-lab-schema-individual-practice-v3"], { revalidate: false });

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = ensureSchemaAcrossInstances().then(() => undefined).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

const getCachedActivitySettings = unstable_cache(async (): Promise<ActivitySetting[]> => {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT activity_key, is_open, construction_open, application_open, color_open, iu_practice_open, ohm_law_practice_open, resistivity_open, resistance_factors_practice_open, updated_at
    FROM activity_settings
  `;
  const settings = new Map(rows.map((row) => [String(row.activity_key), row]));

  return activityDefinitions.map((activity) => {
    const row = settings.get(activity.key);
    return {
      key: activity.key,
      isOpen: Boolean(row?.is_open),
      constructionOpen: Boolean(row?.construction_open),
      applicationOpen: Boolean(row?.application_open),
      colorOpen: Boolean(row?.color_open),
      iuPracticeOpen: Boolean(row?.iu_practice_open),
      ohmLawPracticeOpen: Boolean(row?.ohm_law_practice_open),
      resistivityOpen: Boolean(row?.resistivity_open),
      resistanceFactorsPracticeOpen: Boolean(row?.resistance_factors_practice_open),
      updatedAt: row ? new Date(String(row.updated_at)).toISOString() : new Date(0).toISOString(),
    };
  });
}, ["activity-settings-v1"], { tags: [ACTIVITY_SETTINGS_CACHE_TAG], revalidate: 3600 });

export async function listActivitySettings(): Promise<ActivitySetting[]> {
  return getCachedActivitySettings();
}

export async function isActivityOpen(key: ActivityKey) {
  const settings = await listActivitySettings();
  return settings.find((setting) => setting.key === key)?.isOpen ?? false;
}

export async function setActivityOpen(key: ActivityKey, isOpen: boolean) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO activity_settings (activity_key, is_open, updated_at)
    VALUES (${key}, ${isOpen}, NOW())
    ON CONFLICT (activity_key)
    DO UPDATE SET is_open = EXCLUDED.is_open, updated_at = NOW()
  `;
  expireCacheTag(ACTIVITY_SETTINGS_CACHE_TAG);
}

export async function setRefractionConstructionOpen(isOpen: boolean) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE activity_settings
    SET construction_open = ${isOpen}, updated_at = NOW()
    WHERE activity_key = 'refraction'
  `;
  expireCacheTag(ACTIVITY_SETTINGS_CACHE_TAG);
}

export async function setRefractionApplicationOpen(isOpen: boolean) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE activity_settings
    SET application_open = ${isOpen}, updated_at = NOW()
    WHERE activity_key = 'refraction'
  `;
  expireCacheTag(ACTIVITY_SETTINGS_CACHE_TAG);
}

export async function setPrismColorOpen(isOpen: boolean) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE activity_settings
    SET color_open = ${isOpen}, updated_at = NOW()
    WHERE activity_key = 'prism-colors'
  `;
  expireCacheTag(ACTIVITY_SETTINGS_CACHE_TAG);
}

export async function setCurrentVoltagePracticeOpen(isOpen: boolean) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE activity_settings
    SET iu_practice_open = ${isOpen}, updated_at = NOW()
    WHERE activity_key = 'ohm'
  `;
  expireCacheTag(ACTIVITY_SETTINGS_CACHE_TAG);
}

export async function setOhmsLawPracticeOpen(isOpen: boolean) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE activity_settings
    SET ohm_law_practice_open = ${isOpen}, updated_at = NOW()
    WHERE activity_key = 'ohm'
  `;
  expireCacheTag(ACTIVITY_SETTINGS_CACHE_TAG);
}

export async function setResistivityOpen(isOpen: boolean) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE activity_settings
    SET resistivity_open = ${isOpen}, updated_at = NOW()
    WHERE activity_key = 'resistance-factors'
  `;
  expireCacheTag(ACTIVITY_SETTINGS_CACHE_TAG);
}

export async function setResistanceFactorsPracticeOpen(isOpen: boolean) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE activity_settings
    SET resistance_factors_practice_open = ${isOpen}, updated_at = NOW()
    WHERE activity_key = 'resistance-factors'
  `;
  expireCacheTag(ACTIVITY_SETTINGS_CACHE_TAG);
}

const getCachedSchoolYears = unstable_cache(async () => {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT school_year FROM submissions
    UNION
    SELECT school_year FROM experiment_submissions
    UNION
    SELECT school_year FROM refraction_quiz_submissions
    UNION
    SELECT school_year FROM practice_attempts
  `;
  const years = new Set(rows.map((row) => String(row.school_year)));
  years.add(getCurrentSchoolYear());
  return [...years].sort((left, right) => right.localeCompare(left));
}, ["school-years-v2"], { tags: [SCHOOL_YEARS_CACHE_TAG], revalidate: 3600 });

export async function listSchoolYears() {
  return getCachedSchoolYears();
}

export async function resetSchoolYearData(schoolYear: string) {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM submissions WHERE school_year = ${schoolYear}`;
  await sql`DELETE FROM experiment_submissions WHERE school_year = ${schoolYear}`;
  await sql`DELETE FROM refraction_quiz_submissions WHERE school_year = ${schoolYear}`;
  await sql`DELETE FROM practice_attempts WHERE school_year = ${schoolYear}`;
  expireCacheTag(SCHOOL_YEARS_CACHE_TAG);
  expireCacheTag(TEACHER_PROGRESS_CACHE_TAG);
  expireCacheTag(REFRACTION_QUIZ_CACHE_TAG);
  expireCacheTag(PRACTICE_ATTEMPTS_CACHE_TAG);
}

export async function createRefractionQuizSubmission(input: {
  className: string;
  studentNumber: number;
  answers: RefractionQuizAnswers;
  evaluation: RefractionQuizEvaluation;
}) {
  await ensureSchema();
  const sql = getSql();
  const id = randomUUID();
  const schoolYear = getCurrentSchoolYear();
  const formattedStudentNumber = formatStudentNumber(input.studentNumber);
  const studentName = `STT ${formattedStudentNumber}`;
  const studentKey = `stt-${formattedStudentNumber}`;
  const rows = await sql`
    INSERT INTO refraction_quiz_submissions (
      id, school_year, class_name, student_name, student_key, student_number, answers, score, correct_count, total_items
    )
    VALUES (
      ${id}, ${schoolYear}, ${input.className}, ${studentName}, ${studentKey}, ${input.studentNumber}, ${JSON.stringify(input.answers)}::jsonb,
      ${input.evaluation.bonusPoint}, ${input.evaluation.correctCount}, ${input.evaluation.totalItems}
    )
    ON CONFLICT (school_year, class_name, student_number)
    DO NOTHING
    RETURNING id, created_at
  `;
  if (!rows[0]) throw new DuplicateRefractionQuizSubmissionError();
  expireCacheTag(REFRACTION_QUIZ_CACHE_TAG);
  return { id: String(rows[0].id), createdAt: new Date(String(rows[0].created_at)).toISOString() };
}

const getCachedRefractionQuizSubmissions = unstable_cache(async (schoolYear: string, className: string | undefined, limit: number): Promise<RefractionQuizSubmission[]> => {
  await ensureSchema();
  const sql = getSql();
  const rows = className
    ? await sql`
        SELECT id, school_year, class_name, student_name, student_number, answers, released_at, created_at
        FROM refraction_quiz_submissions
        WHERE school_year = ${schoolYear} AND class_name = ${className}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT id, school_year, class_name, student_name, student_number, answers, released_at, created_at
        FROM refraction_quiz_submissions
        WHERE school_year = ${schoolYear}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
  return rows.map((row) => {
    const evaluation = scoreRefractionQuiz(row.answers as RefractionQuizAnswers);
    return {
      id: String(row.id),
      schoolYear: String(row.school_year),
      className: String(row.class_name),
      studentName: String(row.student_name),
      studentNumber: row.student_number === null ? null : Number(row.student_number),
      bonusPoint: evaluation.bonusPoint,
      correctCount: evaluation.correctCount,
      totalItems: evaluation.totalItems,
      releasedAt: row.released_at === null ? null : new Date(String(row.released_at)).toISOString(),
      createdAt: new Date(String(row.created_at)).toISOString(),
    };
  });
}, ["refraction-quiz-submissions-v1"], { tags: [REFRACTION_QUIZ_CACHE_TAG], revalidate: 3600 });

export async function listRefractionQuizSubmissions(schoolYear = getCurrentSchoolYear(), className?: string, limit = 500): Promise<RefractionQuizSubmission[]> {
  return getCachedRefractionQuizSubmissions(schoolYear, className, limit);
}

const getCachedRefractionQuizSummaries = unstable_cache(async (schoolYear: string) => {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT
      class_name,
      COUNT(*) FILTER (WHERE student_number IS NOT NULL)::INTEGER AS submitted_count,
      COUNT(*) FILTER (WHERE student_number IS NOT NULL AND released_at IS NOT NULL)::INTEGER AS released_count
    FROM refraction_quiz_submissions
    WHERE school_year = ${schoolYear}
    GROUP BY class_name
  `;
  return rows.map((row) => ({
    className: String(row.class_name),
    submittedCount: Number(row.submitted_count ?? 0),
    releasedCount: Number(row.released_count ?? 0),
  }));
}, ["refraction-quiz-class-summaries-v1"], { tags: [REFRACTION_QUIZ_CACHE_TAG], revalidate: 3600 });

export async function getRefractionQuizClassSummary(schoolYear: string, className: string): Promise<RefractionQuizClassSummary> {
  const summary = (await getCachedRefractionQuizSummaries(schoolYear)).find((item) => item.className === className);
  return {
    submittedCount: summary?.submittedCount ?? 0,
    releasedCount: summary?.releasedCount ?? 0,
  };
}

export async function getRefractionQuizSubmissionStatus(
  className: string,
  studentNumber: number,
  schoolYear = getCurrentSchoolYear(),
): Promise<RefractionQuizSubmissionStatus> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT answers, released_at
    FROM refraction_quiz_submissions
    WHERE school_year = ${schoolYear}
      AND class_name = ${className}
      AND student_number = ${studentNumber}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return { submitted: false, released: false };
  if (row.released_at === null) return { submitted: true, released: false };
  const evaluation = scoreRefractionQuiz(row.answers as RefractionQuizAnswers);
  return {
    submitted: true,
    released: true,
    bonusPoint: evaluation.bonusPoint,
    correctCount: evaluation.correctCount,
    totalItems: evaluation.totalItems,
  };
}

export async function setRefractionQuizScoresReleased(schoolYear: string, className: string, released: boolean) {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    UPDATE refraction_quiz_submissions
    SET released_at = CASE
      WHEN ${released} THEN COALESCE(released_at, NOW())
      ELSE NULL
    END
    WHERE school_year = ${schoolYear}
      AND class_name = ${className}
      AND student_number IS NOT NULL
    RETURNING id
  `;
  expireCacheTag(REFRACTION_QUIZ_CACHE_TAG);
  return rows.length;
}

type PracticeAttemptInput = {
  practiceKey: PracticeKey;
  className: string;
  studentNumber: number;
  answers: unknown;
};

function rowToPracticeStatus(row: Record<string, unknown> | undefined): PracticeAttemptStatus {
  if (!row) return { submitted: false, forced: false, released: false, completedCount: 0, totalItems: 0 };
  const submitted = row.status === "submitted";
  const released = submitted && row.released_at !== null;
  return {
    submitted,
    forced: Boolean(row.forced),
    released,
    completedCount: Number(row.completed_count ?? 0),
    totalItems: Number(row.total_items ?? 0),
    ...(released ? {
      correctCount: Number(row.correct_count ?? 0),
      bonusPoint: Number(row.bonus_point ?? 0),
    } : {}),
  };
}

async function savePracticeAttempt(input: PracticeAttemptInput, submit: boolean) {
  await ensureSchema();
  const sql = getSql();
  const schoolYear = getCurrentSchoolYear();
  const evaluation = scorePracticeAttempt(input.practiceKey, input.answers);
  const id = randomUUID();
  const nextStatus = submit ? "submitted" : "draft";
  const rows = await sql`
    INSERT INTO practice_attempts (
      id, school_year, practice_key, class_name, student_number, answers,
      completed_count, correct_count, total_items, bonus_point, status, forced, submitted_at, updated_at
    )
    VALUES (
      ${id}, ${schoolYear}, ${input.practiceKey}, ${input.className}, ${input.studentNumber}, ${JSON.stringify(input.answers)}::jsonb,
      ${evaluation.completedCount}, ${evaluation.correctCount}, ${evaluation.totalItems}, ${evaluation.bonusPoint}, ${nextStatus}, FALSE,
      ${submit ? new Date().toISOString() : null}, NOW()
    )
    ON CONFLICT (school_year, practice_key, class_name, student_number)
    DO UPDATE SET
      answers = EXCLUDED.answers,
      completed_count = EXCLUDED.completed_count,
      correct_count = EXCLUDED.correct_count,
      total_items = EXCLUDED.total_items,
      bonus_point = EXCLUDED.bonus_point,
      status = EXCLUDED.status,
      submitted_at = CASE WHEN EXCLUDED.status = 'submitted' THEN NOW() ELSE practice_attempts.submitted_at END,
      updated_at = NOW()
    WHERE practice_attempts.status = 'draft'
    RETURNING status, forced, released_at, completed_count, correct_count, total_items, bonus_point
  `;
  const row = rows[0] ?? (await sql`
    SELECT status, forced, released_at, completed_count, correct_count, total_items, bonus_point
    FROM practice_attempts
    WHERE school_year = ${schoolYear} AND practice_key = ${input.practiceKey}
      AND class_name = ${input.className} AND student_number = ${input.studentNumber}
    LIMIT 1
  `)[0];
  if (submit) expireCacheTag(PRACTICE_ATTEMPTS_CACHE_TAG);
  return rowToPracticeStatus(row as Record<string, unknown> | undefined);
}

export async function savePracticeDraft(input: PracticeAttemptInput) {
  return savePracticeAttempt(input, false);
}

export async function submitPracticeAttempt(input: PracticeAttemptInput) {
  return savePracticeAttempt(input, true);
}

export async function getPracticeAttemptStatus(practiceKey: PracticeKey, className: string, studentNumber: number, schoolYear = getCurrentSchoolYear()) {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT status, forced, released_at, completed_count, correct_count, total_items, bonus_point
    FROM practice_attempts
    WHERE school_year = ${schoolYear} AND practice_key = ${practiceKey}
      AND class_name = ${className} AND student_number = ${studentNumber}
    LIMIT 1
  `;
  return rowToPracticeStatus(rows[0] as Record<string, unknown> | undefined);
}

const getCachedPracticeAttempts = unstable_cache(async (schoolYear: string, practiceKey: PracticeKey, className: string): Promise<TeacherPracticeAttempt[]> => {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT id, class_name, student_number, completed_count, correct_count, total_items, bonus_point,
      forced, released_at, submitted_at
    FROM practice_attempts
    WHERE school_year = ${schoolYear} AND practice_key = ${practiceKey}
      AND class_name = ${className} AND status = 'submitted'
    ORDER BY student_number ASC
  `;
  return rows.map((row) => ({
    id: String(row.id),
    className: String(row.class_name),
    studentNumber: Number(row.student_number),
    completedCount: Number(row.completed_count),
    correctCount: Number(row.correct_count),
    totalItems: Number(row.total_items),
    bonusPoint: Number(row.bonus_point),
    forced: Boolean(row.forced),
    releasedAt: row.released_at === null ? null : new Date(String(row.released_at)).toISOString(),
    submittedAt: row.submitted_at === null ? null : new Date(String(row.submitted_at)).toISOString(),
  }));
}, ["practice-attempts-v1"], { tags: [PRACTICE_ATTEMPTS_CACHE_TAG], revalidate: 3600 });

export async function listPracticeAttempts(schoolYear: string, practiceKey: PracticeKey, className: string) {
  return getCachedPracticeAttempts(schoolYear, practiceKey, className);
}

export async function getPracticeAttemptSummary(schoolYear: string, practiceKey: PracticeKey, className: string) {
  const attempts = await listPracticeAttempts(schoolYear, practiceKey, className);
  return {
    submittedCount: attempts.length,
    releasedCount: attempts.filter((attempt) => attempt.releasedAt !== null).length,
    forcedCount: attempts.filter((attempt) => attempt.forced).length,
  };
}

export async function forceSubmitPracticeClass(schoolYear: string, practiceKey: PracticeKey, className: string) {
  await ensureSchema();
  const sql = getSql();
  if (practiceKey === "refraction-application") {
    await sql`
      INSERT INTO practice_attempts (
        id, school_year, practice_key, class_name, student_number, answers,
        completed_count, correct_count, total_items, bonus_point, status, forced,
        released_at, submitted_at, created_at, updated_at
      )
      SELECT id, school_year, ${practiceKey}, class_name, student_number, answers,
        total_items, correct_count, total_items, score, 'submitted', FALSE,
        released_at, created_at, created_at, NOW()
      FROM refraction_quiz_submissions
      WHERE school_year = ${schoolYear} AND class_name = ${className} AND student_number IS NOT NULL
      ON CONFLICT (school_year, practice_key, class_name, student_number) DO NOTHING
    `;
  }
  await sql`
    UPDATE practice_attempts
    SET status = 'submitted', forced = TRUE, submitted_at = NOW(), updated_at = NOW()
    WHERE school_year = ${schoolYear} AND practice_key = ${practiceKey}
      AND class_name = ${className} AND status = 'draft'
  `;

  const emptyAnswers = emptyPracticeAnswers(practiceKey);
  const evaluation = scorePracticeAttempt(practiceKey, emptyAnswers);
  const placeholders = Array.from({ length: 33 }, (_, index) => ({
    id: randomUUID(),
    student_number: index + 1,
    answers: emptyAnswers,
  }));
  await sql`
    INSERT INTO practice_attempts (
      id, school_year, practice_key, class_name, student_number, answers,
      completed_count, correct_count, total_items, bonus_point, status, forced, submitted_at, updated_at
    )
    SELECT
      item.id::uuid, ${schoolYear}, ${practiceKey}, ${className}, item.student_number, item.answers,
      ${evaluation.completedCount}, ${evaluation.correctCount}, ${evaluation.totalItems}, ${evaluation.bonusPoint},
      'submitted', TRUE, NOW(), NOW()
    FROM jsonb_to_recordset(${JSON.stringify(placeholders)}::jsonb) AS item(id TEXT, student_number SMALLINT, answers JSONB)
    ON CONFLICT (school_year, practice_key, class_name, student_number) DO NOTHING
  `;

  if (practiceKey === "refraction-application") {
    const attempts = await sql`
      SELECT student_number, answers, correct_count, total_items, bonus_point
      FROM practice_attempts
      WHERE school_year = ${schoolYear} AND practice_key = ${practiceKey}
        AND class_name = ${className} AND status = 'submitted'
    `;
    const quizRows = attempts.map((row) => {
      const studentNumber = Number(row.student_number);
      const formatted = formatStudentNumber(studentNumber);
      return {
        id: randomUUID(),
        student_number: studentNumber,
        student_name: `STT ${formatted}`,
        student_key: `stt-${formatted}`,
        answers: row.answers,
        score: Number(row.bonus_point),
        correct_count: Number(row.correct_count),
        total_items: Number(row.total_items),
      };
    });
    await sql`
      INSERT INTO refraction_quiz_submissions (
        id, school_year, class_name, student_name, student_key, student_number,
        answers, score, correct_count, total_items, created_at
      )
      SELECT item.id::uuid, ${schoolYear}, ${className}, item.student_name, item.student_key,
        item.student_number, item.answers, item.score, item.correct_count, item.total_items, NOW()
      FROM jsonb_to_recordset(${JSON.stringify(quizRows)}::jsonb) AS item(
        id TEXT, student_name TEXT, student_key TEXT, student_number SMALLINT,
        answers JSONB, score NUMERIC, correct_count INTEGER, total_items INTEGER
      )
      ON CONFLICT (school_year, class_name, student_number) DO NOTHING
    `;
    expireCacheTag(REFRACTION_QUIZ_CACHE_TAG);
  }

  expireCacheTag(PRACTICE_ATTEMPTS_CACHE_TAG);
  return 33;
}

export async function setPracticeScoresReleased(schoolYear: string, practiceKey: PracticeKey, className: string, released: boolean) {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    UPDATE practice_attempts
    SET released_at = CASE WHEN ${released} THEN COALESCE(released_at, NOW()) ELSE NULL END,
      updated_at = NOW()
    WHERE school_year = ${schoolYear} AND practice_key = ${practiceKey}
      AND class_name = ${className} AND status = 'submitted'
    RETURNING id
  `;
  expireCacheTag(PRACTICE_ATTEMPTS_CACHE_TAG);
  return rows.length;
}

type NewExperimentInput =
  | { activityKey: "ohm"; className: string; groupName: string; payload: OhmPayload }
  | { activityKey: "resistance-factors"; className: string; groupName: string; payload: ResistanceFactorsPayload }
  | { activityKey: "prism-colors"; className: string; groupName: string; payload: PrismColorPayload };

export async function createExperimentSubmission(input: NewExperimentInput) {
  await ensureSchema();
  const sql = getSql();
  const id = randomUUID();
  const schoolYear = getCurrentSchoolYear();

  const rows = await sql`
    INSERT INTO experiment_submissions (id, school_year, activity_key, class_name, group_name, payload)
    VALUES (${id}, ${schoolYear}, ${input.activityKey}, ${input.className}, ${input.groupName}, ${JSON.stringify(input.payload)}::jsonb)
    ON CONFLICT (school_year, activity_key, class_name, group_name)
    DO UPDATE SET payload = EXCLUDED.payload, created_at = NOW()
    RETURNING id, created_at
  `;

  expireCacheTag(TEACHER_PROGRESS_CACHE_TAG);

  return {
    id: String(rows[0].id),
    createdAt: new Date(String(rows[0].created_at)).toISOString(),
  };
}

export async function listExperimentSubmissions(key: "ohm", schoolYear?: string, className?: string, limit?: number): Promise<ExperimentSubmission<OhmPayload>[]>;
export async function listExperimentSubmissions(key: "resistance-factors", schoolYear?: string, className?: string, limit?: number): Promise<ExperimentSubmission<ResistanceFactorsPayload>[]>;
export async function listExperimentSubmissions(key: "prism-colors", schoolYear?: string, className?: string, limit?: number): Promise<ExperimentSubmission<PrismColorPayload>[]>;
export async function listExperimentSubmissions(key: "ohm" | "resistance-factors" | "prism-colors", schoolYear = getCurrentSchoolYear(), className?: string, limit = 200) {
  return getCachedExperimentSubmissions(key, schoolYear, className, limit);
}

const getCachedExperimentSubmissions = unstable_cache(async (key: "ohm" | "resistance-factors" | "prism-colors", schoolYear: string, className: string | undefined, limit: number) => {
  await ensureSchema();
  const sql = getSql();
  const rows = className
    ? await sql`
        SELECT id, school_year, class_name, group_name, payload, created_at
        FROM experiment_submissions
        WHERE activity_key = ${key} AND school_year = ${schoolYear} AND class_name = ${className}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT id, school_year, class_name, group_name, payload, created_at
        FROM experiment_submissions
        WHERE activity_key = ${key} AND school_year = ${schoolYear}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

  return rows.map((row) => ({
    id: String(row.id),
    schoolYear: String(row.school_year),
    className: String(row.class_name),
    groupName: String(row.group_name),
    payload: row.payload,
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
}, ["teacher-experiment-submissions-v1"], { tags: [TEACHER_PROGRESS_CACHE_TAG], revalidate: 3600 });

const getCachedSubmittedGroupsByClass = unstable_cache(async (key: ActivityKey, schoolYear: string) => {
  await ensureSchema();
  const sql = getSql();
  const rows = key === "refraction"
    ? await sql`
        SELECT class_name, group_name
        FROM submissions
        WHERE school_year = ${schoolYear}
        ORDER BY created_at DESC
      `
    : await sql`
        SELECT class_name, group_name
        FROM experiment_submissions
        WHERE activity_key = ${key} AND school_year = ${schoolYear}
        ORDER BY created_at DESC
      `;
  return rows.map((row) => ({ className: String(row.class_name), groupName: String(row.group_name) }));
}, ["teacher-submitted-groups-by-class-v1"], { tags: [TEACHER_PROGRESS_CACHE_TAG], revalidate: 3600 });

export async function listSubmittedGroups(key: ActivityKey, schoolYear: string, className: string) {
  return (await getCachedSubmittedGroupsByClass(key, schoolYear))
    .filter((submission) => submission.className === className)
    .map((submission) => submission.groupName);
}

export async function createSubmission(input: {
  className: string;
  groupName: string;
  teamAssignments: TeamAssignments;
  incidenceMedium: string;
  refractionMedium: string;
  conclusionAngles: string;
  conclusionSines: string;
  measurements: Measurement[];
}) {
  await ensureSchema();
  const sql = getSql();
  const id = randomUUID();
  const schoolYear = getCurrentSchoolYear();
  const measurementJson = JSON.stringify(
    input.measurements.map((item) => ({
      sequence: item.sequence,
      incidence_angle: item.incidenceAngle,
      refraction_angle: item.refractionAngle,
      sin_incidence: item.sinIncidence,
      sin_refraction: item.sinRefraction,
    })),
  );

  const rows = await sql`
    WITH target_submission AS (
      INSERT INTO submissions (
        id,
        school_year,
        class_name,
        group_name,
        team_assignments,
        incidence_medium,
        refraction_medium,
        conclusion_angles,
        conclusion_sines
      )
      VALUES (
        ${id},
        ${schoolYear},
        ${input.className},
        ${input.groupName},
        ${JSON.stringify(input.teamAssignments)}::jsonb,
        ${input.incidenceMedium},
        ${input.refractionMedium},
        ${input.conclusionAngles},
        ${input.conclusionSines}
      )
      ON CONFLICT (school_year, class_name, group_name)
      DO UPDATE SET
        incidence_medium = EXCLUDED.incidence_medium,
        team_assignments = EXCLUDED.team_assignments,
        refraction_medium = EXCLUDED.refraction_medium,
        conclusion_angles = EXCLUDED.conclusion_angles,
        conclusion_sines = EXCLUDED.conclusion_sines,
        created_at = NOW()
      RETURNING id, created_at
    ), upserted_measurements AS (
      INSERT INTO measurements (
        submission_id,
        sequence,
        incidence_angle,
        refraction_angle,
        sin_incidence,
        sin_refraction
      )
      SELECT
        target_submission.id,
        item.sequence,
        item.incidence_angle,
        item.refraction_angle,
        item.sin_incidence,
        item.sin_refraction
      FROM target_submission
      CROSS JOIN jsonb_to_recordset(${measurementJson}::jsonb) AS item(
        sequence INTEGER,
        incidence_angle NUMERIC,
        refraction_angle NUMERIC,
        sin_incidence NUMERIC,
        sin_refraction NUMERIC
      )
      ON CONFLICT (submission_id, sequence)
      DO UPDATE SET
        incidence_angle = EXCLUDED.incidence_angle,
        refraction_angle = EXCLUDED.refraction_angle,
        sin_incidence = EXCLUDED.sin_incidence,
        sin_refraction = EXCLUDED.sin_refraction
      RETURNING id
    )
    SELECT id, created_at FROM target_submission
  `;

  await sql`
    DELETE FROM measurements
    WHERE submission_id = ${String(rows[0].id)}::uuid
      AND sequence NOT IN (
        SELECT item.sequence
        FROM jsonb_to_recordset(${measurementJson}::jsonb) AS item(sequence INTEGER)
      )
  `;

  expireCacheTag(TEACHER_PROGRESS_CACHE_TAG);

  return {
    id: String(rows[0].id),
    createdAt: new Date(String(rows[0].created_at)).toISOString(),
  };
}

const getCachedSubmissions = unstable_cache(async (schoolYear: string, className: string | undefined, limit: number): Promise<Submission[]> => {
  await ensureSchema();
  const sql = getSql();

  const rows = className
    ? await sql`
        SELECT
          s.id, s.school_year, s.class_name, s.group_name, s.team_assignments,
          s.incidence_medium, s.refraction_medium, s.conclusion_angles, s.conclusion_sines, s.created_at,
          COALESCE(
            json_agg(
              json_build_object(
                'sequence', m.sequence,
                'incidenceAngle', m.incidence_angle::FLOAT8,
                'refractionAngle', m.refraction_angle::FLOAT8,
                'sinIncidence', m.sin_incidence::FLOAT8,
                'sinRefraction', m.sin_refraction::FLOAT8
              ) ORDER BY m.sequence
            ) FILTER (WHERE m.id IS NOT NULL),
            '[]'::json
          ) AS measurements
        FROM submissions s
        LEFT JOIN measurements m ON m.submission_id = s.id
        WHERE s.school_year = ${schoolYear} AND s.class_name = ${className}
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT
          s.id, s.school_year, s.class_name, s.group_name, s.team_assignments,
          s.incidence_medium, s.refraction_medium, s.conclusion_angles, s.conclusion_sines, s.created_at,
          COALESCE(
            json_agg(
              json_build_object(
                'sequence', m.sequence,
                'incidenceAngle', m.incidence_angle::FLOAT8,
                'refractionAngle', m.refraction_angle::FLOAT8,
                'sinIncidence', m.sin_incidence::FLOAT8,
                'sinRefraction', m.sin_refraction::FLOAT8
              ) ORDER BY m.sequence
            ) FILTER (WHERE m.id IS NOT NULL),
            '[]'::json
          ) AS measurements
        FROM submissions s
        LEFT JOIN measurements m ON m.submission_id = s.id
        WHERE s.school_year = ${schoolYear}
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT ${limit}
      `;

  return rows.map((row) => ({
    id: String(row.id),
    schoolYear: String(row.school_year),
    className: String(row.class_name),
    groupName: String(row.group_name),
    teamAssignments: row.team_assignments ? row.team_assignments as TeamAssignments : null,
    incidenceMedium: row.incidence_medium ? String(row.incidence_medium) : null,
    refractionMedium: row.refraction_medium ? String(row.refraction_medium) : null,
    conclusionAngles: row.conclusion_angles ? String(row.conclusion_angles) : null,
    conclusionSines: row.conclusion_sines ? String(row.conclusion_sines) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    measurements: row.measurements as Measurement[],
  }));
}, ["teacher-refraction-submissions-v1"], { tags: [TEACHER_PROGRESS_CACHE_TAG], revalidate: 3600 });

export async function listSubmissions(schoolYear = getCurrentSchoolYear(), className?: string, limit = 200): Promise<Submission[]> {
  return getCachedSubmissions(schoolYear, className, limit);
}
