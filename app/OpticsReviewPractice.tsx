"use client";

import { useMemo, useState } from "react";
import {
  createEmptyOpticsReviewAnswers,
  getNextOpticsReviewDifficulty,
  getOpticsReviewQuestion,
  isOpticsReviewAnswerCorrect,
  isOpticsReviewResponseAnswered,
  opticsReviewLevels,
  opticsReviewTopics,
  pickOpticsReviewQuestion,
  OPTICS_REVIEW_QUESTION_COUNT,
  type OpticsReviewResponse,
} from "@/lib/optics-review";
import PracticeIdentityFields from "./PracticeIdentityFields";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";
import usePracticeAttempt from "./usePracticeAttempt";

const kindLabels = {
  "true-false": "Đúng / Sai",
  single: "Chọn 1 đáp án",
  multiple: "Chọn nhiều đáp án",
} as const;

function normalizeStoredResponse(value: unknown): OpticsReviewResponse | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value;
  return null;
}

function getStudentSeed(className: string, studentNumber: string) {
  const classIndex = Number(className.slice(-2)) || 0;
  return classIndex * 100 + Number(studentNumber);
}

export default function OpticsReviewPractice() {
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, OpticsReviewResponse>>({});
  const [checkedQuestionIds, setCheckedQuestionIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notice, setNotice] = useState("");

  const { draftStatus } = useDeviceDraft(
    deviceDraftKey("optics-adaptive-review-v1"),
    { questionIds, responses, checkedQuestionIds, currentIndex },
    (value) => {
      if (!isDraftRecord(value)) return;
      const restoredIds = Array.isArray(value.questionIds)
        ? value.questionIds.filter((id): id is string => typeof id === "string" && Boolean(getOpticsReviewQuestion(id))).slice(0, OPTICS_REVIEW_QUESTION_COUNT)
        : [];
      const restoredResponses: Record<string, OpticsReviewResponse> = {};
      const storedResponses = isDraftRecord(value.responses) ? value.responses : null;
      if (storedResponses) {
        restoredIds.forEach((id) => {
          const response = normalizeStoredResponse(storedResponses[id]);
          if (response !== null) restoredResponses[id] = response;
        });
      }
      const restoredChecked = Array.isArray(value.checkedQuestionIds)
        ? value.checkedQuestionIds.filter((id): id is string => typeof id === "string" && restoredIds.includes(id))
        : [];
      setQuestionIds(restoredIds);
      setResponses(restoredResponses);
      setCheckedQuestionIds(restoredChecked);
      setCurrentIndex(Math.min(Math.max(0, Number(value.currentIndex) || 0), Math.max(0, restoredIds.length - 1)));
    },
  );

  const answerPayload = useMemo(() => ({ questionIds, responses, checkedQuestionIds, currentIndex }), [checkedQuestionIds, currentIndex, questionIds, responses]);
  const attempt = usePracticeAttempt("optics-review", answerPayload, checkedQuestionIds.length);
  const currentQuestion = questionIds[currentIndex] ? getOpticsReviewQuestion(questionIds[currentIndex]) : undefined;
  const currentResponse = currentQuestion ? responses[currentQuestion.id] : undefined;
  const currentChecked = currentQuestion ? checkedQuestionIds.includes(currentQuestion.id) : false;
  const currentCorrect = currentQuestion ? isOpticsReviewAnswerCorrect(currentQuestion, currentResponse) : false;
  const nextDifficulty = getNextOpticsReviewDifficulty(questionIds.filter((id) => checkedQuestionIds.includes(id)), responses);
  const correctCount = checkedQuestionIds.filter((id) => {
    const question = getOpticsReviewQuestion(id);
    return question ? isOpticsReviewAnswerCorrect(question, responses[id]) : false;
  }).length;
  const finished = checkedQuestionIds.length === OPTICS_REVIEW_QUESTION_COUNT;

  function resetPractice() {
    const empty = createEmptyOpticsReviewAnswers();
    setQuestionIds(empty.questionIds);
    setResponses(empty.responses);
    setCheckedQuestionIds(empty.checkedQuestionIds);
    setCurrentIndex(empty.currentIndex);
    setNotice("");
  }

  function startPractice() {
    if (!attempt.identityReady) {
      setNotice("Hãy chọn lớp và STT trước khi bắt đầu.");
      return;
    }
    const first = pickOpticsReviewQuestion(getStudentSeed(attempt.className, attempt.studentNumber), 0, 2, []);
    if (!first) return;
    setQuestionIds([first.id]);
    setCurrentIndex(0);
    setNotice("");
  }

  function updateResponse(value: string) {
    if (!currentQuestion || currentChecked) return;
    setNotice("");
    setResponses((current) => {
      if (currentQuestion.kind !== "multiple") return { ...current, [currentQuestion.id]: value };
      const selected = Array.isArray(current[currentQuestion.id]) ? current[currentQuestion.id] as string[] : [];
      const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
      return { ...current, [currentQuestion.id]: next };
    });
  }

  function checkCurrent() {
    if (!currentQuestion || !isOpticsReviewResponseAnswered(currentResponse)) {
      setNotice(currentQuestion?.kind === "multiple" ? "Hãy chọn ít nhất một đáp án." : "Hãy chọn một đáp án.");
      return;
    }
    setCheckedQuestionIds((current) => current.includes(currentQuestion.id) ? current : [...current, currentQuestion.id]);
    setNotice("");
  }

  function moveForward() {
    if (!currentQuestion || !currentChecked) return;
    if (currentIndex < questionIds.length - 1) {
      setCurrentIndex((index) => index + 1);
      return;
    }
    if (questionIds.length >= OPTICS_REVIEW_QUESTION_COUNT) return;
    const difficulty = getNextOpticsReviewDifficulty(questionIds, responses);
    const next = pickOpticsReviewQuestion(getStudentSeed(attempt.className, attempt.studentNumber), questionIds.length, difficulty, questionIds);
    if (!next) return;
    setQuestionIds((current) => [...current, next.id]);
    setCurrentIndex(questionIds.length);
  }

  function isChoiceSelected(value: string) {
    if (Array.isArray(currentResponse)) return currentResponse.includes(value);
    return currentResponse === value;
  }

  return (
    <div className="lab-card optics-review-card">
      <section className="optics-review-intro">
        <div className="optics-review-heading">
          <span aria-hidden="true">◎</span>
          <div><p className="eyebrow">BÀI TẬP CÁ NHÂN HÓA</p><h2>Ôn tập: Khúc xạ, Phản xạ toàn phần, Lăng kính &amp; Màu sắc</h2><p>Hệ thống tự điều chỉnh độ khó theo từng câu trả lời.</p></div>
        </div>
        <div className="optics-review-overview" aria-label="Cấu trúc bài ôn tập">
          <div><strong>36</strong><span>câu trong ngân hàng</span></div>
          <div><strong>12</strong><span>câu cho mỗi học sinh</span></div>
          <div><strong>3</strong><span>mức độ thích ứng</span></div>
        </div>
        <PracticeIdentityFields practiceKey="optics-review" className={attempt.className} studentNumber={attempt.studentNumber} onClassChange={(value) => { attempt.setClassName(value); resetPractice(); }} onStudentNumberChange={(value) => { attempt.setStudentNumber(value); resetPractice(); }} />
      </section>

      {attempt.locked ? <section className="quiz-submission-notice"><span>✓</span><div><strong>Đã thu bài</strong><p>{attempt.message}</p></div></section> : null}

      {!questionIds.length ? (
        <section className="optics-review-start">
          <div className="adaptive-path" aria-hidden="true"><span>↘</span><i /><span>⌁</span><i /><span>△</span><i /><span>◉</span></div>
          <h3>Sẵn sàng cho lộ trình riêng của em?</h3>
          <p>Bài bắt đầu ở mức Vận dụng. Sau mỗi câu, hệ thống sẽ chọn câu tiếp theo phù hợp hơn.</p>
          <button type="button" className="primary-button" disabled={!attempt.identityReady || attempt.locked || attempt.checking} onClick={startPractice}>Bắt đầu ôn tập →</button>
          {notice ? <p className="form-message error" role="alert">{notice}</p> : null}
        </section>
      ) : currentQuestion ? (
        <section className="optics-review-workspace">
          <header className="adaptive-progress-header">
            <div><p className="eyebrow">TIẾN ĐỘ CÁ NHÂN</p><strong>{checkedQuestionIds.length}/{OPTICS_REVIEW_QUESTION_COUNT}</strong></div>
            <div className="adaptive-progress-bar"><i style={{ width: `${(checkedQuestionIds.length / OPTICS_REVIEW_QUESTION_COUNT) * 100}%` }} /></div>
            <div className={`difficulty-chip level-${currentQuestion.difficulty}`}><small>Câu hiện tại</small><strong>{opticsReviewLevels[currentQuestion.difficulty].shortLabel}</strong></div>
          </header>

          <div className="adaptive-step-strip" aria-label="Các câu đã mở">
            {Array.from({ length: OPTICS_REVIEW_QUESTION_COUNT }, (_, index) => {
              const id = questionIds[index];
              const checked = Boolean(id && checkedQuestionIds.includes(id));
              return <button key={index} type="button" disabled={!id} className={`${currentIndex === index ? "active" : ""} ${checked ? "done" : ""}`} aria-current={currentIndex === index ? "step" : undefined} aria-label={`Câu ${index + 1}${checked ? " đã trả lời" : ""}`} onClick={() => id && setCurrentIndex(index)}>{checked ? "✓" : index + 1}</button>;
            })}
          </div>

          <article className={`adaptive-question level-${currentQuestion.difficulty}`}>
            <div className="adaptive-question-meta">
              <span className="topic-chip"><b aria-hidden="true">{opticsReviewTopics[currentQuestion.topic].symbol}</b>{opticsReviewTopics[currentQuestion.topic].label}</span>
              <span className="question-kind-chip">{kindLabels[currentQuestion.kind]}</span>
            </div>
            <p className="adaptive-question-number">Câu {currentIndex + 1}</p>
            {currentQuestion.context ? <div className="question-context">{currentQuestion.context}</div> : null}
            <h3>{currentQuestion.prompt}</h3>
            {currentQuestion.kind === "multiple" ? <p className="selection-instruction">Có thể có nhiều đáp án đúng.</p> : null}
            <div className={`adaptive-choice-grid ${currentQuestion.kind === "true-false" ? "true-false" : ""}`}>
              {currentQuestion.choices.map((choice, index) => {
                const selected = isChoiceSelected(choice.value);
                const isAnswer = currentQuestion.answers.includes(choice.value);
                const resultClass = currentChecked ? isAnswer ? "correct" : selected ? "incorrect" : "" : "";
                return <button key={choice.value} type="button" disabled={currentChecked || attempt.locked} aria-pressed={selected} className={`${selected ? "selected" : ""} ${resultClass}`} onClick={() => updateResponse(choice.value)}><b>{currentQuestion.kind === "true-false" ? choice.value === "true" ? "Đ" : "S" : String.fromCharCode(65 + index)}</b><span>{choice.label}</span>{currentQuestion.kind === "multiple" ? <i aria-hidden="true">{selected ? "✓" : ""}</i> : null}</button>;
              })}
            </div>

            {currentChecked ? <div className={`adaptive-feedback ${currentCorrect ? "correct" : "incorrect"}`} role="status"><span>{currentCorrect ? "✓" : "↺"}</span><div><strong>{currentCorrect ? "Chính xác" : "Cùng củng cố lại"}</strong><p>{currentQuestion.explanation}</p></div></div> : null}
            {notice ? <p className="form-message error" role="alert">{notice}</p> : null}

            <div className="adaptive-question-actions">
              <button type="button" className="secondary-button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}>← Câu trước</button>
              {!currentChecked ? <button type="button" className="primary-button" disabled={attempt.locked} onClick={checkCurrent}>Kiểm tra câu</button> : !finished || currentIndex < questionIds.length - 1 ? <button type="button" className="primary-button" onClick={moveForward}>{currentIndex < questionIds.length - 1 ? "Câu tiếp theo →" : `Tiếp tục mức ${opticsReviewLevels[nextDifficulty].shortLabel} →`}</button> : null}
            </div>
          </article>
        </section>
      ) : null}

      {finished ? <section className="adaptive-finish">
        <span aria-hidden="true">✦</span>
        <div><p className="eyebrow">HOÀN THÀNH LỘ TRÌNH</p><h3>{correctCount}/12 câu chính xác</h3><p>Bài làm đã sẵn sàng để gửi cho giáo viên.</p></div>
        <button type="button" className="primary-button" disabled={!attempt.identityReady || attempt.locked || attempt.checking || attempt.submitting} onClick={() => void attempt.submit()}>{attempt.submitting ? "Đang nộp…" : attempt.locked ? "Đã nộp ✓" : "Nộp bài →"}</button>
      </section> : null}

      {attempt.releasedResult ? <section className={`quiz-result ${attempt.releasedResult.bonusPoint ? "bonus-earned" : "bonus-missed"}`}><div className="quiz-score"><span>Kết quả</span><strong>{attempt.releasedResult.bonusPoint ? `+${attempt.releasedResult.bonusPoint}` : "—"}</strong><b>điểm cộng</b></div><div><h4>{attempt.releasedResult.bonusPoint ? `Em nhận +${attempt.releasedResult.bonusPoint} điểm cộng.` : "Kết quả đã được công bố."}</h4><p>Đúng {attempt.releasedResult.correctCount}/{attempt.releasedResult.totalItems} câu.</p></div></section> : null}

      <div className="practice-actions optics-review-footer">
        <span className="draft-status">{attempt.saving ? "Đang đồng bộ bài làm…" : draftStatus}</span>
        {attempt.message && !attempt.locked ? <span className={`form-message ${attempt.messageType}`}>{attempt.message}</span> : null}
        <button type="button" className="secondary-button" disabled={attempt.locked || !questionIds.length} onClick={resetPractice}>Làm lại lộ trình</button>
      </div>
    </div>
  );
}
