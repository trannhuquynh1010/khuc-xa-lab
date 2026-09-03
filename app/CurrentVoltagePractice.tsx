"use client";

import { useState } from "react";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type CircuitPart = "ammeter" | "voltmeter" | "switch";
type CircuitSlot = "seriesMeter" | "control" | "parallelMeter";
type CircuitSlots = Record<CircuitSlot, CircuitPart | "">;
type GraphKind = "direct" | "offset" | "curve";
type StatementId = "scale" | "origin" | "ammeter" | "repeat";
type TruthChoice = "true" | "false" | "";
type StatementAnswers = Record<StatementId, TruthChoice>;

const circuitParts: Array<{ id: CircuitPart; symbol: string; label: string }> = [
  { id: "ammeter", symbol: "A", label: "Ampe kế" },
  { id: "voltmeter", symbol: "V", label: "Vôn kế" },
  { id: "switch", symbol: "K", label: "Công tắc" },
];

const missingValueChoices = [
  { id: "0.15", text: "0,15 A" },
  { id: "0.18", text: "0,18 A" },
  { id: "0.24", text: "0,24 A" },
];

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
  { id: "repeat", text: "Chỉ cần hai phép đo là đủ; không cần lặp lại khi có một số liệu lệch quy luật.", answer: "false" },
];

const emptySlots: CircuitSlots = { seriesMeter: "", control: "", parallelMeter: "" };
const emptyStatements: StatementAnswers = { scale: "", origin: "", ammeter: "", repeat: "" };

function isCircuitPart(value: unknown): value is CircuitPart {
  return value === "ammeter" || value === "voltmeter" || value === "switch";
}

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

function CircuitSlotChooser({
  slot,
  hint,
  value,
  correctPart,
  checked,
  onChoose,
}: {
  slot: CircuitSlot;
  hint: string;
  value: CircuitPart | "";
  correctPart: CircuitPart;
  checked: boolean;
  onChoose: (slot: CircuitSlot, part: CircuitPart) => void;
}) {
  const resultClass = checked ? value === correctPart ? "practice-correct" : "practice-incorrect" : "";

  return (
    <div className={`circuit-slot-chooser ${value ? "filled" : ""} ${resultClass}`} role="group" aria-label={hint}>
      <small>{hint}</small>
      <div className="circuit-slot-options">
        {circuitParts.map((part) => (
          <button
            key={part.id}
            type="button"
            aria-label={`${hint}: chọn ${part.label}`}
            aria-pressed={value === part.id}
            className={value === part.id ? "selected" : ""}
            onClick={() => onChoose(slot, part.id)}
          >
            <b>{part.symbol}</b><span>{part.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CurrentVoltagePractice() {
  const [slots, setSlots] = useState<CircuitSlots>(emptySlots);
  const [missingValue, setMissingValue] = useState("");
  const [anomaly, setAnomaly] = useState("");
  const [graph, setGraph] = useState<GraphKind | "">("");
  const [statementAnswers, setStatementAnswers] = useState<StatementAnswers>(emptyStatements);
  const [checked, setChecked] = useState(false);
  const { draftStatus } = useDeviceDraft(
    deviceDraftKey("ohm-current-voltage-practice-v2"),
    { slots, missingValue, anomaly, graph, statementAnswers },
    (value) => {
      if (!isDraftRecord(value)) return;
      if (isDraftRecord(value.slots)) {
        setSlots({
          seriesMeter: isCircuitPart(value.slots.seriesMeter) ? value.slots.seriesMeter : "",
          control: isCircuitPart(value.slots.control) ? value.slots.control : "",
          parallelMeter: isCircuitPart(value.slots.parallelMeter) ? value.slots.parallelMeter : "",
        });
      }
      if (typeof value.missingValue === "string") setMissingValue(value.missingValue);
      if (typeof value.anomaly === "string") setAnomaly(value.anomaly);
      if (value.graph === "direct" || value.graph === "offset" || value.graph === "curve") setGraph(value.graph);
      if (isDraftRecord(value.statementAnswers)) {
        setStatementAnswers({
          scale: isTruthChoice(value.statementAnswers.scale) ? value.statementAnswers.scale : "",
          origin: isTruthChoice(value.statementAnswers.origin) ? value.statementAnswers.origin : "",
          ammeter: isTruthChoice(value.statementAnswers.ammeter) ? value.statementAnswers.ammeter : "",
          repeat: isTruthChoice(value.statementAnswers.repeat) ? value.statementAnswers.repeat : "",
        });
      }
    },
  );

  const completedChallenges = Number(Object.values(slots).every(Boolean))
    + Number(Boolean(missingValue))
    + Number(Boolean(anomaly))
    + Number(Boolean(graph))
    + Number(Object.values(statementAnswers).every(Boolean));
  const circuitScore = Number(slots.seriesMeter === "ammeter")
    + Number(slots.control === "switch")
    + Number(slots.parallelMeter === "voltmeter");
  const statementScore = statements.filter((statement) => statementAnswers[statement.id] === statement.answer).length;
  const score = circuitScore
    + Number(missingValue === "0.18")
    + Number(anomaly === "3")
    + Number(graph === "direct")
    + statementScore;

  function updateChoice(setter: (value: string) => void, value: string) {
    setter(value);
    setChecked(false);
  }

  function placePart(slot: CircuitSlot, part: CircuitPart) {
    setSlots((current) => ({
      seriesMeter: current.seriesMeter === part ? "" : current.seriesMeter,
      control: current.control === part ? "" : current.control,
      parallelMeter: current.parallelMeter === part ? "" : current.parallelMeter,
      [slot]: part,
    }));
    setChecked(false);
  }

  function answerStatement(id: StatementId, answer: Exclude<TruthChoice, "">) {
    setStatementAnswers((current) => ({ ...current, [id]: answer }));
    setChecked(false);
  }

  function resetPractice() {
    setSlots(emptySlots);
    setMissingValue("");
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

      <div className="practice-grid">
        <article className="practice-card practice-card-wide">
          <div className="practice-card-heading"><span>01</span><div><h4>Hoàn thiện mạch đo</h4><p>Chọn một dụng cụ cho từng vị trí trong mạch.</p></div></div>
          <div className="circuit-builder" aria-label="Sơ đồ mạch điện cần hoàn thành">
            <div className="circuit-route-card">
              <div className="circuit-route-heading"><strong>Mạch chính</strong><span>Nối tiếp</span></div>
              <div className="circuit-route-flow circuit-main-flow">
                <span className="circuit-fixed"><b>＋ | | −</b><small>Nguồn điện</small></span><i aria-hidden="true">→</i>
                <CircuitSlotChooser slot="seriesMeter" hint="Vị trí nối tiếp" value={slots.seriesMeter} correctPart="ammeter" checked={checked} onChoose={placePart} /><i aria-hidden="true">→</i>
                <span className="circuit-fixed conductor"><b>▱</b><small>Dây dẫn X</small></span><i aria-hidden="true">→</i>
                <CircuitSlotChooser slot="control" hint="Vị trí điều khiển" value={slots.control} correctPart="switch" checked={checked} onChoose={placePart} />
              </div>
            </div>
            <div className="circuit-route-card parallel-route-card">
              <div className="circuit-route-heading"><strong>Nhánh đo hai đầu X</strong><span>Song song</span></div>
              <div className="circuit-route-flow circuit-parallel-flow">
                <span className="circuit-terminal"><b>●</b><small>Đầu X</small></span><i aria-hidden="true">→</i>
                <CircuitSlotChooser slot="parallelMeter" hint="Vị trí ở nhánh đo" value={slots.parallelMeter} correctPart="voltmeter" checked={checked} onChoose={placePart} /><i aria-hidden="true">→</i>
                <span className="circuit-terminal"><b>●</b><small>Đầu X</small></span>
              </div>
            </div>
          </div>
        </article>

        <article className="practice-card">
          <div className="practice-card-heading"><span>02</span><div><h4>Giải mã ô trống</h4><p>Dựa vào quy luật của cùng một dây dẫn.</p></div></div>
          <div className="mini-data-table" role="table" aria-label="Bảng số liệu có một giá trị cường độ dòng điện còn thiếu">
            <div role="row"><strong role="columnheader">U (V)</strong><span>1,5</span><span>3,0</span><span>4,5</span><span>6,0</span></div>
            <div role="row"><strong role="rowheader">I (A)</strong><span>0,06</span><span>0,12</span><span className="missing-cell">?</span><span>0,24</span></div>
          </div>
          <p>Giá trị còn thiếu hợp lí nhất là:</p>
          <div className="practice-options compact-choice-grid">{missingValueChoices.map((choice) => <button key={choice.id} type="button" className={`${missingValue === choice.id ? "selected" : ""} ${missingValue === choice.id ? resultClass(choice.id === "0.18") : ""}`} onClick={() => updateChoice(setMissingValue, choice.id)}>{choice.text}</button>)}</div>
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
          <div className="practice-card-heading"><span>05</span><div><h4>Phòng kiểm định đúng – sai</h4><p>Nhận định từng phát biểu; phải trả lời đủ bốn ý.</p></div></div>
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
      </div>

      <div className="practice-actions">
        <span className="draft-status">{draftStatus}</span>
        {checked ? <p className={score === 10 ? "correct" : "incorrect"} aria-live="polite">{score === 10 ? "Chinh phục trọn bộ: 10/10!" : `Đúng ${score}/10. Hãy xem lại các mục màu cam.`}</p> : null}
        <button type="button" className="secondary-button" onClick={resetPractice}>Làm lại</button>
        <button type="button" className="primary-button" disabled={completedChallenges < 5} onClick={() => setChecked(true)}>Kiểm tra →</button>
      </div>
    </div>
  );
}
