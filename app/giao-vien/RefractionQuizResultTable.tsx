"use client";

import { useMemo, useState } from "react";
import { formatStudentNumber } from "@/lib/classes";
import type { RefractionQuizSubmission } from "@/lib/db";

type ResultView = "student-number" | "bonus-first" | "bonus-only";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export default function RefractionQuizResultTable({ submissions }: { submissions: RefractionQuizSubmission[] }) {
  const [view, setView] = useState<ResultView>("student-number");
  const bonusSubmissions = submissions.filter((submission) => submission.bonusPoint > 0);
  const bonusCount = bonusSubmissions.length;
  const totalBonusPoints = bonusSubmissions.reduce((total, submission) => total + submission.bonusPoint, 0);
  const visibleSubmissions = useMemo(() => {
    const rows = view === "bonus-only"
      ? submissions.filter((submission) => submission.bonusPoint > 0)
      : [...submissions];

    return rows.sort((left, right) => {
      if (view === "bonus-first" && left.bonusPoint !== right.bonusPoint) {
        return right.bonusPoint - left.bonusPoint;
      }
      if (view === "bonus-first" && left.correctCount !== right.correctCount) {
        return right.correctCount - left.correctCount;
      }
      return (left.studentNumber ?? 999) - (right.studentNumber ?? 999);
    });
  }, [submissions, view]);

  return (
    <div className="quiz-results-table-wrap">
      <div className="quiz-results-toolbar">
        <p><strong>{bonusCount}</strong> học sinh có điểm cộng · tổng <strong>{totalBonusPoints}</strong> điểm</p>
        <label>Hiển thị
          <select value={view} onChange={(event) => setView(event.target.value as ResultView)}>
            <option value="student-number">Theo STT</option>
            <option value="bonus-first">Điểm cộng trước</option>
            <option value="bonus-only">Chỉ học sinh có điểm cộng</option>
          </select>
        </label>
      </div>
      {visibleSubmissions.length > 0 ? (
        <div className="table-scroll">
          <table className="quiz-results-table">
            <thead><tr><th>STT</th><th>Điểm cộng</th><th>Số ý đúng</th><th>Trạng thái điểm</th><th>Lần nộp</th></tr></thead>
            <tbody>{visibleSubmissions.map((submission) => (
              <tr key={submission.id}>
                <th scope="row">{formatStudentNumber(submission.studentNumber!)}</th>
                <td><strong className={`quiz-bonus-chip ${submission.bonusPoint ? "earned" : "not-earned"}`}>{submission.bonusPoint ? `+${submission.bonusPoint}` : "—"}</strong></td>
                <td>{submission.correctCount}/{submission.totalItems}</td>
                <td><span className={`score-release-chip ${submission.releasedAt ? "released" : "pending"}`}>{submission.releasedAt ? "Đã công bố" : "Chưa công bố"}</span></td>
                <td><time dateTime={submission.createdAt}>{formatDate(submission.createdAt)}</time></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <div className="quiz-filter-empty">Chưa có học sinh đạt điểm cộng.</div>}
    </div>
  );
}
