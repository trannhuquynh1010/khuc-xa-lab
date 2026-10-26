"use client";

import { useCallback, useEffect, useState } from "react";
import { formatStudentNumber } from "@/lib/classes";
import {
  OHM_LAW_BONUS_MIN_CORRECT,
  OHM_LAW_BONUS_POINT,
  OHM_LAW_BONUS_SLOTS,
  OHM_LAW_TOTAL_ITEMS,
  ohmLawItemLabels,
  type OhmLawItemId,
  type OhmLawResult,
} from "@/lib/ohm-law-practice";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";
import PracticeIdentityFields from "./PracticeIdentityFields";
import usePracticeAttempt from "./usePracticeAttempt";

type BoxConclusion = "consistent" | "resistance-doubles" | "current-constant" | "";

// Chỉ còn nội dung phương án: đáp án nằm ở phía máy chủ vì bài này không có
// bước tự kiểm tra trước khi nộp.
const boxConclusionChoices: Array<{ id: Exclude<BoxConclusion, "">; text: string }> = [
  { id: "consistent", text: "Điện trở của dây dẫn không phụ thuộc vào hiệu điện thế đặt vào nó." },
  { id: "resistance-doubles", text: "Điện trở tăng gấp đôi khi U tăng gấp đôi." },
  { id: "current-constant", text: "Cường độ dòng điện không phụ thuộc vào U." },
];

const safeSourceChoices = ["3", "6", "9"];

function isBoxConclusion(value: unknown): value is BoxConclusion {
  return value === "consistent" || value === "resistance-doubles" || value === "current-constant" || value === "";
}

export default function OhmsLawPractice() {
  const [boxResistanceAnswer, setBoxResistanceAnswer] = useState("");
  const [boxCurrentAnswer, setBoxCurrentAnswer] = useState("");
  const [boxConclusion, setBoxConclusion] = useState<BoxConclusion>("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [voltageAnswer, setVoltageAnswer] = useState("");
  const [resistanceAnswer, setResistanceAnswer] = useState("");
  const [safeSource, setSafeSource] = useState("");
  // Gắn kết quả với đúng lớp + STT đã tải, để khi đổi STT không hiện lại kết
  // quả của bạn trước đó.
  const [result, setResult] = useState<{ identity: string; data: OhmLawResult } | null>(null);

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
  const attempt = usePracticeAttempt(
    "ohm-law-practice",
    { boxResistanceAnswer, boxCurrentAnswer, boxConclusion, currentAnswer, voltageAnswer, resistanceAnswer, safeSource },
    completedCount,
  );
  const identityKey = `${attempt.className}:${attempt.studentNumber}`;

  // Kết quả, điểm cộng và lời giải thích chỉ có sau khi em đã nộp bài.
  const loadResult = useCallback(async () => {
    if (!attempt.identityReady) return;
    const identity = `${attempt.className}:${attempt.studentNumber}`;
    const params = new URLSearchParams({ className: attempt.className, studentNumber: attempt.studentNumber });
    try {
      const response = await fetch(`/api/ohm-law-practice?${params}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as OhmLawResult;
      if (data.submitted) setResult({ identity, data });
    } catch {
      /* giữ nguyên trạng thái khi mạng lỗi tạm thời */
    }
  }, [attempt.className, attempt.identityReady, attempt.studentNumber]);

  // Sau khi nộp thì hỏi lại định kì, để khi cô bấm "Công bố" thì kết quả và
  // lời giải tự hiện ra mà em không phải tải lại trang.
  useEffect(() => {
    if (!attempt.locked) return;
    const timer = window.setTimeout(() => void loadResult(), 0);
    const interval = window.setInterval(() => void loadResult(), 5000);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); };
  }, [attempt.locked, loadResult]);

  function resetPractice() {
    setBoxResistanceAnswer("");
    setBoxCurrentAnswer("");
    setBoxConclusion("");
    setCurrentAnswer("");
    setVoltageAnswer("");
    setResistanceAnswer("");
    setSafeSource("");
  }

  async function submitPractice() {
    if (!window.confirm(`Nộp bài với ${completedCount}/${OHM_LAW_TOTAL_ITEMS} ý đã làm? Em chỉ nộp được một lần, nên hãy kiểm tra lại cho chắc chắn trước khi nộp.`)) return;
    await attempt.submit();
    await loadResult();
  }

  // Chỉ hiện kết quả khi em đã nộp, kết quả đúng là của em, và cô đã công bố.
  const ownResult = attempt.locked && result?.identity === identityKey ? result.data : null;
  const shownResult = ownResult?.released ? ownResult : null;
  const wrongItems = shownResult?.items.filter((item) => !item.correct) ?? [];
  const perfect = shownResult !== null && shownResult.correctCount >= shownResult.totalItems;
  const eligible = shownResult !== null && shownResult.correctCount >= OHM_LAW_BONUS_MIN_CORRECT;
  const reviewById = new Map((shownResult?.items ?? []).map((item) => [item.id, item]));

  /** Tô xanh ý đúng, tô đỏ ý sai; trước khi nộp thì không tô gì. */
  function mark(id: OhmLawItemId) {
    const item = reviewById.get(id);
    return item ? (item.correct ? "practice-correct" : "practice-incorrect") : "";
  }

  /** Đánh dấu một phương án trong nhóm lựa chọn sau khi đã nộp. */
  function markChoice(id: OhmLawItemId, value: string, chosen: boolean) {
    const item = reviewById.get(id);
    if (!item) return chosen ? "selected" : "";
    const classes = [chosen ? "selected" : ""];
    if (value === item.correctValue) classes.push("practice-correct");
    else if (chosen) classes.push("practice-incorrect");
    return classes.filter(Boolean).join(" ");
  }

  /** Giải thích hiện ngay dưới ý làm sai, giữ nguyên bố cục bài làm. */
  function itemFeedback(id: OhmLawItemId) {
    const item = reviewById.get(id);
    if (!item || item.correct) return null;
    return (
      <div className="cv-item-feedback" key={`feedback-${id}`}>
        <p className="cv-item-where">{ohmLawItemLabels[id].label}</p>
        <p className="cv-item-answer">Em trả lời <s>{item.response}</s> · Đáp án đúng: <b>{item.correctAnswer}</b></p>
        <p><b>Vì sao:</b> {item.explanation}</p>
        <p><b>Cách làm lại:</b> {item.hint}</p>
      </div>
    );
  }

  return (
    <div className="electric-practice ohms-law-practice">
      <div className="practice-intro ohm-law-intro">
        <div>
          <p className="eyebrow">ĐỊNH LUẬT OHM</p>
          <h3>Thử thách suy luận điện học</h3>
          <p>Giải mã số liệu, tính ba đại lượng và chọn nguồn điện an toàn. Em tự kiểm tra lại rồi mới nộp, vì mỗi bạn chỉ nộp một lần. Lớp có {OHM_LAW_BONUS_SLOTS} suất +{OHM_LAW_BONUS_POINT} điểm cộng, dành cho những bạn nộp sớm nhất mà làm đúng từ {OHM_LAW_BONUS_MIN_CORRECT}/{OHM_LAW_TOTAL_ITEMS} ý trở lên.</p>
        </div>
        <strong>{completedCount}/{OHM_LAW_TOTAL_ITEMS}</strong>
      </div>

      <PracticeIdentityFields practiceKey="ohm-law-practice" className={attempt.className} studentNumber={attempt.studentNumber} onClassChange={attempt.setClassName} onStudentNumberChange={attempt.setStudentNumber} />

      {shownResult ? (
        <section className="cv-result" aria-live="polite">
          <div className={`cv-result-head ${shownResult.bonusPoint > 0 ? "earned" : eligible ? "missed-slot" : "no-bonus"}`}>
            <span aria-hidden="true">{shownResult.bonusPoint > 0 ? "★" : perfect ? "✓" : "↺"}</span>
            <div>
              <p className="eyebrow">ĐÃ NỘP BÀI</p>
              <h4>
                {shownResult.bonusPoint > 0
                  ? `Em được +${shownResult.bonusPoint} điểm cộng`
                  : perfect
                    ? `Em làm đúng cả ${shownResult.totalItems} ý`
                    : `Em làm đúng ${shownResult.correctCount}/${shownResult.totalItems} ý`}
              </h4>
              <p>
                {shownResult.bonusPoint > 0
                  ? `${attempt.className} · STT ${formatStudentNumber(Number(attempt.studentNumber))} · em là bạn thứ ${shownResult.rank} của lớp đạt mức xét điểm cộng.`
                  : eligible
                    ? `Rất tiếc, ${shownResult.bonusSlots} suất điểm cộng của lớp đã có bạn nhận trước. Kết quả của em vẫn được ghi nhận đầy đủ.`
                    : `Chưa đạt điểm cộng lần này. Điểm cộng dành cho những bạn nộp sớm nhất mà làm đúng từ ${OHM_LAW_BONUS_MIN_CORRECT}/${shownResult.totalItems} ý trở lên.`}
              </p>
            </div>
            <b>{shownResult.correctCount}/{shownResult.totalItems}</b>
          </div>
          {wrongItems.length ? (
            <p className="cv-result-guide">Bài làm của em vẫn ở bên dưới. Những ý làm sai được <b className="cv-red">tô đỏ</b> ngay tại chỗ, kèm đáp án đúng và lời giải thích.</p>
          ) : (
            <p className="cv-result-allright">Em làm đúng toàn bộ các ý. Hãy giữ cách làm cẩn thận này cho những bài sau.</p>
          )}
        </section>
      ) : attempt.locked ? (
        <div className="quiz-submission-notice"><span>✓</span><div><strong>Đã nộp bài</strong><p>Bài của em đã được ghi nhận. Kết quả, điểm cộng và lời giải sẽ hiện ngay tại đây khi cô công bố cho cả lớp.</p></div></div>
      ) : null}

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
            <label>Điện trở của X<div><input inputMode="decimal" aria-label="Điện trở của dây dẫn X" className={mark("boxResistanceAnswer")} value={boxResistanceAnswer} onChange={(event) => setBoxResistanceAnswer(event.target.value)} placeholder="0,00" /><span>Ω</span></div></label>
            <label>Nếu U = 9 V, tính I<div><input inputMode="decimal" aria-label="Cường độ dòng điện khi U bằng 9 V" className={mark("boxCurrentAnswer")} value={boxCurrentAnswer} onChange={(event) => setBoxCurrentAnswer(event.target.value)} placeholder="0,00" /><span>A</span></div></label>
          </div>
          {itemFeedback("boxResistanceAnswer")}
          {itemFeedback("boxCurrentAnswer")}
          <p>Nhận định phù hợp nhất:</p>
          <div className="practice-options practice-options-horizontal">{boxConclusionChoices.map((choice) => <button key={choice.id} type="button" className={markChoice("boxConclusion", choice.id, boxConclusion === choice.id)} onClick={() => setBoxConclusion(choice.id)}>{choice.text}</button>)}</div>
          {itemFeedback("boxConclusion")}
        </article>

        <article className="practice-card practice-calculation-card">
          <div className="practice-card-heading"><span>02</span><div><h4>Tìm cường độ dòng điện</h4><p>Nhập số thập phân, không cần ghi đơn vị.</p></div></div>
          <p>U = 6 V, R = 20 Ω. Tính I.</p>
          <label>Đáp số<div><input inputMode="decimal" className={mark("currentAnswer")} value={currentAnswer} onChange={(event) => setCurrentAnswer(event.target.value)} placeholder="0,00" /><span>A</span></div></label>
          {itemFeedback("currentAnswer")}
        </article>

        <article className="practice-card practice-calculation-card">
          <div className="practice-card-heading"><span>03</span><div><h4>Tìm hiệu điện thế</h4><p>Nhập số, không cần ghi đơn vị.</p></div></div>
          <p>I = 0,25 A, R = 24 Ω. Tính U.</p>
          <label>Đáp số<div><input inputMode="decimal" className={mark("voltageAnswer")} value={voltageAnswer} onChange={(event) => setVoltageAnswer(event.target.value)} placeholder="0,00" /><span>V</span></div></label>
          {itemFeedback("voltageAnswer")}
        </article>

        <article className="practice-card practice-calculation-card">
          <div className="practice-card-heading"><span>04</span><div><h4>Tìm điện trở</h4><p>Nhập số, không cần ghi đơn vị.</p></div></div>
          <p>U = 12 V, I = 0,40 A. Tính R.</p>
          <label>Đáp số<div><input inputMode="decimal" className={mark("resistanceAnswer")} value={resistanceAnswer} onChange={(event) => setResistanceAnswer(event.target.value)} placeholder="0,00" /><span>Ω</span></div></label>
          {itemFeedback("resistanceAnswer")}
        </article>

        <article className="practice-card practice-safety-card">
          <div className="practice-card-heading"><span>05</span><div><h4>Chọn nguồn trong giới hạn</h4><p>Tìm nguồn điện lớn nhất vẫn bảo đảm phép đo an toàn.</p></div></div>
          <p>Một dây dẫn có R = 24 Ω. Ampe kế chỉ đo an toàn khi I ≤ 0,25 A. Chọn nguồn có hiệu điện thế lớn nhất có thể sử dụng.</p>
          <div className="practice-options practice-options-horizontal">{safeSourceChoices.map((voltage) => <button key={voltage} type="button" className={markChoice("safeSource", voltage, safeSource === voltage)} onClick={() => setSafeSource(voltage)}>Nguồn {voltage} V</button>)}</div>
          {itemFeedback("safeSource")}
        </article>
      </fieldset>

      <div className="practice-actions">
        <span className="draft-status">{attempt.saving ? "Đang đồng bộ bài làm…" : draftStatus}</span>
        {attempt.message && !attempt.locked ? <span className={`form-message ${attempt.messageType}`}>{attempt.message}</span> : null}
        <button type="button" className="secondary-button" disabled={attempt.locked} onClick={resetPractice}>Làm lại</button>
        <button type="button" className="primary-button" disabled={completedCount < OHM_LAW_TOTAL_ITEMS || !attempt.identityReady || attempt.locked || attempt.checking || attempt.submitting} onClick={() => void submitPractice()}>{attempt.submitting ? "Đang nộp…" : attempt.locked ? "Đã nộp ✓" : "Nộp bài →"}</button>
      </div>
    </div>
  );
}
