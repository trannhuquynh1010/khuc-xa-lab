"use client";

import { useState } from "react";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type MeterPart = "ammeter" | "voltmeter" | "switch";
type MeterSlot = "series" | "parallel";
type CircuitSlots = Record<MeterSlot, MeterPart | "">;

const meterParts: Array<{ id: MeterPart; symbol: string; label: string }> = [
  { id: "ammeter", symbol: "A", label: "Ampe kế" },
  { id: "voltmeter", symbol: "V", label: "Vôn kế" },
  { id: "switch", symbol: "K", label: "Công tắc" },
];

const predictionChoices = [
  { id: "same", text: "I vẫn bằng 0,10 A" },
  { id: "triple", text: "I tăng lên 0,30 A" },
  { id: "six-times", text: "I tăng lên 0,60 A" },
];

const conclusionChoices = [
  { id: "direct", text: "I tăng tỉ lệ thuận với U khi dây dẫn và điều kiện thí nghiệm không đổi." },
  { id: "inverse", text: "I giảm khi U tăng." },
  { id: "unrelated", text: "I không phụ thuộc vào U." },
];

const emptySlots: CircuitSlots = { series: "", parallel: "" };

function isMeterPart(value: unknown): value is MeterPart {
  return value === "ammeter" || value === "voltmeter" || value === "switch";
}

function MiniGraph({ kind }: { kind: "direct" | "curve" | "constant" }) {
  const path = kind === "direct"
    ? "M18 68 L108 14"
    : kind === "curve"
      ? "M18 68 C48 67 78 55 108 14"
      : "M18 43 L108 43";

  return (
    <svg viewBox="0 0 124 82" role="img" aria-label={kind === "direct" ? "Đường thẳng đi qua gốc tọa độ" : kind === "curve" ? "Đường cong" : "Đường nằm ngang"}>
      <path className="practice-axis" d="M18 8 V68 H116" />
      <path className="practice-graph-line" d={path} />
      <text x="5" y="13">I</text><text x="112" y="80">U</text>
    </svg>
  );
}

export default function CurrentVoltagePractice() {
  const [slots, setSlots] = useState<CircuitSlots>(emptySlots);
  const [selectedPart, setSelectedPart] = useState<MeterPart | null>(null);
  const [prediction, setPrediction] = useState("");
  const [graph, setGraph] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [checked, setChecked] = useState(false);
  const { draftStatus } = useDeviceDraft(deviceDraftKey("ohm-current-voltage-practice"), { slots, prediction, graph, conclusion }, (value) => {
    if (!isDraftRecord(value)) return;
    if (isDraftRecord(value.slots)) {
      setSlots({
        series: isMeterPart(value.slots.series) ? value.slots.series : "",
        parallel: isMeterPart(value.slots.parallel) ? value.slots.parallel : "",
      });
    }
    if (typeof value.prediction === "string") setPrediction(value.prediction);
    if (typeof value.graph === "string") setGraph(value.graph);
    if (typeof value.conclusion === "string") setConclusion(value.conclusion);
  });

  const completedCount = Number(Boolean(slots.series)) + Number(Boolean(slots.parallel)) + Number(Boolean(prediction)) + Number(Boolean(graph)) + Number(Boolean(conclusion));
  const score = Number(slots.series === "ammeter")
    + Number(slots.parallel === "voltmeter")
    + Number(prediction === "triple")
    + Number(graph === "direct")
    + Number(conclusion === "direct");

  function updateChoice(setter: (value: string) => void, value: string) {
    setter(value);
    setChecked(false);
  }

  function placePart(slot: MeterSlot, part: MeterPart) {
    setSlots((current) => ({
      series: current.series === part ? "" : current.series,
      parallel: current.parallel === part ? "" : current.parallel,
      [slot]: part,
    }));
    setSelectedPart(null);
    setChecked(false);
  }

  function interactWithSlot(slot: MeterSlot) {
    if (selectedPart) {
      placePart(slot, selectedPart);
      return;
    }
    const currentPart = slots[slot];
    if (currentPart) {
      setSlots((current) => ({ ...current, [slot]: "" }));
      setSelectedPart(currentPart);
      setChecked(false);
    }
  }

  function resetPractice() {
    setSlots(emptySlots);
    setSelectedPart(null);
    setPrediction("");
    setGraph("");
    setConclusion("");
    setChecked(false);
  }

  const partLabel = (part: MeterPart | "") => meterParts.find((item) => item.id === part);
  const resultClass = (correct: boolean) => checked ? correct ? "practice-correct" : "practice-incorrect" : "";

  return (
    <div className="electric-practice">
      <div className="practice-intro">
        <div><p className="eyebrow">KHÁM PHÁ I – U</p><h3>Từ mạch điện đến quy luật</h3><p>Hoàn thành bốn thử thách rồi tự kiểm tra kết quả.</p></div>
        <strong>{completedCount}/5</strong>
      </div>

      <div className="practice-grid">
        <article className="practice-card practice-card-wide">
          <div className="practice-card-heading"><span>01</span><div><h4>Lắp dụng cụ đo</h4><p>Chọn hoặc kéo dụng cụ vào hai vị trí trống.</p></div></div>
          <div className="meter-bank" aria-label="Kho dụng cụ đo">
            {meterParts.map((part) => <button key={part.id} type="button" draggable aria-pressed={selectedPart === part.id} className={selectedPart === part.id ? "selected" : ""} onDragStart={(event) => event.dataTransfer.setData("text/plain", part.id)} onClick={() => setSelectedPart((current) => current === part.id ? null : part.id)}><b>{part.symbol}</b><span>{part.label}</span></button>)}
          </div>
          <div className="circuit-builder" aria-label="Sơ đồ mạch điện cần hoàn thành">
            <div className="circuit-series-row">
              <span className="circuit-fixed"><b>＋ | | −</b><small>Nguồn U</small></span><i />
              <button type="button" className={`circuit-drop-slot ${slots.series ? "filled" : ""} ${resultClass(slots.series === "ammeter")}`} onClick={() => interactWithSlot("series")} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const part = event.dataTransfer.getData("text/plain"); if (isMeterPart(part)) placePart("series", part); }}><small>Vị trí 1 · trên mạch chính</small><b>{partLabel(slots.series)?.symbol ?? "?"}</b><span>{partLabel(slots.series)?.label ?? "Đặt dụng cụ"}</span></button><i />
              <span className="circuit-fixed conductor"><b>▱</b><small>Dây dẫn X</small></span><i />
              <span className="circuit-fixed"><b>K</b><small>Công tắc</small></span>
            </div>
            <div className="circuit-parallel-row"><span>└── mắc vào hai đầu dây dẫn X ──┘</span><button type="button" className={`circuit-drop-slot ${slots.parallel ? "filled" : ""} ${resultClass(slots.parallel === "voltmeter")}`} onClick={() => interactWithSlot("parallel")} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const part = event.dataTransfer.getData("text/plain"); if (isMeterPart(part)) placePart("parallel", part); }}><small>Vị trí 2 · nhánh đo</small><b>{partLabel(slots.parallel)?.symbol ?? "?"}</b><span>{partLabel(slots.parallel)?.label ?? "Đặt dụng cụ"}</span></button></div>
          </div>
        </article>

        <article className="practice-card">
          <div className="practice-card-heading"><span>02</span><div><h4>Dự đoán số đo</h4><p>Chọn một đáp án.</p></div></div>
          <p>Với cùng dây dẫn, khi U tăng từ 2 V lên 6 V, I ban đầu là 0,10 A. I mới bằng bao nhiêu?</p>
          <div className="practice-options">{predictionChoices.map((choice) => <button key={choice.id} type="button" className={`${prediction === choice.id ? "selected" : ""} ${prediction === choice.id ? resultClass(choice.id === "triple") : ""}`} onClick={() => updateChoice(setPrediction, choice.id)}>{choice.text}</button>)}</div>
        </article>

        <article className="practice-card">
          <div className="practice-card-heading"><span>03</span><div><h4>Chọn đồ thị</h4><p>Chọn đồ thị phù hợp với kết quả thí nghiệm.</p></div></div>
          <div className="graph-choice-grid">
            {(["direct", "curve", "constant"] as const).map((kind, index) => <button key={kind} type="button" aria-label={`Chọn đồ thị ${String.fromCharCode(65 + index)}`} className={`${graph === kind ? "selected" : ""} ${graph === kind ? resultClass(kind === "direct") : ""}`} onClick={() => updateChoice(setGraph, kind)}><span>Đồ thị {String.fromCharCode(65 + index)}</span><MiniGraph kind={kind} /></button>)}
          </div>
        </article>

        <article className="practice-card practice-card-wide">
          <div className="practice-card-heading"><span>04</span><div><h4>Rút ra kết luận</h4><p>Chọn kết luận phù hợp nhất.</p></div></div>
          <div className="practice-options practice-options-horizontal">{conclusionChoices.map((choice) => <button key={choice.id} type="button" className={`${conclusion === choice.id ? "selected" : ""} ${conclusion === choice.id ? resultClass(choice.id === "direct") : ""}`} onClick={() => updateChoice(setConclusion, choice.id)}>{choice.text}</button>)}</div>
        </article>
      </div>

      <div className="practice-actions">
        <span className="draft-status">{draftStatus}</span>
        {checked && <p className={score === 5 ? "correct" : "incorrect"} aria-live="polite">{score === 5 ? "Hoàn thành xuất sắc: 5/5!" : `Đúng ${score}/5. Hãy sửa các mục màu cam rồi kiểm tra lại.`}</p>}
        <button type="button" className="secondary-button" onClick={resetPractice}>Làm lại</button>
        <button type="button" className="primary-button" disabled={completedCount < 5} onClick={() => setChecked(true)}>Kiểm tra →</button>
      </div>
    </div>
  );
}
