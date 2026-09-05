"use client";

import { useState } from "react";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";
import PracticeIdentityFields from "./PracticeIdentityFields";
import usePracticeAttempt from "./usePracticeAttempt";

type BoxConclusion = "consistent" | "resistance-doubles" | "current-constant" | "";

const boxConclusionChoices: Array<{ id: Exclude<BoxConclusion, "">; text: string }> = [
  { id: "consistent", text: "Hai phép đo phù hợp với cùng một điện trở." },
  { id: "resistance-doubles", text: "Điện trở tăng gấp đôi khi U tăng gấp đôi." },
  { id: "current-constant", text: "Cường độ dòng điện không phụ thuộc vào U." },
];

const safeSourceChoices = ["3", "6", "9"];

function isBoxConclusion(value: unknown): value is BoxConclusion {
  return value === "consistent" || value === "resistance-doubles" || value === "current-constant" || value === "";
}

function parseDecimal(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function approximately(value: string, expected: number) {
  const parsed = parseDecimal(value);
  return parsed !== null && Math.abs(parsed - expected) < 0.001;
}

export default function OhmsLawPractice() {
  const [boxResistanceAnswer, setBoxResistanceAnswer] = useState("");
  const [boxCurrentAnswer, setBoxCurrentAnswer] = useState("");
  const [boxConclusion, setBoxConclusion] = useState<BoxConclusion>("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [voltageAnswer, setVoltageAnswer] = useState("");
  const [resistanceAnswer, setResistanceAnswer] = useState("");
  const [safeSource, setSafeSource] = useState("");
  const [checked, setChecked] = useState(false);
  const { draftStatus } = useDeviceDraft(deviceDraftKey("ohm-law-practice-v2"), { boxResistanceAnswer, boxCurrentAnswer, boxConclusion, currentAnswer, voltageAnswer, resistanceAnswer, safeSource }, (value) => {
    if (!isDraftRecord(value)) return;
    if (typeof value.boxResistanceAnswer === "string") setBoxResistanceAnswer(value.boxResistanceAnswer);
    if (typeof value.boxCurrentAnswer === "string") setBoxCurrentAnswer(value.boxCurrentAnswer);
    if (isBoxConclusion(value.boxConclusion)) setBoxConclusion(value.boxConclusion);
    if (typeof value.currentAnswer === "string") setCurrentAnswer(value.currentAnswer);
    if (typeof value.voltageAnswer === "string") setVoltageAnswer(value.voltageAnswer);
    if (typeof value.resistanceAnswer === "string") setResistanceAnswer(value.resistanceAnswer);
    if (typeof value.safeSource === "string") setSafeSource(value.safeSource);
  });

  const completedCount = Number(Boolean(boxResistanceAnswer.trim()))
    + Number(Boolean(boxCurrentAnswer.trim()))
    + Number(Boolean(boxConclusion))
    + Number(Boolean(currentAnswer.trim()))
    + Number(Boolean(voltageAnswer.trim()))
    + Number(Boolean(resistanceAnswer.trim()))
    + Number(Boolean(safeSource));
  const score = Number(approximately(boxResistanceAnswer, 20))
    + Number(approximately(boxCurrentAnswer, 0.45))
    + Number(boxConclusion === "consistent")
    + Number(approximately(currentAnswer, 0.3))
    + Number(approximately(voltageAnswer, 6))
    + Number(approximately(resistanceAnswer, 30))
    + Number(safeSource === "6");
  const attempt = usePracticeAttempt(
    "ohm-law-practice",
    { boxResistanceAnswer, boxCurrentAnswer, boxConclusion, currentAnswer, voltageAnswer, resistanceAnswer, safeSource },
    completedCount,
  );

  function updateNumber(setter: (value: string) => void, value: string) {
    setter(value);
    setChecked(false);
  }

  function resetPractice() {
    setBoxResistanceAnswer("");
    setBoxCurrentAnswer("");
    setBoxConclusion("");
    setCurrentAnswer("");
    setVoltageAnswer("");
    setResistanceAnswer("");
    setSafeSource("");
    setChecked(false);
  }

  const resultClass = (correct: boolean) => checked ? correct ? "practice-correct" : "practice-incorrect" : "";

  return (
    <div className="electric-practice ohms-law-practice">
      <div className="practice-intro ohm-law-intro">
        <div><p className="eyebrow">ĐỊNH LUẬT OHM</p><h3>Thử thách suy luận điện học</h3><p>Giải mã số liệu, tính ba đại lượng và chọn nguồn điện an toàn.</p></div>
        <strong>{completedCount}/7</strong>
      </div>

      <PracticeIdentityFields practiceKey="ohm-law-practice" className={attempt.className} studentNumber={attempt.studentNumber} onClassChange={attempt.setClassName} onStudentNumberChange={attempt.setStudentNumber} />
      {attempt.locked ? <div className="quiz-submission-notice"><span>✓</span><div><strong>Đã thu bài</strong><p>{attempt.message}</p></div></div> : null}

      <fieldset className="practice-grid practice-question-fieldset" disabled={attempt.locked || attempt.checking || attempt.submitting}>
        <article className="practice-card practice-card-wide">
          <div className="practice-card-heading"><span>01</span><div><h4>Giải mã hộp đen X</h4><p>Dùng hai phép đo để xác định đặc điểm của dây dẫn.</p></div></div>
          <div className="ohm-evidence-layout">
            <div className="ohm-mystery-device" aria-label="Dây dẫn X chưa biết điện trở"><b>X</b><strong>Dây dẫn chưa biết</strong><span>Nhiệt độ không đổi</span></div>
            <div className="ohm-evidence-table" role="table" aria-label="Hai phép đo trên dây dẫn X">
              <div role="row"><strong role="columnheader">Lần đo</strong><strong role="columnheader">U (V)</strong><strong role="columnheader">I (A)</strong></div>
              <div role="row"><span role="cell">1</span><span role="cell">3,0</span><span role="cell">0,15</span></div>
              <div role="row"><span role="cell">2</span><span role="cell">6,0</span><span role="cell">0,30</span></div>
            </div>
          </div>
          <div className="ohm-unlock-grid">
            <label>Điện trở của X<div><input inputMode="decimal" aria-label="Điện trở của dây dẫn X" value={boxResistanceAnswer} className={resultClass(approximately(boxResistanceAnswer, 20))} onChange={(event) => updateNumber(setBoxResistanceAnswer, event.target.value)} placeholder="0,00" /><span>Ω</span></div></label>
            <label>Nếu U = 9 V, dự đoán I<div><input inputMode="decimal" aria-label="Cường độ dòng điện dự đoán khi U bằng 9 V" value={boxCurrentAnswer} className={resultClass(approximately(boxCurrentAnswer, 0.45))} onChange={(event) => updateNumber(setBoxCurrentAnswer, event.target.value)} placeholder="0,00" /><span>A</span></div></label>
          </div>
          <p>Nhận định phù hợp nhất:</p>
          <div className="practice-options practice-options-horizontal">{boxConclusionChoices.map((choice) => <button key={choice.id} type="button" className={`${boxConclusion === choice.id ? "selected" : ""} ${boxConclusion === choice.id ? resultClass(choice.id === "consistent") : ""}`} onClick={() => { setBoxConclusion(choice.id); setChecked(false); }}>{choice.text}</button>)}</div>
        </article>

        <article className="practice-card practice-calculation-card">
          <div className="practice-card-heading"><span>02</span><div><h4>Tìm cường độ dòng điện</h4><p>Nhập số thập phân, không cần ghi đơn vị.</p></div></div>
          <p>U = 6 V, R = 20 Ω. Tính I.</p>
          <label>Đáp số<div><input inputMode="decimal" value={currentAnswer} className={resultClass(approximately(currentAnswer, 0.3))} onChange={(event) => updateNumber(setCurrentAnswer, event.target.value)} placeholder="0,00" /><span>A</span></div></label>
        </article>

        <article className="practice-card practice-calculation-card">
          <div className="practice-card-heading"><span>03</span><div><h4>Tìm hiệu điện thế</h4><p>Nhập số, không cần ghi đơn vị.</p></div></div>
          <p>I = 0,25 A, R = 24 Ω. Tính U.</p>
          <label>Đáp số<div><input inputMode="decimal" value={voltageAnswer} className={resultClass(approximately(voltageAnswer, 6))} onChange={(event) => updateNumber(setVoltageAnswer, event.target.value)} placeholder="0,00" /><span>V</span></div></label>
        </article>

        <article className="practice-card practice-calculation-card">
          <div className="practice-card-heading"><span>04</span><div><h4>Tìm điện trở</h4><p>Nhập số, không cần ghi đơn vị.</p></div></div>
          <p>U = 12 V, I = 0,40 A. Tính R.</p>
          <label>Đáp số<div><input inputMode="decimal" value={resistanceAnswer} className={resultClass(approximately(resistanceAnswer, 30))} onChange={(event) => updateNumber(setResistanceAnswer, event.target.value)} placeholder="0,00" /><span>Ω</span></div></label>
        </article>

        <article className="practice-card practice-safety-card">
          <div className="practice-card-heading"><span>05</span><div><h4>Chọn nguồn trong giới hạn</h4><p>Tìm nguồn điện lớn nhất vẫn bảo đảm phép đo an toàn.</p></div></div>
          <p>Một dây dẫn có R = 24 Ω. Ampe kế chỉ đo an toàn khi I ≤ 0,25 A. Chọn nguồn có hiệu điện thế lớn nhất có thể sử dụng.</p>
          <div className="safety-constraint" aria-label="Giới hạn của mạch"><span><small>Dây dẫn</small><b>R = 24 Ω</b></span><span><small>Giới hạn</small><b>I ≤ 0,25 A</b></span></div>
          <div className="practice-options practice-options-horizontal">{safeSourceChoices.map((voltage) => <button key={voltage} type="button" className={`${safeSource === voltage ? "selected" : ""} ${safeSource === voltage ? resultClass(voltage === "6") : ""}`} onClick={() => { setSafeSource(voltage); setChecked(false); }}>Nguồn {voltage} V</button>)}</div>
        </article>
      </fieldset>

      {attempt.releasedResult ? <div className={`quiz-result ${attempt.releasedResult.bonusPoint ? "bonus-earned" : "bonus-missed"}`}><div className="quiz-score"><span>Kết quả</span><strong>{attempt.releasedResult.bonusPoint ? `+${attempt.releasedResult.bonusPoint}` : "—"}</strong><b>điểm cộng</b></div><div><h4>{attempt.releasedResult.bonusPoint ? `Em nhận +${attempt.releasedResult.bonusPoint} điểm cộng.` : "Em chưa đạt điểm cộng lần này."}</h4><p>Đúng {attempt.releasedResult.correctCount}/{attempt.releasedResult.totalItems} ý.</p></div></div> : null}

      <div className="practice-actions">
        <span className="draft-status">{attempt.saving ? "Đang đồng bộ bài làm…" : draftStatus}</span>
        {attempt.message && !attempt.locked ? <span className={`form-message ${attempt.messageType}`}>{attempt.message}</span> : null}
        {checked && <p className={score === 7 ? "correct" : "incorrect"} aria-live="polite">{score === 7 ? "Hoàn thành xuất sắc: 7/7!" : `Đúng ${score}/7. Hãy sửa các mục màu cam rồi kiểm tra lại.`}</p>}
        <button type="button" className="secondary-button" disabled={attempt.locked} onClick={resetPractice}>Làm lại</button>
        <button type="button" className="secondary-button" disabled={completedCount < 7 || attempt.locked} onClick={() => setChecked(true)}>Kiểm tra</button>
        <button type="button" className="primary-button" disabled={completedCount < 7 || !attempt.identityReady || attempt.locked || attempt.checking || attempt.submitting} onClick={() => void attempt.submit()}>{attempt.submitting ? "Đang nộp…" : attempt.locked ? "Đã nộp ✓" : "Nộp bài →"}</button>
      </div>
    </div>
  );
}
