"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatStudentNumber, studentNumbers } from "@/lib/classes";
import type { ActivityKey } from "@/lib/activities";
import {
  hasPrismLiveAnswer,
  prismLiveBonusConfigs,
  prismLiveTypeLabels,
  type PrismDrawingStroke,
  type PrismLiveBonusStudent,
  type PrismLiveCorrectAnswer,
  type PrismLiveQuestion,
  type PrismLiveResponse,
} from "@/lib/prism-live";

type QuestionResult = { question: PrismLiveQuestion; responses: PrismLiveResponse[]; correctAnswer: PrismLiveCorrectAnswer | null };
type StageAction = "start" | "close" | "publish" | "unpublish";

function formatCountdown(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function DrawingPreview({ strokes }: { strokes: PrismDrawingStroke[] }) {
  return (
    <svg className="cp-drawing-preview" viewBox="0 0 600 320" role="img" aria-label="Hình vẽ của học sinh">
      <rect width="600" height="320" fill="#fff" />
      {strokes.map((stroke, index) => (
        <polyline key={index} points={stroke.points.map((point) => `${point.x * 600},${point.y * 320}`).join(" ")} fill="none" stroke={stroke.color} strokeWidth={stroke.width * 1.5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

/** Biểu đồ cột phân bố đáp án, tô sáng đáp án đúng sau khi công bố (giống "Show correct answer" của ClassPoint). */
function ChoiceBars({ question, responses, correctAnswer, reveal }: QuestionResult & { reveal: boolean }) {
  const answered = responses.filter((response) => hasPrismLiveAnswer(response.answer));
  const counts = question.options.map((_, optionIndex) => answered.filter((response) => {
    if (response.answer.type === "single") return response.answer.selected === optionIndex;
    if (response.answer.type === "multiple") return response.answer.selected.includes(optionIndex);
    return false;
  }).length);
  const largest = Math.max(1, ...counts);
  const correctIndices = new Set(reveal ? (correctAnswer?.type === "single" ? [correctAnswer.selected] : correctAnswer?.type === "multiple" ? correctAnswer.selected : []) : []);
  return (
    <div className="cp-choice-bars">
      {question.options.map((option, index) => (
        <div key={`${index}-${option}`} className={`cp-bar-row ${correctIndices.has(index) ? "correct" : ""}`}>
          <b>{correctIndices.has(index) ? "✓" : String.fromCharCode(65 + index)}</b>
          <span className="cp-bar-label">{option}</span>
          <span className="cp-bar-track"><i style={{ width: `${counts[index] / largest * 100}%` }} /></span>
          <strong>{counts[index]}</strong>
        </div>
      ))}
    </div>
  );
}

export default function PrismLiveStage({ className, schoolYear, isCurrentYear, activityKey, title, presentation = false }: { className: string; schoolYear: string; isCurrentYear: boolean; activityKey: ActivityKey; title: string; presentation?: boolean }) {
  const [questions, setQuestions] = useState<PrismLiveQuestion[]>([]);
  const [bonusStudents, setBonusStudents] = useState<PrismLiveBonusStudent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [now, setNow] = useState(0);
  const [clockOffset, setClockOffset] = useState(0);

  const bonusConfig = prismLiveBonusConfigs[activityKey] ?? null;

  const loadQuestions = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams({ className, schoolYear, activityKey, includeBonus: "1" });
      const response = await fetch(`/api/teacher-prism-live?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tải câu hỏi.");
      setQuestions(data.questions);
      if (Array.isArray(data.bonusStudents)) setBonusStudents(data.bonusStudents);
      setClockOffset(new Date(data.serverNow).getTime() - Date.now());
      setNow(Date.now());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tải câu hỏi.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [activityKey, className, schoolYear]);

  const loadResult = useCallback(async (questionId: string) => {
    try {
      const params = new URLSearchParams({ className, schoolYear, activityKey, questionId });
      const response = await fetch(`/api/teacher-prism-live?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tải kết quả.");
      setResult(data.result);
      setClockOffset(new Date(data.serverNow).getTime() - Date.now());
    } catch {
      /* giữ nguyên kết quả cũ khi lỗi mạng tạm thời */
    }
  }, [activityKey, className, schoolYear]);

  // Các "slide": câu hỏi thuộc bộ đề của hoạt động, theo thứ tự; nếu chưa có bộ đề thì dùng tất cả.
  const slides = useMemo(() => {
    const inSet = bonusConfig ? questions.filter((question) => question.quizSet === bonusConfig.quizSet) : [];
    const ordered = inSet.length ? inSet : questions;
    return [...ordered].sort((left, right) => (left.quizOrder ?? 999) - (right.quizOrder ?? 999) || left.createdAt.localeCompare(right.createdAt));
  }, [bonusConfig, questions]);

  const current = slides[currentIndex] ?? null;
  const currentId = current?.id ?? null;
  const currentStatus = current?.status ?? null;

  useEffect(() => {
    const timer = window.setTimeout(() => loadQuestions(), 0);
    return () => window.clearTimeout(timer);
  }, [loadQuestions]);

  const hasRunning = questions.some((question) => question.status === "running");
  useEffect(() => {
    const interval = window.setInterval(() => loadQuestions(true), hasRunning ? 1200 : 5000);
    return () => window.clearInterval(interval);
  }, [hasRunning, loadQuestions]);

  useEffect(() => {
    if (!currentId) return;
    const initial = window.setTimeout(() => loadResult(currentId), 0);
    const interval = currentStatus === "running" ? window.setInterval(() => loadResult(currentId), 1000) : null;
    return () => { window.clearTimeout(initial); if (interval !== null) window.clearInterval(interval); };
  }, [currentId, currentStatus, loadResult]);

  useEffect(() => {
    if (!hasRunning) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [hasRunning]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(slides.length - 1, index)));
    setShowStats(false);
    setMessage("");
  }, [slides.length]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      if (event.key === "ArrowRight") goTo(currentIndex + 1);
      if (event.key === "ArrowLeft") goTo(currentIndex - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIndex, goTo]);

  async function act(action: StageAction) {
    if (!current) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/teacher-prism-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, activityKey, className, schoolYear, questionId: current.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể thực hiện thao tác.");
      await loadQuestions(true);
      await loadResult(current.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể thực hiện thao tác.");
    } finally {
      setBusy(false);
    }
  }

  async function gradeShort(response: PrismLiveResponse, isCorrect: boolean) {
    if (!current?.runId) return;
    await fetch("/api/teacher-prism-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grade", className, schoolYear, activityKey, questionId: current.id, runId: current.runId, studentNumber: response.studentNumber, isCorrect }),
    });
    setResult((cur) => cur ? { ...cur, responses: cur.responses.map((item) => item.studentNumber === response.studentNumber ? { ...item, isCorrect } : item) } : cur);
    await loadQuestions(true);
  }

  const responses = result && result.question.id === currentId ? result.responses : [];
  const answered = responses.filter((response) => hasPrismLiveAnswer(response.answer));
  const submitted = answered.filter((response) => response.submittedAt);
  const reveal = Boolean(current?.resultsPublished);
  const remainingSeconds = current?.deadlineAt ? (new Date(current.deadlineAt).getTime() - (now + clockOffset)) / 1000 : 0;
  const timerTone = remainingSeconds <= 10 ? "danger" : remainingSeconds <= 30 ? "warning" : "";

  const rankedBonus = useMemo(() => [...bonusStudents].sort((left, right) => right.correctCount - left.correctCount || left.studentNumber - right.studentNumber), [bonusStudents]);
  const total = bonusConfig?.total ?? slides.length;

  return (
    <section className={`cp-stage ${presentation ? "presentation" : ""}`} aria-label={`Trình chiếu ${title}`}>
      <div className="cp-topbar">
        <div className="cp-topbar-left">
          <span className="cp-chip">{title}</span>
          <span className="cp-chip subtle">{className} · {schoolYear}</span>
        </div>
        <div className="cp-progress-dots" role="tablist" aria-label="Câu hỏi">
          {slides.map((question, index) => (
            <button key={question.id} type="button" role="tab" aria-selected={index === currentIndex}
              className={`cp-dot ${index === currentIndex ? "active" : ""} ${question.status} ${question.resultsPublished ? "published" : ""}`}
              title={`Câu ${index + 1}`} onClick={() => goTo(index)}>{index + 1}</button>
          ))}
        </div>
        <div className="cp-topbar-right">
          <button type="button" className="cp-mini-button" onClick={() => setShowStats((value) => !value)}>📊 Thống kê</button>
        </div>
      </div>

      {message ? <p className="cp-message" role="status">{message}</p> : null}
      {!isCurrentYear ? <p className="cp-message warn">Đang xem năm học cũ · chỉ xem lại, không chạy câu hỏi.</p> : null}

      {loading ? (
        <div className="cp-empty"><span className="loading-dot" /><p>Đang tải câu hỏi…</p></div>
      ) : !slides.length ? (
        <div className="cp-empty"><span>?</span><p>Chưa có câu hỏi trong ngân hàng. Hãy thêm câu hỏi ở bảng giáo viên.</p></div>
      ) : showStats ? (
        <div className="cp-summary">
          <h2>Thống kê lớp {className}</h2>
          <p className="cp-summary-note">Tổng số câu đúng của mỗi học sinh sau hoạt động{bonusConfig ? ` · ${bonusConfig.label}` : ""}.</p>
          {rankedBonus.length ? (
            <div className="cp-summary-grid">
              {rankedBonus.map((student) => (
                <span key={student.studentNumber} className={student.bonusPoint ? "earned" : ""}>
                  <b>STT {formatStudentNumber(student.studentNumber)}</b>
                  <em>{student.correctCount}/{total} đúng</em>
                  <strong>{student.bonusPoint ? `+${student.bonusPoint}` : student.gradedCount < total ? "…" : "—"}</strong>
                </span>
              ))}
            </div>
          ) : <p className="cp-empty-note">Chưa có học sinh nào trả lời.</p>}
          {bonusConfig ? <p className="cp-summary-rule">{bonusConfig.partialThreshold < bonusConfig.total ? `Đúng ${bonusConfig.total}/${bonusConfig.total}: +2 · Đúng ${bonusConfig.partialThreshold}/${bonusConfig.total}: +1 điểm cộng.` : `Đúng ${bonusConfig.total}/${bonusConfig.total}: +2 điểm cộng.`}</p> : null}
        </div>
      ) : current ? (
        <div className="cp-slide">
          <div className="cp-slide-head">
            <span className="cp-slide-index">Câu {currentIndex + 1}/{slides.length}</span>
            <span className="cp-type">{prismLiveTypeLabels[current.type]}</span>
            {current.status === "running" ? <strong className={`cp-timer ${timerTone}`}>{formatCountdown(remainingSeconds)}</strong> : null}
            {current.status === "closed" ? <span className="cp-state closed">Đã thu bài</span> : null}
            {current.resultsPublished ? <span className="cp-state published">Đã công bố</span> : null}
          </div>

          <h1 className="cp-question">{current.prompt}</h1>

          {current.options.length ? (
            current.status !== "draft" && current.status === "closed" && (current.type === "single" || current.type === "multiple") ? (
              result && result.question.id === current.id ? <ChoiceBars {...result} reveal={reveal} /> : <div className="cp-empty small"><span className="loading-dot" /></div>
            ) : (
              <ol className="cp-options">
                {current.options.map((option, index) => <li key={`${index}-${option}`}><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></li>)}
              </ol>
            )
          ) : null}

          {current.type === "matching" && current.content.items?.length ? (
            <ol className="cp-options">
              {current.content.items.map((item, index) => <li key={`${index}-${item}`}><b>{index + 1}</b><span>{item}</span></li>)}
            </ol>
          ) : null}

          {current.status === "closed" && current.type === "matching" ? (
            <div className="cp-response-list">
              {answered.map((response) => response.answer.type === "matching" ? (
                <article key={response.studentNumber} className={reveal ? (response.isCorrect ? "correct" : "incorrect") : ""}>
                  <b>STT {formatStudentNumber(response.studentNumber)}{reveal ? (response.isCorrect ? " · Đúng" : " · Chưa đúng") : ""}</b>
                  <p>{response.answer.selected.map((selected, index) => `${index + 1}→${selected === null ? "—" : current.options[selected]}`).join(" · ")}</p>
                </article>
              ) : null)}
            </div>
          ) : null}

          {current.status === "closed" && current.type === "short" ? (
            <div className="cp-response-list">
              {answered.map((response) => response.answer.type === "short" ? (
                <article key={response.studentNumber} className={response.isCorrect === true ? "correct" : response.isCorrect === false ? "incorrect" : ""}>
                  <div className="cp-short-head"><b>STT {formatStudentNumber(response.studentNumber)}</b><label><input type="checkbox" checked={response.isCorrect === true} onChange={(event) => gradeShort(response, event.target.checked)} /> Đúng</label></div>
                  <p>{response.answer.text}</p>
                </article>
              ) : null)}
              {!answered.length ? <p className="cp-empty-note">Chưa có câu trả lời.</p> : null}
            </div>
          ) : null}

          {current.status === "closed" && current.type === "drawing" ? (
            <div className="cp-drawing-grid">
              {answered.map((response) => response.answer.type === "drawing" ? <article key={response.studentNumber}><b>STT {formatStudentNumber(response.studentNumber)}</b><DrawingPreview strokes={response.answer.strokes} /></article> : null)}
              {!answered.length ? <p className="cp-empty-note">Chưa có hình vẽ.</p> : null}
            </div>
          ) : null}

          <div className="cp-roster" aria-label="Tiến độ 33 học sinh">
            {studentNumbers.map((number) => {
              const response = answered.find((item) => item.studentNumber === number);
              const state = !response ? "" : reveal && response.isCorrect === true ? "correct" : reveal && response.isCorrect === false ? "incorrect" : "answered";
              return <span key={number} className={state}>{formatStudentNumber(number)}</span>;
            })}
          </div>
        </div>
      ) : null}

      <div className="cp-controls">
        <button type="button" className="cp-nav" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)} aria-label="Câu trước">‹</button>

        <div className="cp-action-wrap">
          <span className="cp-submit-count">{submitted.length}<small>/33 đã nộp</small></span>
          {current ? (
            current.status === "draft" ? (
              <button type="button" className="cp-action start" disabled={busy || !isCurrentYear} onClick={() => act("start")}>▶ Bắt đầu</button>
            ) : current.status === "running" ? (
              <button type="button" className="cp-action stop" disabled={busy} onClick={() => act("close")}>■ Thu bài</button>
            ) : !current.resultsPublished ? (
              <>
                <button type="button" className="cp-action reveal" disabled={busy} onClick={() => act("publish")}>✓ Công bố kết quả</button>
                <button type="button" className="cp-action ghost" disabled={busy || !isCurrentYear} onClick={() => act("start")}>↻ Chạy lại</button>
              </>
            ) : (
              <>
                <button type="button" className="cp-action ghost" disabled={busy} onClick={() => act("unpublish")}>Ẩn kết quả</button>
                <button type="button" className="cp-action ghost" disabled={busy || !isCurrentYear} onClick={() => act("start")}>↻ Chạy lại</button>
              </>
            )
          ) : null}
        </div>

        <button type="button" className="cp-nav" disabled={currentIndex >= slides.length - 1} onClick={() => goTo(currentIndex + 1)} aria-label="Câu sau">›</button>
      </div>

      {!presentation ? (
        <Link className="cp-back-link" href={`/giao-vien?tab=${activityKey}&class=${className}&year=${schoolYear}`}>← Quay lại bảng giáo viên</Link>
      ) : null}
    </section>
  );
}
