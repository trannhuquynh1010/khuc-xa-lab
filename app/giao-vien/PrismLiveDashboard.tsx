"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { formatStudentNumber, studentNumbers } from "@/lib/classes";
import {
  hasPrismLiveAnswer,
  prismLiveTypeLabels,
  type PrismDrawingStroke,
  type PrismLiveQuestion,
  type PrismLiveQuestionType,
  type PrismLiveResponse,
} from "@/lib/prism-live";

type QuestionResult = { question: PrismLiveQuestion; responses: PrismLiveResponse[] };
type MutationAction = "start" | "close" | "delete";
const durationOptions = [15, 30, 45, 60, 90, 120, 180, 300];

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function statusLabel(question: PrismLiveQuestion) {
  if (question.status === "running") return "Đang trả lời";
  if (question.status === "closed") return "Đã thu";
  return "Bản nháp";
}

function DrawingPreview({ strokes }: { strokes: PrismDrawingStroke[] }) {
  return (
    <svg className="prism-live-drawing-preview" viewBox="0 0 600 320" role="img" aria-label="Hình vẽ của học sinh">
      <rect width="600" height="320" fill="#fff" />
      <path d="M0 80H600M0 160H600M0 240H600M150 0V320M300 0V320M450 0V320" stroke="#edf0f4" strokeWidth="1" />
      {strokes.map((stroke, index) => (
        <polyline key={index} points={stroke.points.map((point) => `${point.x * 600},${point.y * 320}`).join(" ")} fill="none" stroke={stroke.color} strokeWidth={stroke.width * 1.5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function ChoiceStatistics({ question, responses }: QuestionResult) {
  const answeredResponses = responses.filter((response) => hasPrismLiveAnswer(response.answer));
  const counts = question.options.map((_, optionIndex) => answeredResponses.filter((response) => {
    if (response.answer.type === "single") return response.answer.selected === optionIndex;
    if (response.answer.type === "multiple") return response.answer.selected.includes(optionIndex);
    return false;
  }).length);
  const largest = Math.max(1, ...counts);
  return (
    <div className="prism-live-choice-stats">
      {question.options.map((option, index) => (
        <div key={`${index}-${option}`} className="prism-live-stat-row">
          <b>{String.fromCharCode(65 + index)}</b>
          <span className="prism-live-stat-label">{option}</span>
          <span className="prism-live-stat-track"><i style={{ width: `${counts[index] / largest * 100}%` }} /></span>
          <strong>{counts[index]} bạn</strong>
        </div>
      ))}
    </div>
  );
}

function ResponseStatistics({ result }: { result: QuestionResult }) {
  const { question, responses } = result;
  const meaningfulResponses = responses.filter((response) => hasPrismLiveAnswer(response.answer));
  const respondedNumbers = new Set(meaningfulResponses.map((response) => response.studentNumber));
  return (
    <div className="prism-live-results">
      <div className="prism-live-results-summary">
        <strong>{meaningfulResponses.length}<span>/33</span></strong>
        <div><b>đã trả lời</b><small>{33 - meaningfulResponses.length} học sinh chưa có câu trả lời</small></div>
      </div>

      <div className="prism-live-roster" aria-label="Tiến độ 33 học sinh">
        {studentNumbers.map((number) => <span key={number} className={respondedNumbers.has(number) ? "answered" : ""} title={`STT ${formatStudentNumber(number)}: ${respondedNumbers.has(number) ? "đã trả lời" : "chưa trả lời"}`}>{formatStudentNumber(number)}</span>)}
      </div>

      {question.type === "single" || question.type === "multiple" ? <ChoiceStatistics question={question} responses={responses} /> : null}

      {question.type === "short" ? (
        <div className="prism-live-text-responses">
          {meaningfulResponses.map((response) => response.answer.type === "short" ? <article key={response.studentNumber}><b>STT {formatStudentNumber(response.studentNumber)}</b><p>{response.answer.text}</p></article> : null)}
          {!meaningfulResponses.length ? <p className="prism-live-empty-result">Chưa có câu trả lời.</p> : null}
        </div>
      ) : null}

      {question.type === "drawing" ? (
        <div className="prism-live-drawing-grid">
          {meaningfulResponses.map((response) => response.answer.type === "drawing" ? <article key={response.studentNumber}><b>STT {formatStudentNumber(response.studentNumber)}</b><DrawingPreview strokes={response.answer.strokes} /></article> : null)}
          {!meaningfulResponses.length ? <p className="prism-live-empty-result">Chưa có hình vẽ.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export default function PrismLiveDashboard({ className, schoolYear, isCurrentYear }: { className: string; schoolYear: string; isCurrentYear: boolean }) {
  const [questions, setQuestions] = useState<PrismLiveQuestion[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [type, setType] = useState<PrismLiveQuestionType>("single");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(0);
  const [clockOffset, setClockOffset] = useState(0);

  const loadQuestions = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams({ className, schoolYear });
      const response = await fetch(`/api/teacher-prism-live?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tải câu hỏi.");
      setQuestions(data.questions);
      setClockOffset(new Date(data.serverNow).getTime() - Date.now());
      setNow(Date.now());
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tải câu hỏi.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [className, schoolYear]);

  const loadResult = useCallback(async (questionId: string, quiet = false) => {
    try {
      const params = new URLSearchParams({ className, schoolYear, questionId });
      const response = await fetch(`/api/teacher-prism-live?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tải thống kê.");
      setResult(data.result);
      setClockOffset(new Date(data.serverNow).getTime() - Date.now());
      if (!quiet && !data.result) setMessage("Không tìm thấy câu hỏi.");
    } catch (error) {
      if (!quiet) setMessage(error instanceof Error ? error.message : "Không thể tải thống kê.");
    }
  }, [className, schoolYear]);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      setQuestions([]);
      setSelectedQuestionId(null);
      setResult(null);
      loadQuestions();
    }, 0);
    return () => window.clearTimeout(initial);
  }, [loadQuestions]);

  const hasRunningQuestion = questions.some((question) => question.status === "running");
  const selectedQuestionStatus = questions.find((question) => question.id === selectedQuestionId)?.status ?? null;
  useEffect(() => {
    const interval = window.setInterval(() => loadQuestions(true), hasRunningQuestion ? 1200 : 5000);
    return () => window.clearInterval(interval);
  }, [hasRunningQuestion, loadQuestions]);

  useEffect(() => {
    if (!selectedQuestionId) return;
    const initial = window.setTimeout(() => loadResult(selectedQuestionId), 0);
    const interval = selectedQuestionStatus === "running" ? window.setInterval(() => loadResult(selectedQuestionId, true), 1000) : null;
    return () => {
      window.clearTimeout(initial);
      if (interval !== null) window.clearInterval(interval);
    };
  }, [loadResult, selectedQuestionId, selectedQuestionStatus]);

  useEffect(() => {
    if (!hasRunningQuestion) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [hasRunningQuestion]);

  async function createQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/teacher-prism-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", className, schoolYear, type, prompt, options, durationSeconds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tạo câu hỏi.");
      setPrompt("");
      setOptions(["", "", "", ""]);
      setMessage("✓ Đã lưu câu hỏi. Bấm Bắt đầu khi cả lớp sẵn sàng.");
      await loadQuestions(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tạo câu hỏi.");
    } finally {
      setBusy(false);
    }
  }

  async function mutateQuestion(action: MutationAction, question: PrismLiveQuestion) {
    if (action === "delete" && !window.confirm("Xóa câu hỏi này và toàn bộ câu trả lời?")) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/teacher-prism-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, className, schoolYear, questionId: question.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể thực hiện thao tác.");
      if (action === "delete" && selectedQuestionId === question.id) setSelectedQuestionId(null);
      if (action === "start") setSelectedQuestionId(question.id);
      await loadQuestions(true);
      if (action !== "delete" && selectedQuestionId === question.id) await loadResult(question.id, true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể thực hiện thao tác.");
    } finally {
      setBusy(false);
    }
  }

  const selectedQuestion = useMemo(() => questions.find((question) => question.id === selectedQuestionId) ?? null, [questions, selectedQuestionId]);

  return (
    <section className="class-progress-panel prism-live-teacher" aria-labelledby="prism-live-teacher-heading">
      <div className="class-progress-header prism-live-teacher-head">
        <div><p className="eyebrow">NGÂN HÀNG DÙNG CHUNG</p><h2 id="prism-live-teacher-heading">Câu hỏi nhanh · {className}</h2><p>Soạn một lần, chạy cho từng lớp; thời gian và kết quả của mỗi lớp được lưu riêng.</p></div>
        <span className={`status-badge ${hasRunningQuestion ? "open" : "closed"}`}>{hasRunningQuestion ? "● Đang có câu hỏi" : "○ Chưa chạy"}</span>
      </div>

      <details className="prism-live-creator" open={!questions.length}>
        <summary><span>＋ Thêm vào ngân hàng</span><small>Dùng lại cho mọi lớp</small></summary>
        <form onSubmit={createQuestion}>
          <div className="prism-live-creator-grid">
            <label>Dạng câu hỏi<select value={type} onChange={(event) => setType(event.target.value as PrismLiveQuestionType)}><option value="single">Chọn 1 đáp án</option><option value="multiple">Chọn nhiều đáp án</option><option value="short">Trả lời ngắn</option><option value="drawing">Vẽ hình</option></select></label>
            <label>Thời gian<select value={durationSeconds} onChange={(event) => setDurationSeconds(Number(event.target.value))}>{durationOptions.map((seconds) => <option key={seconds} value={seconds}>{seconds < 60 ? `${seconds} giây` : `${seconds / 60} phút`}</option>)}</select></label>
            <label className="prism-live-prompt-field">Nội dung câu hỏi<textarea required maxLength={1000} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Nhập câu hỏi cho cả lớp…" /></label>
          </div>
          {type === "single" || type === "multiple" ? (
            <div className="prism-live-option-editor">
              {options.map((option, index) => <label key={index}><b>{String.fromCharCode(65 + index)}</b><input value={option} maxLength={180} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Đáp án ${String.fromCharCode(65 + index)}`} /></label>)}
            </div>
          ) : null}
          <div className="prism-live-creator-actions"><p>Lưu một lần; câu hỏi chỉ hiện với <strong>{className}</strong> khi cô bấm Bắt đầu.</p><button className="primary-button" type="submit" disabled={busy}>Lưu vào ngân hàng</button></div>
        </form>
      </details>

      {message ? <p className="prism-live-teacher-message" role="status">{message}</p> : null}
      {!isCurrentYear ? <p className="prism-live-year-warning">Đang xem năm học cũ. Có thể xem thống kê, nhưng chỉ chạy câu hỏi ở năm học hiện tại.</p> : null}

      <div className="prism-live-question-list">
        {loading ? <div className="prism-live-waiting"><span className="loading-dot" /><p>Đang tải câu hỏi…</p></div> : null}
        {!loading && !questions.length ? <div className="prism-live-waiting"><span>?</span><p>Ngân hàng chưa có câu hỏi.</p></div> : null}
        {questions.map((question, index) => {
          const seconds = question.deadlineAt ? (new Date(question.deadlineAt).getTime() - (now + clockOffset)) / 1000 : 0;
          const isSelected = selectedQuestionId === question.id;
          return (
            <article key={question.id} className={`prism-live-teacher-question ${question.status} ${isSelected ? "selected" : ""}`}>
              <div className="prism-live-teacher-question-index"><span>{String(questions.length - index).padStart(2, "0")}</span></div>
              <div className="prism-live-teacher-question-copy">
                <div><span className="prism-live-type-chip">{prismLiveTypeLabels[question.type]}</span><span className={`prism-live-status-chip ${question.status}`}>{statusLabel(question)}</span>{question.status === "running" ? <strong className="prism-live-inline-timer">{formatCountdown(seconds)}</strong> : <small>{question.durationSeconds} giây</small>}</div>
                <h3>{question.prompt}</h3>
                {question.options.length ? <p>{question.options.map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}. ${option}`).join(" · ")}</p> : null}
              </div>
              <div className="prism-live-teacher-question-actions">
                <button type="button" className="secondary-button" onClick={() => setSelectedQuestionId(isSelected ? null : question.id)}>{isSelected ? "Thu gọn" : `Thống kê ${question.responseCount}/33`}</button>
                {question.status === "running" ? <button type="button" className="primary-button stop" disabled={busy} onClick={() => mutateQuestion("close", question)}>Thu ngay</button> : <button type="button" className="primary-button" disabled={busy || !isCurrentYear} onClick={() => mutateQuestion("start", question)}>{question.status === "closed" ? "Chạy lại" : "Bắt đầu"}</button>}
                {question.status !== "running" ? <button type="button" className="icon-button danger" aria-label="Xóa câu hỏi" disabled={busy} onClick={() => mutateQuestion("delete", question)}>×</button> : null}
              </div>
              {isSelected ? <div className="prism-live-result-slot">{result?.question.id === question.id ? <ResponseStatistics result={result} /> : <div className="prism-live-waiting"><span className="loading-dot" /><p>Đang tải thống kê…</p></div>}</div> : null}
            </article>
          );
        })}
      </div>
      {selectedQuestion && selectedQuestion.status === "running" ? <p className="prism-live-auto-note">⌁ Hết giờ, hệ thống khóa câu trả lời và thu đồng loạt. Học sinh không cần bấm nộp.</p> : null}
    </section>
  );
}
