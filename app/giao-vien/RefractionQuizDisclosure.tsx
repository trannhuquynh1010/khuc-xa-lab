"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatStudentNumber, studentNumbers } from "@/lib/classes";
import type { RefractionQuizSubmission } from "@/lib/db";
import RefractionQuizResultTable from "./RefractionQuizResultTable";

export default function RefractionQuizDisclosure({ submittedCount, className, schoolYear }: { submittedCount: number; className: string; schoolYear: string }) {
  const [expanded, setExpanded] = useState(false);
  const [submissions, setSubmissions] = useState<RefractionQuizSubmission[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  function loadSubmissions() {
    if (submissions || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ className, schoolYear });
    void fetch(`/api/teacher-quiz-submissions?${params}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Quiz submission request failed");
        const result = await response.json() as { submissions?: RefractionQuizSubmission[] };
        if (!Array.isArray(result.submissions)) throw new Error("Invalid quiz submission response");
        setSubmissions(result.submissions);
      })
      .catch((requestError) => {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) setError("Chưa tải được dữ liệu. Hãy thử lại.");
      })
      .finally(() => {
        if (requestRef.current === controller) requestRef.current = null;
        if (!controller.signal.aborted) setLoading(false);
      });
  }

  useEffect(() => () => requestRef.current?.abort(), []);
  const submissionsByNumber = useMemo(() => new Map(submissions
    ?.filter((submission) => submission.studentNumber !== null)
    .map((submission) => [submission.studentNumber!, submission]) ?? []), [submissions]);
  const rosterSubmissions = useMemo(() => studentNumbers
    .map((number) => submissionsByNumber.get(number))
    .filter((submission): submission is RefractionQuizSubmission => Boolean(submission)), [submissionsByNumber]);
  const bonusCount = rosterSubmissions.filter((submission) => submission.bonusPoint > 0).length;

  return (
    <div className="quiz-data-disclosure">
      <button className="quiz-data-toggle" type="button" aria-expanded={expanded} onPointerEnter={() => void loadSubmissions()} onFocus={() => void loadSubmissions()} onClick={() => { const nextExpanded = !expanded; setExpanded(nextExpanded); if (nextExpanded) void loadSubmissions(); }}>
        <span><strong>Dữ liệu học sinh</strong><small>{submittedCount}/33 đã nộp{submissions ? ` · ${bonusCount} có điểm cộng` : ""}</small></span>
        <b>{expanded ? "Thu gọn ↑" : "Xem dữ liệu ↓"}</b>
      </button>
      {expanded && (
        <div className="quiz-data-content">
          {loading ? <div className="teacher-results-loading"><span className="loading-dot" /> Đang tải dữ liệu…</div> : null}
          {error ? <div className="teacher-results-error"><p>{error}</p><button type="button" className="secondary-button" onClick={() => void loadSubmissions()}>Thử lại</button></div> : null}
          {submissions ? <>
          <div className="student-progress-grid" aria-label={`Tiến độ nộp bài cá nhân lớp ${className}`}>
            {studentNumbers.map((number) => {
              const submission = submissionsByNumber.get(number);
              return <div key={number} className={`student-progress-item ${submission ? "submitted" : "pending"}`}><strong>{formatStudentNumber(number)}</strong><span>{submission ? submission.bonusPoint ? `+${submission.bonusPoint} điểm` : "✓ Đã nộp" : "Chưa nộp"}</span></div>;
            })}
          </div>
          {rosterSubmissions.length > 0 ? <RefractionQuizResultTable submissions={rosterSubmissions} /> : <div className="quiz-filter-empty">Chưa có học sinh nộp bài.</div>}
          </> : null}
        </div>
      )}
    </div>
  );
}
