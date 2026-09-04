"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatStudentNumber, studentNumbers } from "@/lib/classes";
import type { PracticeKey, TeacherPracticeAttempt } from "@/lib/practice-attempt-types";

type ResultView = "student-number" | "bonus-first" | "bonus-only";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export default function PracticeAttemptDisclosure({ submittedCount, practiceKey, className, schoolYear }: {
  submittedCount: number;
  practiceKey: PracticeKey;
  className: string;
  schoolYear: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [attempts, setAttempts] = useState<TeacherPracticeAttempt[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<ResultView>("student-number");
  const requestRef = useRef<AbortController | null>(null);

  function loadAttempts(force = false) {
    if ((!force && attempts) || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ practiceKey, className, schoolYear });
    void fetch(`/api/teacher-practice-attempts?${params}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { attempts?: TeacherPracticeAttempt[]; error?: string };
        if (!response.ok || !Array.isArray(result.attempts)) throw new Error(result.error || "Practice attempt request failed");
        setAttempts(result.attempts);
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
  const attemptsByNumber = useMemo(() => new Map(attempts?.map((attempt) => [attempt.studentNumber, attempt]) ?? []), [attempts]);
  const bonusCount = attempts?.filter((attempt) => attempt.bonusPoint > 0).length ?? 0;
  const visibleAttempts = useMemo(() => {
    if (!attempts) return [];
    const rows = view === "bonus-only" ? attempts.filter((attempt) => attempt.bonusPoint > 0) : [...attempts];
    return rows.sort((left, right) => {
      if (view === "bonus-first" && left.bonusPoint !== right.bonusPoint) return right.bonusPoint - left.bonusPoint;
      if (view === "bonus-first" && left.correctCount !== right.correctCount) return right.correctCount - left.correctCount;
      return left.studentNumber - right.studentNumber;
    });
  }, [attempts, view]);

  return (
    <div className="quiz-data-disclosure">
      <button className="quiz-data-toggle" type="button" aria-expanded={expanded} onPointerEnter={() => void loadAttempts()} onFocus={() => void loadAttempts()} onClick={() => { const next = !expanded; setExpanded(next); if (next) void loadAttempts(); }}>
        <span><strong>Dữ liệu học sinh</strong><small>{submittedCount}/33 đã thu{attempts ? ` · ${bonusCount} có điểm cộng` : ""}</small></span>
        <b>{expanded ? "Thu gọn ↑" : "Xem dữ liệu ↓"}</b>
      </button>
      {expanded ? <div className="quiz-data-content">
        {loading ? <div className="teacher-results-loading"><span className="loading-dot" /> Đang tải dữ liệu…</div> : null}
        {error ? <div className="teacher-results-error"><p>{error}</p><button type="button" className="secondary-button" onClick={() => void loadAttempts(true)}>Thử lại</button></div> : null}
        {attempts ? <>
          <div className="student-progress-grid" aria-label={`Tiến độ bài cá nhân lớp ${className}`}>
            {studentNumbers.map((number) => {
              const attempt = attemptsByNumber.get(number);
              return <div key={number} className={`student-progress-item ${attempt ? "submitted" : "pending"} ${attempt?.forced ? "forced" : ""}`}><strong>{formatStudentNumber(number)}</strong><span>{attempt ? attempt.forced ? `Thu tự động · ${attempt.completedCount}/${attempt.totalItems}` : `✓ ${attempt.completedCount}/${attempt.totalItems}` : "Chưa nộp"}</span></div>;
            })}
          </div>
          <div className="quiz-results-toolbar">
            <p><strong>{bonusCount}</strong> học sinh có điểm cộng</p>
            <label>Hiển thị<select value={view} onChange={(event) => setView(event.target.value as ResultView)}><option value="student-number">Theo STT</option><option value="bonus-first">Điểm cộng trước</option><option value="bonus-only">Chỉ có điểm cộng</option></select></label>
          </div>
          {visibleAttempts.length ? <div className="table-scroll"><table className="quiz-results-table"><thead><tr><th>STT</th><th>Hoàn thành</th><th>Ý đúng</th><th>Điểm cộng</th><th>Cách thu</th><th>Trạng thái điểm</th><th>Thời gian</th></tr></thead><tbody>{visibleAttempts.map((attempt) => <tr key={attempt.id}><th scope="row">{formatStudentNumber(attempt.studentNumber)}</th><td>{attempt.completedCount}/{attempt.totalItems}</td><td>{attempt.correctCount}/{attempt.totalItems}</td><td><strong className={`quiz-bonus-chip ${attempt.bonusPoint ? "earned" : "not-earned"}`}>{attempt.bonusPoint ? `+${attempt.bonusPoint}` : "—"}</strong></td><td>{attempt.forced ? "Thu tự động" : "Tự nộp"}</td><td><span className={`score-release-chip ${attempt.releasedAt ? "released" : "pending"}`}>{attempt.releasedAt ? "Đã công bố" : "Chưa công bố"}</span></td><td>{formatDate(attempt.submittedAt)}</td></tr>)}</tbody></table></div> : <div className="quiz-filter-empty">Không có học sinh phù hợp bộ lọc.</div>}
        </> : null}
      </div> : null}
    </div>
  );
}
