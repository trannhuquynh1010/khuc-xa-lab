"use client";

import { useState } from "react";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";
import PracticeIdentityFields from "./PracticeIdentityFields";
import usePracticeAttempt from "./usePracticeAttempt";

type MissingValueKey = "currentAt15" | "voltageAt012" | "currentAt45";
type MissingValues = Record<MissingValueKey, string>;
type GraphKind = "direct" | "offset" | "curve";
type StatementId = "scale" | "origin" | "ammeter" | "increment";
type TruthChoice = "true" | "false" | "";
type StatementAnswers = Record<StatementId, TruthChoice>;

const anomalyRows = [
  { id: "1", voltage: "2,0", current: "0,08" },
  { id: "2", voltage: "4,0", current: "0,16" },
  { id: "3", voltage: "6,0", current: "0,31" },
  { id: "4", voltage: "8,0", current: "0,32" },
];

const statements: Array<{ id: StatementId; text: string; answer: Exclude<TruthChoice, ""> }> = [
  { id: "scale", text: "Giữ nguyên dây dẫn và điều kiện đo: U tăng gấp 3 thì I cũng tăng gấp 3.", answer: "true" },
  { id: "origin", text: "Đồ thị biểu diễn I theo U là đường thẳng đi qua gốc tọa độ.", answer: "true" },
  { id: "ammeter", text: "Ampe kế phải mắc song song với dây dẫn đang khảo sát.", answer: "false" },
  { id: "increment", text: "Với cùng một dây dẫn, khi U tăng từ 2 V lên 5 V thì I tăng thêm 150% so với ban đầu.", answer: "true" },
];

const emptyMissingValues: MissingValues = { currentAt15: "", voltageAt012: "", currentAt45: "" };
const emptyStatements: StatementAnswers = { scale: "", origin: "", ammeter: "", increment: "" };

function isTruthChoice(value: unknown): value is TruthChoice {
  return value === "true" || value === "false" || value === "";
}

function approximately(value: string, expected: number) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) && Math.abs(parsed - expected) < 0.001;
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
  const [anomaly, setAnomaly] = useState("");
  const [graph, setGraph] = useState<GraphKind | "">("");
  const [statementAnswers, setStatementAnswers] = useState<StatementAnswers>(emptyStatements);
  const [checked, setChecked] = useState(false);
  const { draftStatus } = useDeviceDraft(
    deviceDraftKey("ohm-current-voltage-practice-v5"),
    { missingValues, incrementAnswer, anomaly, graph, statementAnswers },
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
      if (typeof value.anomaly === "string") setAnomaly(value.anomaly);
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
    + Number(Boolean(anomaly))
    + Number(Boolean(graph))
    + Number(Object.values(statementAnswers).every(Boolean));
  const completedItems = Object.values(missingValues).filter((value) => Boolean(value.trim())).length
    + Number(Boolean(incrementAnswer.trim()))
    + Number(Boolean(anomaly))
    + Number(Boolean(graph))
    + Object.values(statementAnswers).filter(Boolean).length;
  const statementScore = statements.filter((statement) => statementAnswers[statement.id] === statement.answer).length;
  const score = Number(approximately(missingValues.currentAt15, 0.06))
    + Number(approximately(missingValues.voltageAt012, 3))
    + Number(approximately(missingValues.currentAt45, 0.18))
    + Number(approximately(incrementAnswer, 0.35))
    + Number(anomaly === "3")
    + Number(graph === "direct")
    + statementScore;
  const attempt = usePracticeAttempt(
    "current-voltage-practice",
    { missingValues, incrementAnswer, anomaly, graph, statementAnswers },
    completedItems,
  );

  function updateChoice(setter: (value: string) => void, value: string) {
    setter(value);
    setChecked(false);
  }

  function updateMissingValue(key: MissingValueKey, value: string) {
    setMissingValues((current) => ({ ...current, [key]: value }));
    setChecked(false);
  }

  function answerStatement(id: StatementId, answer: Exclude<TruthChoice, "">) {
    setStatementAnswers((current) => ({ ...current, [id]: answer }));
    setChecked(false);
  }

  function resetPractice() {
    setMissingValues(emptyMissingValues);
    setIncrementAnswer("");
    setAnomaly("");
    setGraph("");
    setStatementAnswers(emptyStatements);
    setChecked(false);
  }

  const resultClass = (correct: boolean) => checked ? correct ? "practice-correct" : "practice-incorrect" : "";

  return (
    <div className="electric-practice current-voltage-practice">
      <div className="practice-intro">
        <div><p className="eyebrow">LUYỆN TẬP NÂNG CAO I – U</p><h3>Thử thách phòng thí nghiệm</h3><p>Vận dụng kiến thức đã học để hoàn thành 5 nhiệm vụ.</p></div>
        <strong>{completedChallenges}/5</strong>
      </div>

      <PracticeIdentityFields practiceKey="current-voltage-practice" className={attempt.className} studentNumber={attempt.studentNumber} onClassChange={attempt.setClassName} onStudentNumberChange={attempt.setStudentNumber} />
      {attempt.locked ? <div className="quiz-submission-notice"><span>✓</span><div><strong>Đã thu bài</strong><p>{attempt.message}</p></div></div> : null}

      <fieldset className="practice-grid practice-question-fieldset" disabled={attempt.locked || attempt.checking || attempt.submitting}>
        <article className="practice-card">
          <div className="practice-card-heading"><span>01</span><div><h4>Giải mã ba ô trống</h4><p>Nhập số, không cần ghi đơn vị.</p></div></div>
          <div className="mini-data-table data-hole-table" role="table" aria-label="Bảng số liệu có ba ô trống">
            <div role="row"><strong role="columnheader">U (V)</strong><span>1,5</span><span className="missing-cell"><input inputMode="decimal" aria-label="Hiệu điện thế khi I bằng 0,12 A" value={missingValues.voltageAt012} className={resultClass(approximately(missingValues.voltageAt012, 3))} onChange={(event) => updateMissingValue("voltageAt012", event.target.value)} placeholder="?" /></span><span>4,5</span><span>6,0</span></div>
            <div role="row"><strong role="rowheader">I (A)</strong><span className="missing-cell"><input inputMode="decimal" aria-label="Cường độ dòng điện khi U bằng 1,5 V" value={missingValues.currentAt15} className={resultClass(approximately(missingValues.currentAt15, 0.06))} onChange={(event) => updateMissingValue("currentAt15", event.target.value)} placeholder="?" /></span><span>0,12</span><span className="missing-cell"><input inputMode="decimal" aria-label="Cường độ dòng điện khi U bằng 4,5 V" value={missingValues.currentAt45} className={resultClass(approximately(missingValues.currentAt45, 0.18))} onChange={(event) => updateMissingValue("currentAt45", event.target.value)} placeholder="?" /></span><span>0,24</span></div>
          </div>
          <p className="table-hole-note">Cùng một dây dẫn và nhiệt độ không đổi.</p>
        </article>

        <article className="practice-card increment-challenge-card practice-calculation-card">
          <div className="practice-card-heading"><span>02</span><div><h4>Tính I khi U thay đổi</h4><p>Tính giá trị mới của cường độ dòng điện.</p></div></div>
          <div className="increment-story"><div><small>Ban đầu</small><b>U₁ = 4 V</b><b>I₁ = 0,20 A</b></div><span><strong>+3 V</strong><small>Tăng thêm</small></span><div><small>Sau đó</small><b>U₂ = 7 V</b><b>I₂ = ?</b></div></div>
          <label>I₂ bằng bao nhiêu?<div><input inputMode="decimal" aria-label="Cường độ dòng điện sau khi tăng hiệu điện thế thêm 3 V" value={incrementAnswer} className={resultClass(approximately(incrementAnswer, 0.35))} onChange={(event) => { setIncrementAnswer(event.target.value); setChecked(false); }} placeholder="0,00" /><span>A</span></div></label>
        </article>

        <article className="practice-card anomaly-card">
          <div className="practice-card-heading"><span>03</span><div><h4>Truy tìm số liệu bất thường</h4><p>Chọn phép đo cần thực hiện lại.</p></div></div>
          <div className="anomaly-grid" aria-label="Bốn phép đo U và I">
            {anomalyRows.map((row) => <button key={row.id} type="button" className={`${anomaly === row.id ? "selected" : ""} ${anomaly === row.id ? resultClass(row.id === "3") : ""}`} onClick={() => updateChoice(setAnomaly, row.id)}><b>Lần {row.id}</b><span>U = {row.voltage} V</span><span>I = {row.current} A</span></button>)}
          </div>
        </article>

        <article className="practice-card practice-card-wide">
          <div className="practice-card-heading"><span>04</span><div><h4>Chọn dấu vết đồ thị</h4><p>Đồ thị nào mô tả đúng I phụ thuộc vào U?</p></div></div>
          <div className="graph-choice-grid">
            {(["direct", "offset", "curve"] as const).map((kind, index) => <button key={kind} type="button" aria-label={`Chọn đồ thị ${String.fromCharCode(65 + index)}`} className={`${graph === kind ? "selected" : ""} ${graph === kind ? resultClass(kind === "direct") : ""}`} onClick={() => { setGraph(kind); setChecked(false); }}><span>Đồ thị {String.fromCharCode(65 + index)}</span><MiniGraph kind={kind} /></button>)}
          </div>
        </article>

        <article className="practice-card practice-card-wide">
          <div className="practice-card-heading"><span>05</span><div><h4>Phòng kiểm định đúng – sai</h4><p>Nhận định từng phát biểu.</p></div></div>
          <div className="truth-statement-list">
            {statements.map((statement, index) => {
              const answer = statementAnswers[statement.id];
              return (
                <div key={statement.id} className={`truth-statement ${answer ? resultClass(answer === statement.answer) : ""}`}>
                  <p><b>{String.fromCharCode(65 + index)}.</b> {statement.text}</p>
                  <div role="group" aria-label={`Chọn đúng hoặc sai cho phát biểu ${String.fromCharCode(65 + index)}`}>
                    <button type="button" aria-pressed={answer === "true"} className={answer === "true" ? "selected" : ""} onClick={() => answerStatement(statement.id, "true")}>Đúng</button>
                    <button type="button" aria-pressed={answer === "false"} className={answer === "false" ? "selected" : ""} onClick={() => answerStatement(statement.id, "false")}>Sai</button>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </fieldset>

      {attempt.releasedResult ? <div className={`quiz-result ${attempt.releasedResult.bonusPoint ? "bonus-earned" : "bonus-missed"}`}><div className="quiz-score"><span>Kết quả</span><strong>{attempt.releasedResult.bonusPoint ? `+${attempt.releasedResult.bonusPoint}` : "—"}</strong><b>điểm cộng</b></div><div><h4>{attempt.releasedResult.bonusPoint ? `Em nhận +${attempt.releasedResult.bonusPoint} điểm cộng.` : "Em chưa đạt điểm cộng lần này."}</h4><p>Đúng {attempt.releasedResult.correctCount}/{attempt.releasedResult.totalItems} ý.</p></div></div> : null}

      <div className="practice-actions">
        <span className="draft-status">{attempt.saving ? "Đang đồng bộ bài làm…" : draftStatus}</span>
        {attempt.message && !attempt.locked ? <span className={`form-message ${attempt.messageType}`}>{attempt.message}</span> : null}
        {checked ? <p className={score === 10 ? "correct" : "incorrect"} aria-live="polite">{score === 10 ? "Chinh phục trọn bộ: 10/10!" : `Đúng ${score}/10. Hãy xem lại các mục màu cam.`}</p> : null}
        <button type="button" className="secondary-button" disabled={attempt.locked} onClick={resetPractice}>Làm lại</button>
        <button type="button" className="secondary-button" disabled={completedChallenges < 5 || attempt.locked} onClick={() => setChecked(true)}>Kiểm tra</button>
        <button type="button" className="primary-button" disabled={completedItems < 10 || !attempt.identityReady || attempt.locked || attempt.checking || attempt.submitting} onClick={() => void attempt.submit()}>{attempt.submitting ? "Đang nộp…" : attempt.locked ? "Đã nộp ✓" : "Nộp bài →"}</button>
      </div>
    </div>
  );
}
