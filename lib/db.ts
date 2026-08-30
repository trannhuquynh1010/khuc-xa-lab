import "server-only";

import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { activityDefinitions, type ActivityKey } from "@/lib/activities";
import type { ExperimentSubmission, OhmPayload, ResistanceFactorsPayload } from "@/lib/experiments";
import { getCurrentSchoolYear } from "@/lib/school-years";
import type { TeamAssignments } from "@/lib/team";

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
  updatedAt: string;
};

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
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE activity_settings
    ADD COLUMN IF NOT EXISTS construction_open BOOLEAN NOT NULL DEFAULT TRUE
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
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = initializeSchema().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export async function listActivitySettings(): Promise<ActivitySetting[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT activity_key, is_open, construction_open, updated_at
    FROM activity_settings
  `;
  const settings = new Map(rows.map((row) => [String(row.activity_key), row]));

  return activityDefinitions.map((activity) => {
    const row = settings.get(activity.key);
    return {
      key: activity.key,
      isOpen: Boolean(row?.is_open),
      constructionOpen: Boolean(row?.construction_open),
      updatedAt: row ? new Date(String(row.updated_at)).toISOString() : new Date(0).toISOString(),
    };
  });
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
}

export async function setRefractionConstructionOpen(isOpen: boolean) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE activity_settings
    SET construction_open = ${isOpen}, updated_at = NOW()
    WHERE activity_key = 'refraction'
  `;
}

export async function listSchoolYears() {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT school_year FROM submissions
    UNION
    SELECT school_year FROM experiment_submissions
  `;
  const years = new Set(rows.map((row) => String(row.school_year)));
  years.add(getCurrentSchoolYear());
  return [...years].sort((left, right) => right.localeCompare(left));
}

export async function resetSchoolYearData(schoolYear: string) {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM submissions WHERE school_year = ${schoolYear}`;
  await sql`DELETE FROM experiment_submissions WHERE school_year = ${schoolYear}`;
}

type NewExperimentInput =
  | { activityKey: "ohm"; className: string; groupName: string; payload: OhmPayload }
  | { activityKey: "resistance-factors"; className: string; groupName: string; payload: ResistanceFactorsPayload };

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

  return {
    id: String(rows[0].id),
    createdAt: new Date(String(rows[0].created_at)).toISOString(),
  };
}

export async function listExperimentSubmissions(key: "ohm", schoolYear?: string): Promise<ExperimentSubmission<OhmPayload>[]>;
export async function listExperimentSubmissions(key: "resistance-factors", schoolYear?: string): Promise<ExperimentSubmission<ResistanceFactorsPayload>[]>;
export async function listExperimentSubmissions(key: "ohm" | "resistance-factors", schoolYear = getCurrentSchoolYear()) {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT id, school_year, class_name, group_name, payload, created_at
    FROM experiment_submissions
    WHERE activity_key = ${key} AND school_year = ${schoolYear}
    ORDER BY created_at DESC
    LIMIT 200
  `;

  return rows.map((row) => ({
    id: String(row.id),
    schoolYear: String(row.school_year),
    className: String(row.class_name),
    groupName: String(row.group_name),
    payload: row.payload,
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
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

  return {
    id: String(rows[0].id),
    createdAt: new Date(String(rows[0].created_at)).toISOString(),
  };
}

export async function listSubmissions(schoolYear = getCurrentSchoolYear()): Promise<Submission[]> {
  await ensureSchema();
  const sql = getSql();

  const rows = await sql`
    SELECT
      s.id,
      s.school_year,
      s.class_name,
      s.group_name,
      s.team_assignments,
      s.incidence_medium,
      s.refraction_medium,
      s.conclusion_angles,
      s.conclusion_sines,
      s.created_at,
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
    LIMIT 200
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
}
