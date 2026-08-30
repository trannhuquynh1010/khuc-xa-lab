import "server-only";

import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

export type Measurement = {
  sequence: number;
  incidenceAngle: number;
  refractionAngle: number;
  sinIncidence: number;
  sinRefraction: number;
};

export type Submission = {
  id: string;
  className: string;
  groupName: string;
  incidenceMedium: string | null;
  refractionMedium: string | null;
  createdAt: string;
  measurements: Measurement[];
};

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  return neon(connectionString);
}

export async function ensureSchema() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id UUID PRIMARY KEY,
      class_name VARCHAR(30) NOT NULL,
      group_name VARCHAR(60) NOT NULL,
      incidence_medium VARCHAR(80),
      refraction_medium VARCHAR(80),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE submissions
      ADD COLUMN IF NOT EXISTS incidence_medium VARCHAR(80),
      ADD COLUMN IF NOT EXISTS refraction_medium VARCHAR(80)
  `;

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
}

export async function createSubmission(input: {
  className: string;
  groupName: string;
  incidenceMedium: string;
  refractionMedium: string;
  measurements: Measurement[];
}) {
  await ensureSchema();
  const sql = getSql();
  const id = randomUUID();
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
    WITH new_submission AS (
      INSERT INTO submissions (id, class_name, group_name, incidence_medium, refraction_medium)
      VALUES (${id}, ${input.className}, ${input.groupName}, ${input.incidenceMedium}, ${input.refractionMedium})
      RETURNING id, created_at
    ), new_measurements AS (
      INSERT INTO measurements (
        submission_id,
        sequence,
        incidence_angle,
        refraction_angle,
        sin_incidence,
        sin_refraction
      )
      SELECT
        new_submission.id,
        item.sequence,
        item.incidence_angle,
        item.refraction_angle,
        item.sin_incidence,
        item.sin_refraction
      FROM new_submission
      CROSS JOIN jsonb_to_recordset(${measurementJson}::jsonb) AS item(
        sequence INTEGER,
        incidence_angle NUMERIC,
        refraction_angle NUMERIC,
        sin_incidence NUMERIC,
        sin_refraction NUMERIC
      )
      RETURNING id
    )
    SELECT id, created_at FROM new_submission
  `;

  return {
    id: String(rows[0].id),
    createdAt: new Date(String(rows[0].created_at)).toISOString(),
  };
}

export async function listSubmissions(): Promise<Submission[]> {
  await ensureSchema();
  const sql = getSql();

  const rows = await sql`
    SELECT
      s.id,
      s.class_name,
      s.group_name,
      s.incidence_medium,
      s.refraction_medium,
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
    GROUP BY s.id
    ORDER BY s.created_at DESC
    LIMIT 200
  `;

  return rows.map((row) => ({
    id: String(row.id),
    className: String(row.class_name),
    groupName: String(row.group_name),
    incidenceMedium: row.incidence_medium ? String(row.incidence_medium) : null,
    refractionMedium: row.refraction_medium ? String(row.refraction_medium) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    measurements: row.measurements as Measurement[],
  }));
}
