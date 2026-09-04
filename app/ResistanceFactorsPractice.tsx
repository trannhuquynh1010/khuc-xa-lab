"use client";

import { useState } from "react";
import type { ResistanceFactor } from "@/lib/experiments";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type ControlChoice = "length-area" | "material-area" | "material-length" | "";
type ControlAnswers = Record<ResistanceFactor, ControlChoice>;
type WireId = "A" | "B" | "C";
type ScaleChoice = "one-third" | "half" | "same" | "double" | "triple" | "nine" | "";
type DiagnosisChoice = "valid" | "invalid" | "";
type FixChoice = "same-voltage" | "same-length-area" | "same-current" | "";
type TruthChoice = "true" | "false" | "";
type StatementId = "material" | "length" | "area" | "thick";
type StatementAnswers = Record<StatementId, TruthChoice>;

const controlPrompts: Array<{ key: ResistanceFactor; label: string; correct: ControlChoice }> = [
  { key: "material", label: "Khảo sát chất liệu", correct: "length-area" },
  { key: "length", label: "Khảo sát chiều dài l", correct: "material-area" },
  { key: "area", label: "Khảo sát tiết diện S", correct: "material-length" },
];

const controlChoices: Array<{ id: Exclude<ControlChoice, "">; label: string }> = [
  { id: "length-area", label: "Giữ l và S không đổi" },
  { id: "material-area", label: "Giữ chất liệu và S không đổi" },
  { id: "material-length", label: "Giữ chất liệu và l không đổi" },
];

const wires: Array<{ id: WireId; length: string }> = [
  { id: "A", length: "0,5 m" },
  { id: "B", length: "1,5 m" },
  { id: "C", length: "1,0 m" },
];

const statements: Array<{ id: StatementId; text: string; answer: Exclude<TruthChoice, ""> }> = [
  { id: "material", text: "Hai dây có cùng l và S nhưng khác chất liệu có thể có điện trở khác nhau.", answer: "true" },
  { id: "length", text: "Với cùng chất liệu và tiết diện, chiều dài tăng bao nhiêu lần thì R tăng bấy nhiêu lần.", answer: "true" },
  { id: "area", text: "Với cùng chất liệu và chiều dài, R tỉ lệ thuận với tiết diện S.", answer: "false" },
  { id: "thick", text: "Hai dây cùng chất liệu, cùng chiều dài: dây dày hơn có điện trở lớn hơn.", answer: "false" },
];

const emptyControls: ControlAnswers = { material: "", length: "", area: "" };
const emptyStatements: StatementAnswers = { material: "", length: "", area: "", thick: "" };
const correctRank: WireId[] = ["A", "C", "B"];

function isControlChoice(value: unknown): value is ControlChoice {
  return value === "" || value === "length-area" || value === "material-area" || value === "material-length";
}

function isWireId(value: unknown): value is WireId {
  return value === "A" || value === "B" || value === "C";
}

function isScaleChoice(value: unknown): value is ScaleChoice {
  return value === "" || value === "one-third" || value === "half" || value === "same" || value === "double" || value === "triple" || value === "nine";
}

function isTruthChoice(value: unknown): value is TruthChoice {
  return value === "" || value === "true" || value === "false";
}

function sameOrder(left: WireId[], right: WireId[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function ChallengeHeading({ number, title, description }: { number: string; title: string; description: string }) {
  return <div className="practice-card-heading"><span>{number}</span><div><h4>{title}</h4><p>{description}</p></div></div>;
}

export default function ResistanceFactorsPractice() {
  const [controls, setControls] = useState<ControlAnswers>(emptyControls);
  const [rankOrder, setRankOrder] = useState<WireId[]>([]);
  const [lengthScale, setLengthScale] = useState<ScaleChoice>("");
  const [areaScale, setAreaScale] = useState<ScaleChoice>("");
  const [diagnosis, setDiagnosis] = useState<DiagnosisChoice>("");
  const [fix, setFix] = useState<FixChoice>("");
  const [statementAnswers, setStatementAnswers] = useState<StatementAnswers>(emptyStatements);
  const [checked, setChecked] = useState(false);
  const { draftStatus } = useDeviceDraft(
    deviceDraftKey("resistance-factors-practice"),
    { controls, rankOrder, lengthScale, areaScale, diagnosis, fix, statementAnswers },
    (value) => {
      if (!isDraftRecord(value)) return;
      if (isDraftRecord(value.controls)) {
        setControls({
          material: isControlChoice(value.controls.material) ? value.controls.material : "",
          length: isControlChoice(value.controls.length) ? value.controls.length : "",
          area: isControlChoice(value.controls.area) ? value.controls.area : "",
        });
      }
      if (Array.isArray(value.rankOrder)) setRankOrder(value.rankOrder.filter(isWireId));
      if (isScaleChoice(value.lengthScale)) setLengthScale(value.lengthScale);
      if (isScaleChoice(value.areaScale)) setAreaScale(value.areaScale);
      if (value.diagnosis === "valid" || value.diagnosis === "invalid") setDiagnosis(value.diagnosis);
      if (value.fix === "same-voltage" || value.fix === "same-length-area" || value.fix === "same-current") setFix(value.fix);
      if (isDraftRecord(value.statementAnswers)) {
        setStatementAnswers({
          material: isTruthChoice(value.statementAnswers.material) ? value.statementAnswers.material : "",
          length: isTruthChoice(value.statementAnswers.length) ? value.statementAnswers.length : "",
          area: isTruthChoice(value.statementAnswers.area) ? value.statementAnswers.area : "",
          thick: isTruthChoice(value.statementAnswers.thick) ? value.statementAnswers.thick : "",
        });
      }
    },
  );

  const completedChallenges = Number(Object.values(controls).every(Boolean))
    + Number(rankOrder.length === wires.length)
    + Number(Boolean(lengthScale) && Boolean(areaScale))
    + Number(Boolean(diagnosis) && Boolean(fix))
    + Number(Object.values(statementAnswers).every(Boolean));
  const controlScore = controlPrompts.filter((prompt) => controls[prompt.key] === prompt.correct).length;
  const statementScore = statements.filter((statement) => statementAnswers[statement.id] === statement.answer).length;
  const score = controlScore
    + Number(sameOrder(rankOrder, correctRank))
    + Number(lengthScale === "triple")
    + Number(areaScale === "half")
    + Number(diagnosis === "invalid")
    + Number(fix === "same-length-area")
    + statementScore;

  const resultClass = (correct: boolean) => checked ? correct ? "practice-correct" : "practice-incorrect" : "";

  function selectControl(factor: ResistanceFactor, choice: Exclude<ControlChoice, "">) {
    setControls((current) => ({ ...current, [factor]: choice }));
    setChecked(false);
  }

  function addWire(id: WireId) {
    setRankOrder((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setChecked(false);
  }

  function answerStatement(id: StatementId, answer: Exclude<TruthChoice, "">) {
    setStatementAnswers((current) => ({ ...current, [id]: answer }));
    setChecked(false);
  }

  function resetPractice() {
    setControls(emptyControls);
    setRankOrder([]);
    setLengthScale("");
    setAreaScale("");
    setDiagnosis("");
    setFix("");
    setStatementAnswers(emptyStatements);
    setChecked(false);
  }

  return (
    <div className="electric-practice resistance-factors-practice">
      <div className="practice-intro factors-practice-intro">
        <div><p className="eyebrow">LUYỆN TẬP SAU BÀI HỌC</p><h3>Mật mã điện trở</h3><p>Vận dụng ba quy luật về chất liệu, chiều dài và tiết diện.</p></div>
        <strong>{completedChallenges}/5</strong>
      </div>

      <div className="practice-grid">
        <article className="practice-card practice-card-wide">
          <ChallengeHeading number="01" title="Khóa biến thí nghiệm" description="Chọn hai đại lượng phải giữ không đổi." />
          <div className="control-variable-grid">
            {controlPrompts.map((prompt) => (
              <div key={prompt.key} className={controls[prompt.key] ? resultClass(controls[prompt.key] === prompt.correct) : ""}>
                <strong>{prompt.label}</strong>
                <div role="group" aria-label={prompt.label}>
                  {controlChoices.map((choice) => <button key={choice.id} type="button" aria-pressed={controls[prompt.key] === choice.id} className={controls[prompt.key] === choice.id ? "selected" : ""} onClick={() => selectControl(prompt.key, choice.id)}>{choice.label}</button>)}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="practice-card">
          <ChallengeHeading number="02" title="Xếp hạng điện trở" description="Ba dây cùng chất liệu và cùng S." />
          <p>Chạm các dây theo thứ tự <b>R tăng dần</b>. Chạm lại để bỏ chọn.</p>
          <div className="wire-rank-bank" role="group" aria-label="Chọn thứ tự điện trở tăng dần">
            {wires.map((wire) => {
              const position = rankOrder.indexOf(wire.id);
              return <button key={wire.id} type="button" aria-pressed={position >= 0} className={position >= 0 ? "selected" : ""} onClick={() => addWire(wire.id)}><b>Dây {wire.id}</b><span>l = {wire.length}</span><small>{position >= 0 ? `Vị trí ${position + 1}` : "Chọn"}</small></button>;
            })}
          </div>
          <div className={`rank-result ${rankOrder.length === wires.length ? resultClass(sameOrder(rankOrder, correctRank)) : ""}`}><span>R nhỏ</span><strong>{rankOrder.length ? rankOrder.join(" → ") : "— → — → —"}</strong><span>R lớn</span></div>
        </article>

        <article className="practice-card">
          <ChallengeHeading number="03" title="Mật mã tỉ lệ" description="Không cần biết giá trị R ban đầu." />
          <div className="scale-puzzle-list">
            <div className={lengthScale ? resultClass(lengthScale === "triple") : ""}>
              <p>Cùng chất liệu, cùng S: l tăng từ 20 cm lên 60 cm thì R…</p>
              <div role="group" aria-label="Điện trở khi chiều dài tăng ba lần">
                {([['same', 'không đổi'], ['triple', 'gấp 3'], ['nine', 'gấp 9']] as Array<[Exclude<ScaleChoice, "">, string]>).map(([id, label]) => <button key={id} type="button" aria-pressed={lengthScale === id} className={lengthScale === id ? "selected" : ""} onClick={() => { setLengthScale(id); setChecked(false); }}>{label}</button>)}
              </div>
            </div>
            <div className={areaScale ? resultClass(areaScale === "half") : ""}>
              <p>Cùng chất liệu, cùng l: S tăng từ 0,5 mm² lên 1,0 mm² thì R…</p>
              <div role="group" aria-label="Điện trở khi tiết diện tăng hai lần">
                {([['double', 'gấp 2'], ['half', 'còn 1/2'], ['same', 'không đổi']] as Array<[Exclude<ScaleChoice, "">, string]>).map(([id, label]) => <button key={id} type="button" aria-pressed={areaScale === id} className={areaScale === id ? "selected" : ""} onClick={() => { setAreaScale(id); setChecked(false); }}>{label}</button>)}
              </div>
            </div>
          </div>
        </article>

        <article className="practice-card practice-card-wide">
          <ChallengeHeading number="04" title="Bắt lỗi báo cáo" description="Đánh giá phép so sánh của một nhóm học sinh." />
          <div className="comparison-scenario">
            <div><b>Dây A · Đồng</b><span>l = 1,0 m</span><span>S = 0,50 mm²</span><strong>R = 0,08 Ω</strong></div>
            <span aria-hidden="true">VS</span>
            <div><b>Dây B · Nicrom</b><span>l = 2,0 m</span><span>S = 0,25 mm²</span><strong>R = 8,80 Ω</strong></div>
          </div>
          <p>Nhóm kết luận: “Nicrom có điện trở lớn hơn đồng vì khác chất liệu.” Kết luận này có đủ căn cứ không?</p>
          <div className="diagnosis-grid">
            <div className={diagnosis ? resultClass(diagnosis === "invalid") : ""} role="group" aria-label="Đánh giá kết luận của nhóm">
              <button type="button" aria-pressed={diagnosis === "valid"} className={diagnosis === "valid" ? "selected" : ""} onClick={() => { setDiagnosis("valid"); setChecked(false); }}>Đủ căn cứ</button>
              <button type="button" aria-pressed={diagnosis === "invalid"} className={diagnosis === "invalid" ? "selected" : ""} onClick={() => { setDiagnosis("invalid"); setChecked(false); }}>Chưa đủ căn cứ</button>
            </div>
            <div className={fix ? resultClass(fix === "same-length-area") : ""} role="group" aria-label="Cách sửa phép so sánh">
              <button type="button" aria-pressed={fix === "same-voltage"} className={fix === "same-voltage" ? "selected" : ""} onClick={() => { setFix("same-voltage"); setChecked(false); }}>Chỉ cần cùng U</button>
              <button type="button" aria-pressed={fix === "same-length-area"} className={fix === "same-length-area" ? "selected" : ""} onClick={() => { setFix("same-length-area"); setChecked(false); }}>Phải cùng l và S</button>
              <button type="button" aria-pressed={fix === "same-current"} className={fix === "same-current" ? "selected" : ""} onClick={() => { setFix("same-current"); setChecked(false); }}>Chỉ cần cùng I</button>
            </div>
          </div>
        </article>

        <article className="practice-card practice-card-wide">
          <ChallengeHeading number="05" title="Phòng kiểm định đúng – sai" description="Đánh giá từng phát biểu bằng kiến thức đã học." />
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
        {checked ? <p className={score === 12 ? "correct" : "incorrect"} aria-live="polite">{score === 12 ? "Giải mã hoàn hảo: 12/12!" : `Đúng ${score}/12. Hãy xem lại các mục màu cam.`}</p> : null}
        <button type="button" className="secondary-button" onClick={resetPractice}>Làm lại</button>
        <button type="button" className="primary-button" disabled={completedChallenges < 5} onClick={() => setChecked(true)}>Kiểm tra →</button>
      </div>
    </div>
  );
}
