"use client";

import { useState } from "react";
import { lensPracticeQuestions, isLensPracticeAnswerCorrect, LENS_PRACTICE_QUESTION_COUNT } from "@/lib/lens-practice";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";
import PracticeIdentityFields from "./PracticeIdentityFields";
import usePracticeAttempt from "./usePracticeAttempt";

export default function LensPracticeQuiz() {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const { draftStatus } = useDeviceDraft(
    deviceDraftKey("lens-practice-quiz-v1"),
    { responses },
    (value) => {
      if (!isDraftRecord(value)) return;
      const savedResponses = value.responses;
      if (!isDraftRecord(savedResponses)) return;
      const restored: Record<string, string> = {};
      lensPracticeQuestions.forEach((question) => {
        const answer = savedResponses[question.id];
        if (typeof answer === "string") restored[question.id] = answer;
      });
      setResponses(restored);
    },
  );

  const answeredCount = lensPracticeQuestions.filter((question) => Boolean(responses[question.id])).length;
  const correctCount = lensPracticeQuestions.filter((question) => isLensPracticeAnswerCorrect(question, responses[question.id])).length;
  const finished = answeredCount === LENS_PRACTICE_QUESTION_COUNT;

  const attempt = usePracticeAttempt("lens-practice", { responses }, answeredCount);

  function selectAnswer(questionId: string, value: string) {
    setResponses((current) => ({ ...current, [questionId]: value }));
    setChecked(false);
  }

  function resetPractice() {
    setResponses({});
    setChecked(false);
  }

  const resultClass = (questionId: string, correct: boolean) => checked && responses[questionId] ? (correct ? "practice-correct" : "practice-incorrect") : "";

  return (
    <div className="electric-practice lens-practice-quiz">
      <div className="practice-intro factors-practice-intro">
        <div><p className="eyebrow">BÀI TẬP CỦNG CỐ</p><h3>Đặc điểm và khái niệm về thấu kính</h3><p>Ôn lại quang tâm, trục chính, tiêu điểm, tiêu cự và đường truyền của các tia sáng đặc biệt.</p></div>
        <strong>{answeredCount}/{LENS_PRACTICE_QUESTION_COUNT}</strong>
      </div>

      <PracticeIdentityFields practiceKey="lens-practice" className={attempt.className} studentNumber={attempt.studentNumber} onClassChange={attempt.setClassName} onStudentNumberChange={attempt.setStudentNumber} />
      {attempt.locked ? <div className="quiz-submission-notice"><span>✓</span><div><strong>Đã thu bài</strong><p>{attempt.message}</p></div></div> : null}

      <fieldset className="practice-grid practice-question-fieldset" disabled={attempt.locked || attempt.checking || attempt.submitting}>
        {lensPracticeQuestions.map((question, index) => {
          const response = responses[question.id] ?? "";
          const correct = isLensPracticeAnswerCorrect(question, response);
          return (
            <article key={question.id} className="practice-card">
              <div className="practice-card-heading"><span>{String(index + 1).padStart(2, "0")}</span><div><h4>Câu {index + 1}</h4>{question.context ? <p>{question.context}</p> : null}</div></div>
              <p>{question.prompt}</p>
              <div className={resultClass(question.id, correct)} role="group" aria-label={question.prompt}>
                {question.choices.map((choice) => (
                  <button key={choice.value} type="button" aria-pressed={response === choice.value} className={response === choice.value ? "selected" : ""} onClick={() => selectAnswer(question.id, choice.value)}>{choice.label}</button>
                ))}
              </div>
              {checked && response ? <p className={correct ? "correct" : "incorrect"}>{correct ? "✓ Chính xác." : `✗ Chưa đúng. ${question.explanation}`}</p> : null}
            </article>
          );
        })}
      </fieldset>

      {attempt.releasedResult ? <div className={`quiz-result ${attempt.releasedResult.bonusPoint ? "bonus-earned" : "bonus-missed"}`}><div className="quiz-score"><span>Kết quả</span><strong>{attempt.releasedResult.bonusPoint ? `+${attempt.releasedResult.bonusPoint}` : "—"}</strong><b>điểm cộng</b></div><div><h4>{attempt.releasedResult.bonusPoint ? `Em nhận +${attempt.releasedResult.bonusPoint} điểm cộng.` : "Em chưa đạt điểm cộng lần này."}</h4><p>Đúng {attempt.releasedResult.correctCount}/{attempt.releasedResult.totalItems} câu.</p></div></div> : null}

      <div className="practice-actions">
        <span className="draft-status">{attempt.saving ? "Đang đồng bộ bài làm…" : draftStatus}</span>
        {attempt.message && !attempt.locked ? <span className={`form-message ${attempt.messageType}`}>{attempt.message}</span> : null}
        {checked ? <p className={correctCount === LENS_PRACTICE_QUESTION_COUNT ? "correct" : "incorrect"} aria-live="polite">{correctCount === LENS_PRACTICE_QUESTION_COUNT ? `Hoàn hảo: ${LENS_PRACTICE_QUESTION_COUNT}/${LENS_PRACTICE_QUESTION_COUNT}!` : `Đúng ${correctCount}/${LENS_PRACTICE_QUESTION_COUNT}. Hãy xem lại các câu màu cam.`}</p> : null}
        <button type="button" className="secondary-button" disabled={attempt.locked} onClick={resetPractice}>Làm lại</button>
        <button type="button" className="secondary-button" disabled={!finished || attempt.locked} onClick={() => setChecked(true)}>Kiểm tra</button>
        <button type="button" className="primary-button" disabled={!finished || !attempt.identityReady || attempt.locked || attempt.checking || attempt.submitting} onClick={() => void attempt.submit()}>{attempt.submitting ? "Đang nộp…" : attempt.locked ? "Đã nộp ✓" : "Nộp bài →"}</button>
      </div>
    </div>
  );
}
