"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import {
  countHk1Answered,
  createEmptyHk1ReviewAnswers,
  hk1ChoiceLetters,
  HK1_REVIEW_QUESTION_COUNT,
  normalizeHk1ReviewAnswers,
  type Hk1Choice,
  type Hk1ChoiceLetter,
  type Hk1ReviewAnswers,
} from "@/lib/hk1-review";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";
import PracticeIdentityFields from "./PracticeIdentityFields";
import usePracticeAttempt from "./usePracticeAttempt";

const BLOCK_SIZE = 7;
const blocks = Array.from({ length: HK1_REVIEW_QUESTION_COUNT / BLOCK_SIZE }, (_, block) =>
  Array.from({ length: BLOCK_SIZE }, (_, offset) => block * BLOCK_SIZE + offset));

const keyToLetter: Record<string, Hk1ChoiceLetter> = { a: "A", b: "B", c: "C", d: "D", "1": "A", "2": "B", "3": "C", "4": "D" };

export default function Hk1ReviewSheet() {
  const [answers, setAnswers] = useState<Hk1ReviewAnswers>(createEmptyHk1ReviewAnswers);
  const [confirming, setConfirming] = useState(false);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const { draftStatus } = useDeviceDraft(deviceDraftKey("hk1-review"), { answers }, (value) => {
    if (isDraftRecord(value)) setAnswers(normalizeHk1ReviewAnswers(value.answers));
  });
  const answered = countHk1Answered(answers);
  const attempt = usePracticeAttempt("hk1-review", answers, answered);
  const canEdit = attempt.identityReady && !attempt.locked && !attempt.checking && !attempt.submitting;
  const blanks = answers.choices.flatMap((choice, index) => (choice ? [] : [index + 1]));

  function setChoice(index: number, choice: Hk1Choice) {
    if (!canEdit) return;
    setConfirming(false);
    setAnswers((current) => {
      const choices = [...current.choices];
      choices[index] = choice;
      return { choices };
    });
  }

  function focusRow(index: number) {
    const row = rowRefs.current[Math.max(0, Math.min(HK1_REVIEW_QUESTION_COUNT - 1, index))];
    row?.focus();
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function handleRowKey(event: KeyboardEvent<HTMLDivElement>, index: number) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const letter = keyToLetter[event.key.toLowerCase()];
    if (letter) {
      event.preventDefault();
      setChoice(index, letter);
      if (canEdit) focusRow(index + 1);
    } else if (event.key === "ArrowDown" || event.key === "Enter") {
      event.preventDefault();
      focusRow(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusRow(index - 1);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      setChoice(index, "");
    }
  }

  function clearAll() {
    if (!canEdit || !answered) return;
    if (!window.confirm("Xóa toàn bộ đáp án đã tô?")) return;
    setAnswers(createEmptyHk1ReviewAnswers());
    setConfirming(false);
  }

  const released = attempt.releasedResult;

  return (
    <div className="hk1-sheet">
      <div className="hk1-intro">
        <div>
          <p className="eyebrow">CÁ NHÂN · ÔN THI HỌC KÌ 1</p>
          <h3>Phiếu trả lời trắc nghiệm</h3>
          <p>Em làm bài trên đề giấy, rồi chỉ cần tô chữ cái A, B, C hoặc D cho từng câu ở đây.</p>
        </div>
        <div className="hk1-progress" aria-label={`Đã tô ${answered} trên ${HK1_REVIEW_QUESTION_COUNT} câu`}>
          <strong>{answered}<small>/{HK1_REVIEW_QUESTION_COUNT}</small></strong>
          <span>câu đã tô</span>
          <i><b style={{ width: `${(answered / HK1_REVIEW_QUESTION_COUNT) * 100}%` }} /></i>
        </div>
      </div>

      <PracticeIdentityFields practiceKey="hk1-review" className={attempt.className} studentNumber={attempt.studentNumber} onClassChange={attempt.setClassName} onStudentNumberChange={attempt.setStudentNumber} />

      {!attempt.identityReady ? <p className="hk1-hint">① Chọn <b>Lớp</b> và <b>STT</b> của em → ② phiếu trả lời sẽ mở để tô đáp án.</p> : null}
      {attempt.checking ? <p className="hk1-hint">Đang kiểm tra bài làm của em…</p> : null}

      {attempt.locked && !released ? (
        <div className="quiz-submission-notice" aria-live="polite"><span>✓</span><div><strong>Đã thu bài</strong><p>{attempt.message} Cô sẽ chữa bài trên lớp.</p></div></div>
      ) : null}

      {released ? (
        <div className="hk1-result" aria-live="polite">
          <div><span>Kết quả</span><strong>{released.correctCount}<small>/{released.totalItems}</small></strong><b>câu đúng</b></div>
          <p>{released.correctCount >= 25 ? "Rất tốt! Em nắm chắc kiến thức chương Điện." : released.correctCount >= 18 ? "Khá tốt. Em xem lại những câu sai khi cô chữa bài nhé." : "Em cần ôn lại kĩ. Hãy ghi chú những câu cô chữa trên lớp."}</p>
        </div>
      ) : null}

      <fieldset className={`hk1-answer-sheet ${canEdit ? "" : "is-locked"}`} disabled={!canEdit} aria-label="Phiếu trả lời 28 câu">
        {blocks.map((indexes) => (
          <div key={indexes[0]} className="hk1-block">
            <div className="hk1-block-head"><span>Câu {indexes[0] + 1} – {indexes[indexes.length - 1] + 1}</span></div>
            {indexes.map((index) => {
              const choice = answers.choices[index];
              return (
                <div
                  key={index}
                  ref={(element) => { rowRefs.current[index] = element; }}
                  className={`hk1-row ${choice ? "answered" : ""}`}
                  role="radiogroup"
                  aria-label={`Câu ${index + 1}`}
                  tabIndex={0}
                  onKeyDown={(event) => handleRowKey(event, index)}
                >
                  <span className="hk1-row-number">{index + 1}</span>
                  {hk1ChoiceLetters.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      role="radio"
                      tabIndex={-1}
                      aria-checked={choice === letter}
                      aria-label={`Câu ${index + 1}: ${letter}`}
                      className={`hk1-bubble ${choice === letter ? "selected" : ""}`}
                      onClick={() => setChoice(index, choice === letter ? "" : letter)}
                    >{letter}</button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </fieldset>

      <p className="hk1-keyboard-tip"><b>Mẹo trên máy tính:</b> bấm vào một câu rồi gõ <kbd>A</kbd> <kbd>B</kbd> <kbd>C</kbd> <kbd>D</kbd> để tô, phiếu tự chuyển sang câu tiếp theo · <kbd>↑</kbd> <kbd>↓</kbd> di chuyển · <kbd>Delete</kbd> xóa.</p>

      <section className="hk1-review-strip" aria-label="Rà soát phiếu trả lời">
        <div className="hk1-review-strip-head">
          <strong>Rà soát trước khi nộp</strong>
          <span className={blanks.length ? "missing" : "done"}>{blanks.length ? `Còn trống ${blanks.length} câu: ${blanks.join(", ")}` : "✓ Đã tô đủ 28 câu"}</span>
        </div>
        <div className="hk1-review-cells">
          {answers.choices.map((choice, index) => (
            <button key={index} type="button" className={choice ? "filled" : "blank"} onClick={() => focusRow(index)} aria-label={`Câu ${index + 1}: ${choice || "chưa tô"}`}>
              <small>{index + 1}</small><b>{choice || "–"}</b>
            </button>
          ))}
        </div>
      </section>

      {confirming && canEdit ? (
        <div className="hk1-confirm" role="alertdialog" aria-label="Xác nhận nộp bài">
          <p><strong>Em đã dò lại phiếu chưa?</strong> Sau khi nộp, em không sửa được đáp án nữa.</p>
          <div>
            <button type="button" className="secondary-button" onClick={() => setConfirming(false)}>Dò lại</button>
            <button type="button" className="primary-button" onClick={() => { setConfirming(false); void attempt.submit(); }}>Nộp bài ngay</button>
          </div>
        </div>
      ) : null}

      <div className="quiz-actions">
        <span className="draft-status">{attempt.saving ? "Đang đồng bộ bài làm…" : draftStatus}</span>
        {attempt.message && !attempt.locked ? <span className={`form-message ${attempt.messageType}`} role={attempt.messageType === "error" ? "alert" : "status"}>{attempt.message}</span> : null}
        <button type="button" className="secondary-button" disabled={!canEdit || !answered} onClick={clearAll}>Xóa hết</button>
        <button
          type="button"
          className="primary-button"
          disabled={!canEdit || answered < HK1_REVIEW_QUESTION_COUNT || confirming}
          onClick={() => setConfirming(true)}
        >{attempt.submitting ? "Đang nộp…" : attempt.locked ? "Đã nộp ✓" : answered < HK1_REVIEW_QUESTION_COUNT ? `Tô đủ 28 câu để nộp (${answered}/28)` : "Nộp bài →"}</button>
      </div>
    </div>
  );
}
