"use client";

import { useCallback, useEffect, useState } from "react";
import { formatStudentNumber } from "@/lib/classes";
import {
  CURRENT_VOLTAGE_BONUS_MIN_CORRECT,
  CURRENT_VOLTAGE_BONUS_POINT,
  CURRENT_VOLTAGE_BONUS_SLOTS,
  CURRENT_VOLTAGE_TOTAL_ITEMS,
  currentVoltageItemLabels,
  type CurrentVoltageItemId,
  type CurrentVoltageResult,
} from "@/lib/current-voltage-practice";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";
import PracticeIdentityFields from "./PracticeIdentityFields";
import usePracticeAttempt from "./usePracticeAttempt";

type MissingValueKey = "currentAt15" | "voltageAt012" | "currentAt45";
type MissingValues = Record<MissingValueKey, string>;
type GraphKind = "direct" | "offset" | "curve";
type StatementId = "scale" | "origin" | "ammeter" | "increment";
type TruthChoice = "true" | "false" | "";
type StatementAnswers = Record<StatementId, TruthChoice>;

// Chỉ còn nội dung phát biểu: đáp án nằm ở phía máy chủ vì bài này không có
// bước tự kiểm tra trước khi nộp.
const statements: Array<{ id: StatementId; text: string }> = [
  { id: "scale", text: "Giữ nguyên dây dẫn và điều kiện đo: U tăng gấp 3 thì I cũng tăng gấp 3." },
  { id: "origin", text: "Đồ thị biểu diễn I theo U là đường thẳng đi qua gốc tọa độ." },
  { id: "ammeter", text: "Ampe kế phải mắc song song với dây dẫn đang khảo sát." },
  { id: "increment", text: "Với cùng một dây dẫn, khi U tăng từ 2 V lên 5 V thì I tăng thêm 150% so với ban đầu." },
];

const emptyMissingValues: MissingValues = { currentAt15: "", voltageAt012: "", currentAt45: "" };
const emptyStatements: StatementAnswers = { scale: "", origin: "", ammeter: "", increment: "" };

function isTruthChoice(value: unknown): value is TruthChoice {
  return value === "true" || value === "false" || value === "";
}

function MiniGraph({ kind }: { kind: GraphKind }) {
  const path = kind === "direct"
    ? "M18 68 L108 14"
    : kind === "offset"
      ? "M18 56 L108 14"
      : "M18 68 C42 67 78 58 108 14";
  const label = kind === "direct"
    ? "Đường thẳng đi qua gốc tọa độ"
    : kind === "offset"
      ? "Đường thẳng không đi qua gốc tọa độ"
      : "Đường cong";

  return (
    <svg viewBox="0 0 124 82" role="img" aria-label={label}>
      <path className="practice-axis" d="M18 8 V68 H116" />
      <circle className="practice-origin" cx="18" cy="68" r="2.5" />
      <path className="practice-graph-line" d={path} />
      <text x="5" y="13">I</text><text x="112" y="80">U</text>
    </svg>
  );
}

export default function CurrentVoltagePractice() {
  const [missingValues, setMissingValues] = useState<MissingValues>(emptyMissingValues);
  const [incrementAnswer, setIncrementAnswer] = useState("");
  const [secondVoltageAnswer, setSecondVoltageAnswer] = useState("");
  const [graph, setGraph] = useState<GraphKind | "">("");
  const [statementAnswers, setStatementAnswers] = useState<StatementAnswers>(emptyStatements);
  // Gắn kết quả với đúng lớp + STT đã tải, để khi đổi STT không hiện lại kết
  // quả của bạn trước đó.
  const [result, setResult] = useState<{ identity: string; data: CurrentVoltageResult } | null>(null);
  const { draftStatus } = useDeviceDraft(
    deviceDraftKey("ohm-current-voltage-practice-v6"),
    { missingValues, incrementAnswer, secondVoltageAnswer, graph, statementAnswers },
    (value) => {
      if (!isDraftRecord(value)) return;
      if (isDraftRecord(value.missingValues)) {
        setMissingValues({
          currentAt15: typeof value.missingValues.currentAt15 === "string" ? value.missingValues.currentAt15 : "",
          voltageAt012: typeof value.missingValues.voltageAt012 === "string" ? value.missingValues.voltageAt012 : "",
          currentAt45: typeof value.missingValues.currentAt45 === "string" ? value.missingValues.currentAt45 : "",
        });
      }
      if (typeof value.incrementAnswer === "string") setIncrementAnswer(value.incrementAnswer);
      if (typeof value.secondVoltageAnswer === "string") setSecondVoltageAnswer(value.secondVoltageAnswer);
      if (value.graph === "direct" || value.graph === "offset" || value.graph === "curve") setGraph(value.graph);
      if (isDraftRecord(value.statementAnswers)) {
        setStatementAnswers({
          scale: isTruthChoice(value.statementAnswers.scale) ? value.statementAnswers.scale : "",
          origin: isTruthChoice(value.statementAnswers.origin) ? value.statementAnswers.origin : "",
          ammeter: isTruthChoice(value.statementAnswers.ammeter) ? value.statementAnswers.ammeter : "",
          increment: isTruthChoice(value.statementAnswers.increment) ? value.statementAnswers.increment : "",
        });
      }
    },
  );

  const completedChallenges = Number(Object.values(missingValues).every((value) => Boolean(value.trim())))
    + Number(Boolean(incrementAnswer.trim()))
    + Number(Boolean(secondVoltageAnswer.trim()))
    + Number(Boolean(graph))
    + Number(Object.values(statementAnswers).every(Boolean));
  const completedItems = Object.values(missingValues).filter((value) => Boolean(value.trim())).length
    + Number(Boolean(incrementAnswer.trim()))
    + Number(Boolean(secondVoltageAnswer.trim()))
    + Number(Boolean(graph))
    + Object.values(statementAnswers).filter(Boolean).length;
  const attempt = usePracticeAttempt(
    "current-voltage-practice",
    { missingValues, incrementAnswer, secondVoltageAnswer, graph, statementAnswers },
    completedItems,
  );

  const identityKey = `${attempt.className}:${attempt.studentNumber}`;

  // Kết quả, điểm cộng và lời giải thích chỉ có sau khi em đã nộp bài.
  const loadResult = useCallback(async () => {
    if (!attempt.identityReady) return;
    const identity = `${attempt.className}:${attempt.studentNumber}`;
    const params = new URLSearchParams({ className: attempt.className, studentNumber: attempt.studentNumber });
    try {
      const response = await fetch(`/api/current-voltage-practice?${params}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as CurrentVoltageResult;
      if (data.submitted) setResult({ identity, data });
    } catch {
      /* giữ nguyên trạng thái khi mạng lỗi tạm thời */
    }
  }, [attempt.className, attempt.identityReady, attempt.studentNumber]);

  useEffect(() => {
    if (!attempt.locked) return;
    const timer = window.setTimeout(() => void loadResult(), 0);
    return () => window.clearTimeout(timer);
  }, [attempt.locked, loadResult]);

  function updateMissingValue(key: MissingValueKey, value: string) {
    setMissingValues((current) => ({ ...current, [key]: value }));
  }

  function answerStatement(id: StatementId, answer: Exclude<TruthChoice, "">) {
    setStatementAnswers((current) => ({ ...current, [id]: answer }));
  }

  function resetPractice() {
    setMissingValues(emptyMissingValues);
    setIncrementAnswer("");
    setSecondVoltageAnswer("");
    setGraph("");
    setStatementAnswers(emptyStatements);
  }

  async function submitPractice() {
    if (!window.confirm(`Nộp bài với ${completedItems}/${CURRENT_VOLTAGE_TOTAL_ITEMS} ý đã làm? Em chỉ nộp được một lần, nên hãy kiểm tra lại cho chắc chắn trước khi nộp.`)) return;
    await attempt.submit();
    await loadResult();
  }

  // Chỉ hiện kết quả khi em đã nộp và kết quả đúng là của em.
  const shownResult = attempt.locked && result?.identity === identityKey ? result.data : null;
  const wrongItems = shownResult?.items.filter((item) => !item.correct) ?? [];
  const reviewById = new Map((shownResult?.items ?? []).map((item) => [item.id, item]));

  /** Tô xanh ý đúng, tô đỏ ý sai; trước khi nộp thì không tô gì. */
  function mark(id: CurrentVoltageItemId) {
    const item = reviewById.get(id);
    return item ? (item.correct ? "practice-correct" : "practice-incorrect") : "";
  }

  /** Đánh dấu một phương án trong nhóm lựa chọn sau khi đã nộp. */
  function markChoice(id: CurrentVoltageItemId, value: string, chosen: boolean) {
    const item = reviewById.get(id);
    if (!item) return chosen ? "selected" : "";
    const classes = [chosen ? "selected" : ""];
    if (value === item.correctValue) classes.push("practice-correct");
    else if (chosen) classes.push("practice-incorrect");
    return classes.filter(Boolean).join(" ");
  }

  /** Giải thích hiện ngay dưới ý làm sai, giữ nguyên bố cục bài làm. */
  function itemFeedback(id: CurrentVoltageItemId) {
    const item = reviewById.get(id);
    if (!item || item.correct) return null;
    return (
      <div className="cv-item-feedback" key={`feedback-${id}`}>
        <p className="cv-item-where">{currentVoltageItemLabels[id].label}</p>
        <p className="cv-item-answer">Em trả lời <s>{item.response}</s> · Đáp án đúng: <b>{item.correctAnswer}</b></p>
        <p><b>Vì sao:</b> {item.explanation}</p>
        <p><b>Cách làm lại:</b> {item.hint}</p>
      </div>
    );
  }
  const perfect = shownResult !== null && shownResult.correctCount >= shownResult.totalItems;
  // Đạt mức xét điểm cộng nhưng lớp đã hết suất.
  const eligible = shownResult !== null && shownResult.correctCount >= CURRENT_VOLTAGE_BONUS_MIN_CORRECT;

  return (
    <div className="electric-practice current-voltage-practice">
      <div className="practice-intro">
        <div>
          <p className="eyebrow">LUYỆN TẬP I – U</p>
          <h3>Thử thách phòng thí nghiệm</h3>
          <p>Vận dụng kiến thức đã học để hoàn thành 5 nhiệm vụ. Em tự kiểm tra lại rồi mới nộp, vì mỗi bạn chỉ nộp một lần. Lớp có {CURRENT_VOLTAGE_BONUS_SLOTS} suất +{CURRENT_VOLTAGE_BONUS_POINT} điểm cộng, dành cho những bạn nộp sớm nhất mà làm đúng từ {CURRENT_VOLTAGE_BONUS_MIN_CORRECT}/{CURRENT_VOLTAGE_TOTAL_ITEMS} ý trở lên.</p>
        </div>
        <strong>{completedChallenges}/5</strong>
      </div>

      <PracticeIdentityFields practiceKey="current-voltage-practice" className={attempt.className} studentNumber={attempt.studentNumber} onClassChange={attempt.setClassName} onStudentNumberChange={attempt.setStudentNumber} />

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
                    : `Chưa đạt điểm cộng lần này. Điểm cộng dành cho những bạn nộp sớm nhất mà làm đúng từ ${CURRENT_VOLTAGE_BONUS_MIN_CORRECT}/${shownResult.totalItems} ý trở lên.`}
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
        <div className="quiz-submission-notice"><span className="loading-dot" /><div><strong>Đang tải kết quả…</strong><p>{attempt.message}</p></div></div>
      ) : null}

      <fieldset className="practice-grid practice-question-fieldset" disabled={attempt.locked || attempt.checking || attempt.submitting}>
        <article className="practice-card">
          <div className="practice-card-heading"><span>01</span><div><h4>Giải mã ba ô trống</h4><p>Nhập số, không cần ghi đơn vị.</p></div></div>
          <div className="mini-data-table data-hole-table" role="table" aria-label="Bảng số liệu có ba ô trống">
            <div role="row"><strong role="columnheader">U (V)</strong><span>1,5</span><span className="missing-cell"><input inputMode="decimal" aria-label="Hiệu điện thế khi I bằng 0,12 A" className={mark("voltageAt012")} value={missingValues.voltageAt012} onChange={(event) => updateMissingValue("voltageAt012", event.target.value)} placeholder="?" /></span><span>4,5</span><span>6,0</span></div>
            <div role="row"><strong role="rowheader">I (A)</strong><span className="missing-cell"><input inputMode="decimal" aria-label="Cường độ dòng điện khi U bằng 1,5 V" className={mark("currentAt15")} value={missingValues.currentAt15} onChange={(event) => updateMissingValue("currentAt15", event.target.value)} placeholder="?" /></span><span>0,12</span><span className="missing-cell"><input inputMode="decimal" aria-label="Cường độ dòng điện khi U bằng 4,5 V" className={mark("currentAt45")} value={missingValues.currentAt45} onChange={(event) => updateMissingValue("currentAt45", event.target.value)} placeholder="?" /></span><span>0,24</span></div>
          </div>
          <p className="table-hole-note">Cùng một dây dẫn và nhiệt độ không đổi.</p>
          {itemFeedback("voltageAt012")}
          {itemFeedback("currentAt15")}
          {itemFeedback("currentAt45")}
        </article>

        <article className="practice-card increment-challenge-card practice-calculation-card">
          <div className="practice-card-heading"><span>02</span><div><h4>Tính I khi U thay đổi</h4><p>Tính giá trị mới của cường độ dòng điện.</p></div></div>
          <div className="increment-story"><div><small>Ban đầu</small><b>U₁ = 4 V</b><b>I₁ = 0,20 A</b></div><span><strong>+3 V</strong><small>Tăng thêm</small></span><div><small>Sau đó</small><b>I₂ = ?</b></div></div>
          <label>I₂ bằng bao nhiêu?<div><input inputMode="decimal" aria-label="Cường độ dòng điện sau khi tăng hiệu điện thế thêm 3 V" className={mark("incrementAnswer")} value={incrementAnswer} onChange={(event) => setIncrementAnswer(event.target.value)} placeholder="0,00" /><span>A</span></div></label>
          {itemFeedback("incrementAnswer")}
        </article>

        <article className="practice-card increment-challenge-card practice-calculation-card">
          <div className="practice-card-heading"><span>03</span><div><h4>Tính U khi I thay đổi</h4><p>Tính giá trị mới của hiệu điện thế.</p></div></div>
          <div className="increment-story"><div><small>Ban đầu</small><b>U₁ = 9 V</b><b>I₁ = 0,30 A</b></div><span><strong>-0,20 A</strong><small>Giảm xuống</small></span><div><small>Sau đó</small><b>U₂ = ?</b></div></div>
          <label>U₂ bằng bao nhiêu?<div><input inputMode="decimal" aria-label="Hiệu điện thế sau khi cường độ dòng điện giảm xuống còn 0,10 A" className={mark("secondVoltageAnswer")} value={secondVoltageAnswer} onChange={(event) => setSecondVoltageAnswer(event.target.value)} placeholder="0,00" /><span>V</span></div></label>
          {itemFeedback("secondVoltageAnswer")}
        </article>

        <article className="practice-card practice-card-wide">
          <div className="practice-card-heading"><span>04</span><div><h4>Chọn dấu vết đồ thị</h4><p>Đồ thị nào mô tả đúng I phụ thuộc vào U?</p></div></div>
          <div className="graph-choice-grid">
            {(["direct", "offset", "curve"] as const).map((kind, index) => <button key={kind} type="button" aria-label={`Chọn đồ thị ${String.fromCharCode(65 + index)}`} className={markChoice("graph", kind, graph === kind)} onClick={() => setGraph(kind)}><span>Đồ thị {String.fromCharCode(65 + index)}</span><MiniGraph kind={kind} /></button>)}
          </div>
          {itemFeedback("graph")}
        </article>

        <article className="practice-card practice-card-wide">
          <div className="practice-card-heading"><span>05</span><div><h4>Phòng kiểm định đúng – sai</h4><p>Nhận định từng phát biểu.</p></div></div>
          <div className="truth-statement-list">
            {statements.map((statement, index) => {
              const answer = statementAnswers[statement.id];
              return (
                <div key={statement.id} className="truth-statement">
                  <p><b>{String.fromCharCode(65 + index)}.</b> {statement.text}</p>
                  <div role="group" aria-label={`Chọn đúng hoặc sai cho phát biểu ${String.fromCharCode(65 + index)}`}>
                    <button type="button" aria-pressed={answer === "true"} className={markChoice(statement.id, "true", answer === "true")} onClick={() => answerStatement(statement.id, "true")}>Đúng</button>
                    <button type="button" aria-pressed={answer === "false"} className={markChoice(statement.id, "false", answer === "false")} onClick={() => answerStatement(statement.id, "false")}>Sai</button>
                  </div>
                  {itemFeedback(statement.id)}
                </div>
              );
            })}
          </div>
        </article>
      </fieldset>

      <div className="practice-actions">
        <span className="draft-status">{attempt.saving ? "Đang đồng bộ bài làm…" : draftStatus}</span>
        {attempt.message && !attempt.locked ? <span className={`form-message ${attempt.messageType}`}>{attempt.message}</span> : null}
        <button type="button" className="secondary-button" disabled={attempt.locked} onClick={resetPractice}>Làm lại</button>
        <button type="button" className="primary-button" disabled={completedItems < CURRENT_VOLTAGE_TOTAL_ITEMS || !attempt.identityReady || attempt.locked || attempt.checking || attempt.submitting} onClick={() => void submitPractice()}>{attempt.submitting ? "Đang nộp…" : attempt.locked ? "Đã nộp ✓" : "Nộp bài →"}</button>
      </div>
    </div>
  );
}
