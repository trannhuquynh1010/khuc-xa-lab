"use client";

import { useState } from "react";
import {
  countCompletedQuizItems,
  createEmptyRefractionQuizAnswers,
  phenomenonChoices,
  refractionQuizBonusThreshold,
  refractionStatementChoices,
  refractiveIndexChoices,
  refractionQuizItemCount,
  sortingItems,
  trueFalseQuestions,
  type RefractionQuizAnswers,
  type RefractionSortBucket,
  type TrueFalseAnswer,
} from "@/lib/refraction-quiz";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";
import PracticeIdentityFields from "./PracticeIdentityFields";
import usePracticeAttempt from "./usePracticeAttempt";

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
  const [answers, setAnswers] = useState<RefractionQuizAnswers>(createEmptyRefractionQuizAnswers);
  const [selectedSortItem, setSelectedSortItem] = useState<string | null>(null);
  const { draftStatus } = useDeviceDraft(deviceDraftKey("refraction-application"), { answers }, (value) => {
    if (!isDraftRecord(value)) return;
    const restored = restoreAnswers(value.answers);
    if (restored) setAnswers(restored);
  });
  const completedItems = countCompletedQuizItems(answers);
  const attempt = usePracticeAttempt("refraction-application", answers, completedItems);

  function updateAnswer<K extends keyof RefractionQuizAnswers>(key: K, value: RefractionQuizAnswers[K]) {
    if (attempt.locked || attempt.checking) return;
    setAnswers((current) => ({ ...current, [key]: value }));
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

  function resetQuiz() {
    setAnswers(createEmptyRefractionQuizAnswers());
    setSelectedSortItem(null);
  }

  return (
    <div className="refraction-quiz">
      <div className="quiz-intro">
        <div><p className="eyebrow">CÁ NHÂN · ĐIỂM CỘNG</p><h3>Kiểm tra nhanh kiến thức khúc xạ</h3><p>Đúng 16/16: +2 điểm · Đúng {refractionQuizBonusThreshold}/{refractionQuizItemCount}: +1 điểm. Kết quả hiển thị sau khi giáo viên công bố.</p></div>
        <div className="quiz-progress" aria-label={`Đã trả lời ${completedItems} trên ${refractionQuizItemCount} ý`}><strong>{completedItems}/{refractionQuizItemCount}</strong><span><i style={{ width: `${completedItems / refractionQuizItemCount * 100}%` }} /></span></div>
      </div>

      <PracticeIdentityFields practiceKey="refraction-application" className={attempt.className} studentNumber={attempt.studentNumber} onClassChange={attempt.setClassName} onStudentNumberChange={attempt.setStudentNumber} />

      {attempt.locked && !attempt.releasedResult && (
        <div className="quiz-submission-notice" aria-live="polite">
          <span>✓</span><div><strong>Đã thu bài</strong><p>{attempt.message}</p></div>
        </div>
      )}

      <fieldset className="quiz-grid quiz-question-fieldset" disabled={attempt.locked || attempt.checking || attempt.submitting}>
        <article className="quiz-card quiz-card-wide">
          <div className="quiz-card-title"><span>01</span><div><h4>Đúng hay sai?</h4><p>Chọn Đúng hoặc Sai cho từng nhận định.</p></div></div>
          <div className="true-false-list">
            {trueFalseQuestions.map((question, index) => (
              <div key={question.id}><p><b>{String.fromCharCode(97 + index)}.</b> {question.text}</p><div role="group" aria-label={`Chọn đúng hoặc sai cho ý ${index + 1}`}><button type="button" className={answers.trueFalse[question.id] === "true" ? "selected" : ""} onClick={() => setTrueFalse(question.id, "true")}>Đúng</button><button type="button" className={answers.trueFalse[question.id] === "false" ? "selected" : ""} onClick={() => setTrueFalse(question.id, "false")}>Sai</button></div></div>
            ))}
          </div>
        </article>

        <article className="quiz-card">
          <div className="quiz-card-title"><span>02</span><div><h4>Nhận diện hiện tượng</h4><p>Chọn một đáp án.</p></div></div>
          <p className="quiz-prompt">Hiện tượng nào chủ yếu do khúc xạ ánh sáng?</p>
          <div className="quiz-options">{phenomenonChoices.map((choice) => <button key={choice.id} type="button" className={answers.phenomenon === choice.id ? "selected" : ""} onClick={() => updateAnswer("phenomenon", choice.id)}>{choice.text}</button>)}</div>
        </article>

        <article className="quiz-card">
          <div className="quiz-card-title"><span>03</span><div><h4>Hiểu chiết suất</h4><p>Chọn một cách giải thích.</p></div></div>
          <p className="quiz-prompt">Một môi trường có chiết suất n = 1,5. Điều đó có nghĩa là gì?</p>
          <div className="quiz-options">{refractiveIndexChoices.map((choice) => <button key={choice.id} type="button" className={answers.refractiveIndex === choice.id ? "selected" : ""} onClick={() => updateAnswer("refractiveIndex", choice.id)}>{choice.text}</button>)}</div>
        </article>

        <article className="quiz-card quiz-card-wide">
          <div className="quiz-card-title"><span>04</span><div><h4>Kéo thả theo hướng lệch</h4><p>Kéo từng thẻ vào ô phù hợp; cũng có thể chọn thẻ rồi chọn ô.</p></div></div>
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
          <div className="quiz-card-title"><span>05</span><div><h4>Chọn khẳng định đúng</h4><p>Chọn tất cả các khẳng định đúng; có thể chọn nhiều đáp án.</p></div></div>
          <div className="quiz-options multi-select-options" role="group" aria-label="Chọn tất cả các khẳng định đúng">
            {refractionStatementChoices.map((choice) => (
              <button key={choice.id} type="button" aria-pressed={answers.statements.includes(choice.id)} className={answers.statements.includes(choice.id) ? "selected" : ""} onClick={() => toggleStatement(choice.id)}>
                <b>{choice.label}</b><span>{choice.text}</span>
              </button>
            ))}
          </div>
        </article>
      </fieldset>

      {attempt.releasedResult && (
        <div className={`quiz-result ${attempt.releasedResult.bonusPoint ? "bonus-earned" : "bonus-missed"}`} aria-live="polite">
          <div className="quiz-score"><span>Kết quả</span><strong>{attempt.releasedResult.bonusPoint ? `+${attempt.releasedResult.bonusPoint}` : "—"}</strong><b>điểm cộng</b></div>
          <div><h4>{attempt.releasedResult.bonusPoint ? `Chúc mừng! Em nhận +${attempt.releasedResult.bonusPoint} điểm cộng.` : "Em chưa đạt điểm cộng lần này."}</h4><p>Em trả lời đúng {attempt.releasedResult.correctCount}/{attempt.releasedResult.totalItems} ý. Mốc điểm: 15/16 = +1; 16/16 = +2.</p></div>
        </div>
      )}

      <div className="quiz-actions">
        <span className="draft-status">{attempt.saving ? "Đang đồng bộ bài làm…" : draftStatus}</span>
        {attempt.message && !attempt.locked ? <span className={`form-message ${attempt.messageType}`} role={attempt.messageType === "error" ? "alert" : "status"}>{attempt.message}</span> : null}
        <button type="button" className="secondary-button" disabled={attempt.locked} onClick={resetQuiz}>Làm lại</button>
        <button type="button" className="primary-button" disabled={completedItems < refractionQuizItemCount || !attempt.identityReady || attempt.locked || attempt.checking || attempt.submitting} onClick={() => void attempt.submit()}>{attempt.submitting ? "Đang gửi…" : attempt.checking ? "Đang kiểm tra…" : attempt.locked ? "Đã nộp ✓" : "Nộp bài →"}</button>
      </div>
    </div>
  );
}
