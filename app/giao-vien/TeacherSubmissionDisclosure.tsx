"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import type { ActivityKey } from "@/lib/activities";
import type { ExperimentSubmission, OhmPayload, PrismColorPayload, ResistanceFactorsPayload } from "@/lib/experiments";
import type { Submission } from "@/lib/db";

const RefractionResults = dynamic<{ submissions: Submission[] }>(() => import("./TeacherResults").then((module) => module.RefractionResults));
const OhmResults = dynamic<{ submissions: ExperimentSubmission<OhmPayload>[] }>(() => import("./TeacherResults").then((module) => module.OhmResults));
const ResistanceFactorsResults = dynamic<{ submissions: ExperimentSubmission<ResistanceFactorsPayload>[] }>(() => import("./TeacherResults").then((module) => module.ResistanceFactorsResults));
const PrismColorResults = dynamic<{ submissions: ExperimentSubmission<PrismColorPayload>[] }>(() => import("./TeacherResults").then((module) => module.PrismColorResults));

type TeacherSubmissionPayload =
  | { activity: "refraction"; submissions: Submission[] }
  | { activity: "ohm"; submissions: ExperimentSubmission<OhmPayload>[] }
  | { activity: "resistance-factors"; submissions: ExperimentSubmission<ResistanceFactorsPayload>[] }
  | { activity: "prism-colors"; submissions: ExperimentSubmission<PrismColorPayload>[] };

function SubmissionResults({ payload }: { payload: TeacherSubmissionPayload }) {
  if (payload.activity === "refraction") return <RefractionResults submissions={payload.submissions} />;
  if (payload.activity === "ohm") return <OhmResults submissions={payload.submissions} />;
  if (payload.activity === "prism-colors") return <PrismColorResults submissions={payload.submissions} />;
  return <ResistanceFactorsResults submissions={payload.submissions} />;
}

export default function TeacherSubmissionDisclosure({ activity, className, schoolYear, submittedCount }: {
  activity: ActivityKey;
  className: string;
  schoolYear: string;
  submittedCount: number;
}) {
  const [payload, setPayload] = useState<TeacherSubmissionPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);

  const loadSubmissions = useCallback(async () => {
    if (payload || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ activity, className, schoolYear });
      const response = await fetch(`/api/teacher-submissions?${params}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Submission request failed");
      const result = await response.json() as TeacherSubmissionPayload;
      if (result.activity !== activity || !Array.isArray(result.submissions)) throw new Error("Invalid submission response");
      setPayload(result);
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
        setError("Chưa tải được bài nộp. Hãy thử lại.");
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [activity, className, payload, schoolYear]);

  useEffect(() => () => requestRef.current?.abort(), []);

  function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    if (event.currentTarget.open) void loadSubmissions();
  }

  return (
    <details className="teacher-data-disclosure" onToggle={handleToggle}>
      <summary onPointerEnter={() => void loadSubmissions()} onFocus={() => void loadSubmissions()}>
        <span><small>BÀI NỘP</small><strong>{className} · {submittedCount} nhóm</strong></span><b>Mở / thu gọn</b>
      </summary>
      <div className="teacher-data-content" aria-live="polite">
        {loading ? <div className="teacher-results-loading"><span className="loading-dot" /> Đang tải bài nộp…</div> : null}
        {error ? <div className="teacher-results-error"><p>{error}</p><button type="button" className="secondary-button" onClick={() => void loadSubmissions()}>Thử lại</button></div> : null}
        {payload ? <SubmissionResults payload={payload} /> : null}
      </div>
    </details>
  );
}
