"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { classNames, formatStudentNumber, studentNumbers } from "@/lib/classes";
import type { ActivityKey } from "@/lib/activities";
import {
  emptyPrismLiveAnswer,
  hasPrismLiveAnswer,
  prismLiveTypeLabels,
  type PrismDrawingPoint,
  type PrismDrawingStroke,
  type PrismLiveAnswer,
  type PrismLiveQuestion,
  type PrismLiveResponse,
} from "@/lib/prism-live";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type StudentSnapshot = {
  question: PrismLiveQuestion | null;
  response: PrismLiveResponse | null;
  serverNow: string;
};

const identityDraftKey = deviceDraftKey("prism-live-identity");
const drawingColors = ["#111827", "#ef4444", "#2563eb", "#16a34a"];

function DrawingPad({ strokes, disabled, onChange }: { strokes: PrismDrawingStroke[]; disabled: boolean; onChange: (strokes: PrismDrawingStroke[]) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const [color, setColor] = useState(drawingColors[0]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * ratio);
    const height = Math.round(rect.height * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const stroke of strokes) {
      if (!stroke.points.length) continue;
      context.beginPath();
      context.strokeStyle = stroke.color;
      context.lineWidth = stroke.width;
      context.moveTo(stroke.points[0].x * rect.width, stroke.points[0].y * rect.height);
      for (const point of stroke.points.slice(1)) context.lineTo(point.x * rect.width, point.y * rect.height);
      context.stroke();
    }
  }, [strokes]);

  useEffect(() => {
    draw();
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  function getPoint(event: ReactPointerEvent<HTMLCanvasElement>): PrismDrawingPoint {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }

  function startStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    activePointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange([...strokes, { color, width: 3, points: [getPoint(event)] }]);
  }

  function extendStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (disabled || activePointerRef.current !== event.pointerId || !strokes.length) return;
    const next = strokes.slice();
    const last = next[next.length - 1];
    next[next.length - 1] = { ...last, points: [...last.points, getPoint(event)] };
    onChange(next);
  }

  function endStroke(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (activePointerRef.current === event.pointerId) activePointerRef.current = null;
  }

  return (
    <div className="prism-live-drawing-editor">
      <div className="prism-live-drawing-tools" aria-label="Công cụ vẽ">
        <span>Màu nét</span>
        {drawingColors.map((item) => (
          <button key={item} type="button" className={color === item ? "active" : ""} style={{ backgroundColor: item }} aria-label={`Chọn màu ${item}`} onClick={() => setColor(item)} disabled={disabled} />
        ))}
        <button type="button" className="drawing-text-button" onClick={() => onChange(strokes.slice(0, -1))} disabled={disabled || !strokes.length}>Hoàn tác</button>
        <button type="button" className="drawing-text-button" onClick={() => onChange([])} disabled={disabled || !strokes.length}>Xóa</button>
      </div>
      <canvas
        ref={canvasRef}
        className="prism-live-canvas"
        aria-label="Vùng vẽ câu trả lời"
        onPointerDown={startStroke}
        onPointerMove={extendStroke}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
      />
    </div>
  );
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function PrismOptionVisual({ kind, index }: { kind: "prism-path" | "prism-dispersion"; index: number }) {
  // Lăng kính: đỉnh (68,12), đáy (38,103)-(111,103). Các tia đều gãy khúc ĐÚNG trên mặt lăng kính.
  const pathRays = [
    ["12,60 52,60 91,60 150,60", "#111827"],   // A: không lệch (sai)
    ["12,60 52,60 85,48 150,34", "#111827"],   // B: lệch lên, xa đáy (sai)
    ["12,60 52,60 34,98", "#111827"],          // C: phản xạ hắt ra (sai)
    ["12,60 52,60 96,72 150,90", "#111827"],   // D: lệch về phía đáy ở cả hai mặt (đúng)
  ] as const;
  const dispersionRays = [
    [["12,58 53,58 95,70", "#64748b"], ["95,70 150,80", "#7c3aed"], ["95,70 150,96", "#dc2626"]],
    [["12,58 53,58 95,70", "#64748b"], ["95,70 150,74", "#64748b"]],
    [["12,58 53,58 95,70", "#64748b"], ["95,70 150,80", "#dc2626"], ["95,70 150,98", "#7c3aed"]],
    [["12,58 53,58 95,70", "#64748b"], ["95,70 150,58", "#dc2626"], ["95,70 150,46", "#7c3aed"]],
  ] as const;
  const rays = kind === "prism-path" ? [pathRays[index]] : dispersionRays[index];
  return (
    <svg className="prism-live-option-visual" viewBox="0 0 168 116" role="img" aria-label={`Sơ đồ ${String.fromCharCode(65 + index)}`}>
      <path d="M68 12 L111 103 L38 103 Z" fill="#eff6ff" stroke="#24344d" strokeWidth="3" strokeLinejoin="round" />
      {rays.map(([points, color], rayIndex) => <polyline key={rayIndex} points={points} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
  );
}

export default function PrismLiveStudent({ activityKey, title }: { activityKey: ActivityKey; title: string }) {
  const [className, setClassName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [snapshot, setSnapshot] = useState<StudentSnapshot | null>(null);
  const [answer, setAnswer] = useState<PrismLiveAnswer | null>(null);
  const [hasEdited, setHasEdited] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const [now, setNow] = useState(0);
  const loadedQuestionRef = useRef<string | null>(null);
  const validIdentity = classNames.includes(className) && Number(studentNumber) >= 1 && Number(studentNumber) <= 33;

  useDeviceDraft(identityDraftKey, { className, studentNumber }, (value) => {
    if (!isDraftRecord(value)) return;
    if (typeof value.className === "string" && classNames.includes(value.className)) setClassName(value.className);
    const storedNumber = String(value.studentNumber ?? "");
    if (studentNumbers.includes(Number(storedNumber))) setStudentNumber(storedNumber);
  });

  const loadQuestion = useCallback(async () => {
    if (!validIdentity) {
      setSnapshot(null);
      return;
    }
    try {
      const params = new URLSearchParams({ className, studentNumber, activityKey });
      const response = await fetch(`/api/prism-live?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Không thể tải câu hỏi.");
      const result = await response.json() as StudentSnapshot;
      setClockOffset(new Date(result.serverNow).getTime() - Date.now());
      setNow(Date.now());
      setSnapshot(result);
      setLoadError(false);
      const questionRunKey = result.question ? `${result.question.id}:${result.question.runId ?? "draft"}` : null;
      if (result.question && loadedQuestionRef.current !== questionRunKey) {
        loadedQuestionRef.current = questionRunKey;
        setAnswer(result.response?.answer ?? emptyPrismLiveAnswer(result.question.type, result.question.content.items?.length ?? 0));
        setHasEdited(false);
        setSaveState(result.response ? "saved" : "idle");
      }
    } catch {
      setLoadError(true);
    }
  }, [activityKey, className, studentNumber, validIdentity]);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      loadedQuestionRef.current = null;
      setSnapshot(null);
      setAnswer(null);
      loadQuestion();
    }, 0);
    const interval = window.setInterval(loadQuestion, 1200);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [loadQuestion]);

  useEffect(() => {
    if (snapshot?.question?.status !== "running") return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [snapshot?.question?.status]);

  const remainingSeconds = snapshot?.question?.deadlineAt
    ? (new Date(snapshot.question.deadlineAt).getTime() - (now + clockOffset)) / 1000
    : 0;
  const studentSubmitted = Boolean(snapshot?.response?.submittedAt);
  const locked = snapshot?.question?.status !== "running" || remainingSeconds <= 0 || studentSubmitted;
  const activeQuestionId = snapshot?.question?.id ?? null;
  const activeRunId = snapshot?.question?.runId ?? null;

  useEffect(() => {
    if (!validIdentity || !activeQuestionId || !activeRunId || locked || !answer || !hasEdited || submitting) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        const response = await fetch("/api/prism-live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: activeQuestionId,
            runId: activeRunId,
            activityKey,
            className,
            studentNumber: Number(studentNumber),
            answer,
            website: "",
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Không thể lưu.");
        setSaveState("saved");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setSaveState("error");
      }
    }, 420);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [activeQuestionId, activeRunId, activityKey, answer, className, hasEdited, locked, studentNumber, submitting, validIdentity]);

  const updateAnswer = useCallback((next: PrismLiveAnswer) => {
    setAnswer(next);
    setHasEdited(true);
    setSaveState("idle");
  }, []);

  const question = snapshot?.question ?? null;
  const timerTone = remainingSeconds <= 10 ? "danger" : remainingSeconds <= 30 ? "warning" : "";
  const countdownProgress = question ? Math.max(0, Math.min(100, remainingSeconds / question.durationSeconds * 100)) : 0;
  const answered = answer ? hasPrismLiveAnswer(answer) : false;
  const shortAnswerLength = answer?.type === "short" ? answer.text.length : 0;

  async function submitAnswer() {
    if (!validIdentity || !activeQuestionId || !activeRunId || locked || !answer || !answered) return;
    setSubmitting(true);
    setSaveState("saving");
    try {
      const response = await fetch("/api/prism-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeQuestionId,
          runId: activeRunId,
          activityKey,
          className,
          studentNumber: Number(studentNumber),
          answer,
          submit: true,
          website: "",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể nộp câu trả lời.");
      setSnapshot((current) => current ? { ...current, response: data.response } : current);
      setHasEdited(false);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="lab-card prism-live-student" data-live-activity={activityKey} aria-labelledby={`prism-live-student-heading-${activityKey}`}>
      <div className="prism-live-heading">
        <div><p className="eyebrow">CÂU HỎI THEO LƯỢT</p><h2 id={`prism-live-student-heading-${activityKey}`}>{title}</h2></div>
        {question?.status === "running" && remainingSeconds > 0 ? <strong className={`prism-live-timer ${timerTone}`} aria-live="polite">{formatCountdown(remainingSeconds)}</strong> : null}
      </div>

      <div className="prism-live-identity">
        <label>Lớp<select value={className} onChange={(event) => setClassName(event.target.value)}><option value="">Chọn lớp</option>{classNames.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label>STT<select value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)}><option value="">Chọn STT</option>{studentNumbers.map((number) => <option key={number} value={number}>{formatStudentNumber(number)}</option>)}</select></label>
        {validIdentity ? <span className="prism-live-student-chip">{className} · STT {formatStudentNumber(Number(studentNumber))}</span> : null}
      </div>

      {!validIdentity ? (
        <div className="prism-live-waiting"><span>◎</span><p>Chọn lớp và STT để nhận câu hỏi.</p></div>
      ) : loadError && !question ? (
        <div className="prism-live-waiting error"><span>!</span><p>Mất kết nối. Hệ thống đang thử lại…</p></div>
      ) : !question ? (
        <div className="prism-live-waiting"><span className="loading-dot" /><p>Chưa có câu hỏi. Chờ giáo viên bấm bắt đầu.</p></div>
      ) : (
        <div className={`prism-live-question-card ${locked ? "locked" : ""}`}>
          {question.status === "running" && !studentSubmitted ? <div className={`prism-live-countdown-panel ${timerTone}`} role="timer" aria-live="polite"><div><span>Thời gian còn lại</span><strong>{formatCountdown(remainingSeconds)}</strong></div><span className="prism-live-countdown-track"><i style={{ width: `${countdownProgress}%` }} /></span></div> : null}
          <div className="prism-live-question-meta">
            <span>{prismLiveTypeLabels[question.type]}</span>
            {studentSubmitted ? <strong>✓ Đã nộp</strong> : locked ? <strong>✓ Đã hết giờ · bài được thu tự động</strong> : <strong>{answered ? "Đã có câu trả lời" : "Đang trả lời"}</strong>}
          </div>
          <h3>{question.prompt}</h3>

          {answer?.type === "single" ? (
            <div className={`prism-live-options single ${question.content.visualKey ? "visual-options" : ""}`}>
              {question.options.map((option, index) => <button key={`${index}-${option}`} type="button" className={answer.selected === index ? "selected" : ""} onClick={() => updateAnswer({ type: "single", selected: index })} disabled={locked}>{question.content.visualKey ? <PrismOptionVisual kind={question.content.visualKey} index={index} /> : null}<b>{String.fromCharCode(65 + index)}</b><span>{option}</span></button>)}
            </div>
          ) : null}

          {answer?.type === "multiple" ? (
            <div className="prism-live-options multiple">
              {question.options.map((option, index) => {
                const selected = answer.selected.includes(index);
                return <button key={`${index}-${option}`} type="button" className={selected ? "selected" : ""} onClick={() => updateAnswer({ type: "multiple", selected: selected ? answer.selected.filter((item) => item !== index) : [...answer.selected, index].sort() })} disabled={locked}><b>{selected ? "✓" : String.fromCharCode(65 + index)}</b><span>{option}</span></button>;
              })}
            </div>
          ) : null}

          {answer?.type === "matching" ? (
            <div className="prism-live-matching">
              {(question.content.items ?? []).map((item, index) => <label key={`${index}-${item}`}><span><b>{index + 1}</b>{item}</span><select value={answer.selected[index] ?? ""} disabled={locked} onChange={(event) => { const selected = answer.selected.slice(); selected[index] = event.target.value === "" ? null : Number(event.target.value); updateAnswer({ type: "matching", selected }); }}><option value="">Chọn màu</option>{question.options.map((option, optionIndex) => <option key={optionIndex} value={optionIndex}>{option}</option>)}</select></label>)}
            </div>
          ) : null}

          {answer?.type === "short" ? <label className="prism-live-short-answer">Câu trả lời<textarea value={answer.text} maxLength={800} disabled={locked} onChange={(event) => updateAnswer({ type: "short", text: event.target.value })} placeholder="Nhập câu trả lời của em…" /><small>{shortAnswerLength}/800</small></label> : null}

          {answer?.type === "drawing" ? <DrawingPad strokes={answer.strokes} disabled={locked} onChange={(strokes) => updateAnswer({ type: "drawing", strokes })} /> : null}

          {locked && question.resultsPublished && snapshot?.response?.isCorrect !== null && snapshot?.response?.isCorrect !== undefined ? <p className={`prism-live-student-result ${snapshot.response.isCorrect ? "correct" : "incorrect"}`}>{snapshot.response.isCorrect ? "✓ Chính xác" : "Chưa chính xác"}</p> : null}
          {locked && !question.resultsPublished ? <p className="prism-live-student-result pending">⏳ Đã thu bài. Chờ giáo viên công bố kết quả.</p> : null}

          {!locked ? <div className="prism-live-submit-row"><div className={`prism-live-save-state ${saveState}`} aria-live="polite">{saveState === "saving" ? "Đang lưu…" : saveState === "saved" ? "✓ Đã lưu trên hệ thống" : saveState === "error" ? "Chưa lưu được · hãy thử nộp lại" : "Câu trả lời được tự lưu"}</div><button type="button" className="primary-button prism-live-submit-button" disabled={!answered || submitting} onClick={submitAnswer}>{submitting ? "Đang nộp…" : "Nộp câu trả lời"}</button></div> : null}
          {studentSubmitted ? <p className="prism-live-submitted-note">✓ Đã nộp câu trả lời. Em không thể chỉnh sửa thêm.</p> : null}
        </div>
      )}
    </section>
  );
}
