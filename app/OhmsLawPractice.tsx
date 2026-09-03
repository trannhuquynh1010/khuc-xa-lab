"use client";

import { useState } from "react";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type FormulaSymbol = "I" | "U" | "R";
type FormulaSlots = [FormulaSymbol | "", FormulaSymbol | "", FormulaSymbol | ""];

const formulaSymbols: FormulaSymbol[] = ["I", "U", "R"];
const scenarioChoices = [
  { id: "parallel", text: "Mắc ampe kế song song với dây dẫn để đo nhanh hơn." },
  { id: "series", text: "Ngắt nguồn, mắc lại ampe kế nối tiếp với dây dẫn rồi mới đóng mạch." },
  { id: "raise-voltage", text: "Tăng hiệu điện thế để ampe kế dễ hiện số." },
];

const emptyFormula: FormulaSlots = ["", "", ""];

function isFormulaSymbol(value: unknown): value is FormulaSymbol {
  return value === "I" || value === "U" || value === "R";
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
  const [formula, setFormula] = useState<FormulaSlots>(emptyFormula);
  const [selectedSymbol, setSelectedSymbol] = useState<FormulaSymbol | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [voltageAnswer, setVoltageAnswer] = useState("");
  const [resistanceAnswer, setResistanceAnswer] = useState("");
  const [scenario, setScenario] = useState("");
  const [checked, setChecked] = useState(false);
  const { draftStatus } = useDeviceDraft(deviceDraftKey("ohm-law-practice"), { formula, currentAnswer, voltageAnswer, resistanceAnswer, scenario }, (value) => {
    if (!isDraftRecord(value)) return;
    if (Array.isArray(value.formula) && value.formula.length === 3) {
      setFormula(value.formula.map((symbol) => isFormulaSymbol(symbol) ? symbol : "") as FormulaSlots);
    }
    if (typeof value.currentAnswer === "string") setCurrentAnswer(value.currentAnswer);
    if (typeof value.voltageAnswer === "string") setVoltageAnswer(value.voltageAnswer);
    if (typeof value.resistanceAnswer === "string") setResistanceAnswer(value.resistanceAnswer);
    if (typeof value.scenario === "string") setScenario(value.scenario);
  });

  const completedCount = formula.filter(Boolean).length
    + Number(Boolean(currentAnswer.trim()))
    + Number(Boolean(voltageAnswer.trim()))
    + Number(Boolean(resistanceAnswer.trim()))
    + Number(Boolean(scenario));
  const formulaResults = [formula[0] === "I", formula[1] === "U", formula[2] === "R"];
  const score = formulaResults.filter(Boolean).length
    + Number(approximately(currentAnswer, 0.3))
    + Number(approximately(voltageAnswer, 6))
    + Number(approximately(resistanceAnswer, 30))
    + Number(scenario === "series");

  function placeSymbol(index: number, symbol: FormulaSymbol) {
    setFormula((current) => {
      const next = current.map((item) => item === symbol ? "" : item) as FormulaSlots;
      next[index] = symbol;
      return next;
    });
    setSelectedSymbol(null);
    setChecked(false);
  }

  function interactWithFormulaSlot(index: number) {
    if (selectedSymbol) {
      placeSymbol(index, selectedSymbol);
      return;
    }
    const symbol = formula[index];
    if (symbol) {
      setFormula((current) => current.map((item, slotIndex) => slotIndex === index ? "" : item) as FormulaSlots);
      setSelectedSymbol(symbol);
      setChecked(false);
    }
  }

  function updateNumber(setter: (value: string) => void, value: string) {
    setter(value);
    setChecked(false);
  }

  function resetPractice() {
    setFormula(emptyFormula);
    setSelectedSymbol(null);
    setCurrentAnswer("");
    setVoltageAnswer("");
    setResistanceAnswer("");
    setScenario("");
    setChecked(false);
  }

  const resultClass = (correct: boolean) => checked ? correct ? "practice-correct" : "practice-incorrect" : "";

  return (
    <div className="electric-practice ohms-law-practice">
      <div className="practice-intro ohm-law-intro">
        <div><p className="eyebrow">ĐỊNH LUẬT OHM</p><h3>Từ công thức đến mạch điện</h3><p>Ghép đúng công thức, tính ba đại lượng và cứu một mạch mắc sai.</p></div>
        <strong>{completedCount}/7</strong>
      </div>

      <div className="practice-grid">
        <article className="practice-card practice-card-wide">
          <div className="practice-card-heading"><span>01</span><div><h4>Ghép công thức</h4><p>Chọn hoặc kéo I, U, R vào đúng vị trí.</p></div></div>
          <div className="formula-builder">
            <div className="formula-bank">{formulaSymbols.map((symbol) => <button key={symbol} type="button" draggable aria-pressed={selectedSymbol === symbol} className={selectedSymbol === symbol ? "selected" : ""} onDragStart={(event) => event.dataTransfer.setData("text/plain", symbol)} onClick={() => setSelectedSymbol((current) => current === symbol ? null : symbol)}>{symbol}</button>)}</div>
            <div className="formula-equation" aria-label="Công thức định luật Ohm cần hoàn thành">
              {formula.map((symbol, index) => <span key={index}>{index === 1 && <b>=</b>}{index === 2 && <b>/</b>}<button type="button" className={`${symbol ? "filled" : ""} ${resultClass(formulaResults[index])}`} onClick={() => interactWithFormulaSlot(index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const dropped = event.dataTransfer.getData("text/plain"); if (isFormulaSymbol(dropped)) placeSymbol(index, dropped); }}>{symbol || "?"}</button></span>)}
            </div>
          </div>
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
          <div className="practice-card-heading"><span>05</span><div><h4>Cứu mạch điện</h4><p>Chọn cách xử lí an toàn và đúng.</p></div></div>
          <p>Một bạn mắc ampe kế song song với dây dẫn X. Em nên làm gì?</p>
          <div className="practice-options">{scenarioChoices.map((choice) => <button key={choice.id} type="button" className={`${scenario === choice.id ? "selected" : ""} ${scenario === choice.id ? resultClass(choice.id === "series") : ""}`} onClick={() => { setScenario(choice.id); setChecked(false); }}>{choice.text}</button>)}</div>
        </article>
      </div>

      <div className="practice-actions">
        <span className="draft-status">{draftStatus}</span>
        {checked && <p className={score === 7 ? "correct" : "incorrect"} aria-live="polite">{score === 7 ? "Hoàn thành xuất sắc: 7/7!" : `Đúng ${score}/7. Hãy sửa các mục màu cam rồi kiểm tra lại.`}</p>}
        <button type="button" className="secondary-button" onClick={resetPractice}>Làm lại</button>
        <button type="button" className="primary-button" disabled={completedCount < 7} onClick={() => setChecked(true)}>Kiểm tra →</button>
      </div>
    </div>
  );
}
