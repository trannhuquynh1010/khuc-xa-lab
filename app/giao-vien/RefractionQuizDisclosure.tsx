"use client";

import { useMemo, useState } from "react";
import { formatStudentNumber, studentNumbers } from "@/lib/classes";
import type { RefractionQuizSubmission } from "@/lib/db";
import RefractionQuizResultTable from "./RefractionQuizResultTable";

export default function RefractionQuizDisclosure({ submissions, className }: { submissions: RefractionQuizSubmission[]; className: string }) {
  const [expanded, setExpanded] = useState(false);
  const submissionsByNumber = useMemo(() => new Map(submissions
    .filter((submission) => submission.studentNumber !== null)
    .map((submission) => [submission.studentNumber!, submission])), [submissions]);
  const rosterSubmissions = useMemo(() => studentNumbers
    .map((number) => submissionsByNumber.get(number))
    .filter((submission): submission is RefractionQuizSubmission => Boolean(submission)), [submissionsByNumber]);
  const bonusCount = rosterSubmissions.filter((submission) => submission.bonusPoint === 1).length;

  return (
    <div className="quiz-data-disclosure">
      <button className="quiz-data-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
        <span><strong>Dữ liệu học sinh</strong><small>{rosterSubmissions.length}/33 đã nộp · {bonusCount} đạt +1</small></span>
        <b>{expanded ? "Thu gọn ↑" : "Xem dữ liệu ↓"}</b>
      </button>
      {expanded && (
        <div className="quiz-data-content">
          <div className="student-progress-grid" aria-label={`Tiến độ nộp bài cá nhân lớp ${className}`}>
            {studentNumbers.map((number) => {
              const submission = submissionsByNumber.get(number);
              return <div key={number} className={`student-progress-item ${submission ? "submitted" : "pending"}`}><strong>{formatStudentNumber(number)}</strong><span>{submission ? submission.bonusPoint ? "+1 điểm" : "✓ Đã nộp" : "Chưa nộp"}</span></div>;
            })}
          </div>
          {rosterSubmissions.length > 0 ? <RefractionQuizResultTable submissions={rosterSubmissions} /> : <div className="quiz-filter-empty">Chưa có học sinh nộp bài.</div>}
        </div>
      )}
    </div>
  );
}
