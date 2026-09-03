"use client";

import { useState } from "react";
import {
  countCompletedQuizItems,
  createEmptyRefractionQuizAnswers,
  phenomenonChoices,
  refractionStatementChoices,
  refractiveIndexChoices,
  refractionQuizItemCount,
  sortingItems,
  trueFalseQuestions,
  type RefractionQuizAnswers,
  type RefractionSortBucket,
  type TrueFalseAnswer,
} from "@/lib/refraction-quiz";
import type { RefractionQuizEvaluation } from "@/lib/refraction-quiz-score";
import { formatStudentNumber, isRefractionQuizClassName, isStudentNumber, refractionQuizClassNames, studentNumbers } from "@/lib/classes";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type SubmitState = { type: "idle" | "sending" | "success" | "error"; message: string };

const sectionLabels: Array<{ key: keyof RefractionQuizEvaluation["sections"]; label: string }> = [
  { key: "trueFalse", label: "Nhận biết quy tắc" },
  { key: "phenomenon", label: "Nhận diện hiện tượng" },
  { key: "refractiveIndex", label: "Ý nghĩa chiết suất" },
  { key: "sorting", label: "Phân loại môi trường" },
  { key: "statements", label: "Khẳng định đúng" },
];

function restoreAnswers(value: unknown) {
  if (!isDraftRecord(value)) return null;
  const storedTrueFalse = isDraftRecord(value.trueFalse) ? value.trueFalse : {};
  const storedSorting = isDraftRecord(value.sorting) ? value.sorting : {};
  const restoredTrueFalse: Record<string, TrueFalseAnswer> = {};
  const restoredSorting: Record<string, RefractionSortBucket> = {};
  trueFalseQuestions.forEach((question) => {
    const stored = storedTrueFalse[question.id];
    restoredTrueFalse[question.id] = stored === "true" || stored === "false" ? stored : "";
  });
  sortingItems.forEach((item) => {
    const stored = storedSorting[item.id];
    restoredSorting[item.id] = stored === "toward" || stored === "away" ? stored : "";
  });
  return {
    trueFalse: restoredTrueFalse,
    phenomenon: typeof value.phenomenon === "string" && phenomenonChoices.some((choice) => choice.id === value.phenomenon) ? value.phenomenon : "",
    refractiveIndex: typeof value.refractiveIndex === "string" ? value.refractiveIndex : "",
    sorting: restoredSorting,
    statements: Array.isArray(value.statements)
      ? value.statements.filter((id): id is string => typeof id === "string" && refractionStatementChoices.some((choice) => choice.id === id))
      : [],
  } satisfies RefractionQuizAnswers;
}

export default function RefractionApplicationQuiz() {
  const [className, setClassName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [answers, setAnswers] = useState<RefractionQuizAnswers>(createEmptyRefractionQuizAnswers);
  const [selectedSortItem, setSelectedSortItem] = useState<string | null>(null);
  const [result, setResult] = useState<RefractionQuizEvaluation | null>(null);
  const [state, setState] = useState<SubmitState>({ type: "idle", message: "" });
  const { draftStatus } = useDeviceDraft(deviceDraftKey("refraction-application"), { className, studentNumber, answers }, (value) => {
    if (!isDraftRecord(value)) return;
    if (isRefractionQuizClassName(value.className)) setClassName(value.className);
    const restoredStudentNumber = Number(value.studentNumber);
    if (isStudentNumber(restoredStudentNumber)) setStudentNumber(String(restoredStudentNumber));
    const restored = restoreAnswers(value.answers);
    if (restored) setAnswers(restored);
  });
  const completedItems = countCompletedQuizItems(answers);

  function updateAnswer<K extends keyof RefractionQuizAnswers>(key: K, value: RefractionQuizAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setResult(null);
    setState({ type: "idle", message: "" });
  }

  function setTrueFalse(id: string, value: TrueFalseAnswer) {
    updateAnswer("trueFalse", { ...answers.trueFalse, [id]: value });
  }

  function assignSortItem(id: string, bucket: Exclude<RefractionSortBucket, "">) {
    updateAnswer("sorting", { ...answers.sorting, [id]: bucket });
    setSelectedSortItem(null);
  }

  function toggleStatement(id: string) {
    updateAnswer("statements", answers.statements.includes(id)
      ? answers.statements.filter((selectedId) => selectedId !== id)
      : [...answers.statements, id]);
  }

  function updateIdentity(field: "className" | "studentNumber", value: string) {
    if (field === "className") setClassName(value);
    else setStudentNumber(value);
    setResult(null);
    setState({ type: "idle", message: "" });
  }

  function resetQuiz() {
    setClassName("");
    setStudentNumber("");
    setAnswers(createEmptyRefractionQuizAnswers());
    setSelectedSortItem(null);
    setResult(null);
    setState({ type: "idle", message: "" });
  }

  async function submitQuiz() {
    if (!className) {
      setState({ type: "error", message: "Hãy chọn lớp của em." });
      return;
    }
    if (!isStudentNumber(Number(studentNumber))) {
      setState({ type: "error", message: "Hãy chọn STT của em." });
      return;
    }
    if (completedItems < refractionQuizItemCount) {
      setState({ type: "error", message: `Còn ${refractionQuizItemCount - completedItems} ý chưa trả lời.` });
      return;
    }

    setState({ type: "sending", message: "Đang chấm và lưu điểm…" });
    try {
      const response = await fetch("/api/refraction-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ className, studentNumber: Number(studentNumber), answers, website: "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chưa thể chấm điểm.");
      setResult(data.evaluation);
      setState({ type: "success", message: "Điểm đã được lưu cho giáo viên." });
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "Chưa thể chấm điểm." });
    }
  }

  return (
    <div className="refraction-quiz">
      <div className="quiz-intro">
        <div><p className="eyebrow">CÁ NHÂN · 10 ĐIỂM</p><h3>Kiểm tra nhanh kiến thức khúc xạ</h3><p>Hoàn thành 5 nhiệm vụ. Mỗi lớp và STT chỉ được nộp một lần.</p></div>
        <div className="quiz-progress" aria-label={`Đã trả lời ${completedItems} trên ${refractionQuizItemCount} ý`}><strong>{completedItems}/{refractionQuizItemCount}</strong><span><i style={{ width: `${completedItems / refractionQuizItemCount * 100}%` }} /></span></div>
      </div>

      <div className="quiz-student-row">
        <label>Lớp<select required value={className} onChange={(event) => updateIdentity("className", event.target.value)}><option value="">Chọn lớp</option>{refractionQuizClassNames.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label>STT (01–33)<select required value={studentNumber} onChange={(event) => updateIdentity("studentNumber", event.target.value)}><option value="">Chọn STT</option>{studentNumbers.map((number) => <option key={number} value={number}>{formatStudentNumber(number)}</option>)}</select></label>
      </div>

      <div className="quiz-grid">
        <article className="quiz-card quiz-card-wide">
          <div className="quiz-card-title"><span>01</span><div><h4>Đúng hay sai?</h4><p>Mỗi ý 0,5 điểm</p></div></div>
          <div className="true-false-list">
            {trueFalseQuestions.map((question, index) => (
              <div key={question.id}><p><b>{String.fromCharCode(97 + index)}.</b> {question.text}</p><div role="group" aria-label={`Chọn đúng hoặc sai cho ý ${index + 1}`}><button type="button" className={answers.trueFalse[question.id] === "true" ? "selected" : ""} onClick={() => setTrueFalse(question.id, "true")}>Đúng</button><button type="button" className={answers.trueFalse[question.id] === "false" ? "selected" : ""} onClick={() => setTrueFalse(question.id, "false")}>Sai</button></div></div>
            ))}
          </div>
        </article>

        <article className="quiz-card">
          <div className="quiz-card-title"><span>02</span><div><h4>Nhận diện hiện tượng</h4><p>2 điểm</p></div></div>
          <p className="quiz-prompt">Hiện tượng nào chủ yếu do khúc xạ ánh sáng?</p>
          <div className="quiz-options">{phenomenonChoices.map((choice) => <button key={choice.id} type="button" className={answers.phenomenon === choice.id ? "selected" : ""} onClick={() => updateAnswer("phenomenon", choice.id)}>{choice.text}</button>)}</div>
        </article>

        <article className="quiz-card">
          <div className="quiz-card-title"><span>03</span><div><h4>Hiểu chiết suất</h4><p>2 điểm</p></div></div>
          <p className="quiz-prompt">Một môi trường có chiết suất n = 1,5. Điều đó có nghĩa là gì?</p>
          <div className="quiz-options">{refractiveIndexChoices.map((choice) => <button key={choice.id} type="button" className={answers.refractiveIndex === choice.id ? "selected" : ""} onClick={() => updateAnswer("refractiveIndex", choice.id)}>{choice.text}</button>)}</div>
        </article>

        <article className="quiz-card quiz-card-wide">
          <div className="quiz-card-title"><span>04</span><div><h4>Kéo thả theo hướng lệch</h4><p>Mỗi thẻ 0,5 điểm · Có thể chọn thẻ rồi chọn ô</p></div></div>
          <div className="sort-bank" aria-label="Các thẻ chưa phân loại">
            {sortingItems.filter((item) => !answers.sorting[item.id]).map((item) => <button key={item.id} type="button" draggable className={selectedSortItem === item.id ? "selected" : ""} onDragStart={(event) => { event.dataTransfer.setData("text/plain", item.id); setSelectedSortItem(item.id); }} onClick={() => setSelectedSortItem(item.id)}>{item.text}</button>)}
            {sortingItems.every((item) => answers.sorting[item.id]) && <p>Đã xếp đủ 4 thẻ.</p>}
          </div>
          <div className="sort-zones">
            {(["toward", "away"] as const).map((bucket) => (
              <div key={bucket} role="button" tabIndex={0} className="sort-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain"); if (sortingItems.some((item) => item.id === id)) assignSortItem(id, bucket); }} onClick={() => { if (selectedSortItem) assignSortItem(selectedSortItem, bucket); }} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && selectedSortItem) { event.preventDefault(); assignSortItem(selectedSortItem, bucket); } }}>
                <span>{bucket === "toward" ? "↘ Gần pháp tuyến" : "↗ Xa pháp tuyến"}</span>
                <div>{sortingItems.filter((item) => answers.sorting[item.id] === bucket).map((item) => <button type="button" key={item.id} onClick={(event) => { event.stopPropagation(); updateAnswer("sorting", { ...answers.sorting, [item.id]: "" }); }}>{item.text}<b aria-hidden="true">×</b></button>)}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="quiz-card quiz-card-wide quiz-statements-card">
          <div className="quiz-card-title"><span>05</span><div><h4>Chọn khẳng định đúng</h4><p>2 điểm · Có thể chọn nhiều đáp án</p></div></div>
          <p className="quiz-prompt">Hãy chọn tất cả các khẳng định đúng.</p>
          <div className="quiz-options multi-select-options" role="group" aria-label="Chọn tất cả các khẳng định đúng">
            {refractionStatementChoices.map((choice) => (
              <button key={choice.id} type="button" aria-pressed={answers.statements.includes(choice.id)} className={answers.statements.includes(choice.id) ? "selected" : ""} onClick={() => toggleStatement(choice.id)}>
                <b>{choice.label}</b><span>{choice.text}</span>
              </button>
            ))}
          </div>
        </article>
      </div>

      {result && (
        <div className="quiz-result" aria-live="polite">
          <div className="quiz-score"><span>Điểm của em</span><strong>{result.score.toLocaleString("vi-VN")}</strong><b>/10</b></div>
          <div><h4>{result.score >= 8 ? "Nắm kiến thức tốt!" : result.score >= 5 ? "Đã hiểu phần chính." : "Hãy xem lại quy tắc khúc xạ."}</h4><div className="quiz-review-grid">{sectionLabels.map((section) => <span key={section.key} className={result.sections[section.key] ? "correct" : "review"}>{result.sections[section.key] ? "✓" : "↻"} {section.label}</span>)}</div></div>
        </div>
      )}

      <div className="quiz-actions">
        <span className="draft-status">{draftStatus}</span>
        <span className={`form-message ${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</span>
        <button type="button" className="secondary-button" onClick={resetQuiz}>Làm lại</button>
        <button type="button" className="primary-button" disabled={state.type === "sending" || state.type === "success"} onClick={submitQuiz}>{state.type === "sending" ? "Đang chấm…" : state.type === "success" ? "Đã nộp ✓" : "Chấm điểm & nộp →"}</button>
      </div>
    </div>
  );
}
