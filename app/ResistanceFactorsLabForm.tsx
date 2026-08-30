"use client";

import { FormEvent, useMemo, useState } from "react";
import { classNames, groupNames } from "@/lib/classes";
import type { ResistanceFactor, ResistanceFactorMeasurement } from "@/lib/experiments";
import { calculateResistance, formatResistance } from "@/lib/physics";
import MaterialBarChart from "./MaterialBarChart";
import RelationshipChart from "./RelationshipChart";

type FactorRowInput = { id: number; material: string; length: string; area: string; voltage: string; current: string };

const factorDefinitions: Array<{ key: ResistanceFactor; label: string; guidance: string; question: string }> = [
  { key: "material", label: "Ảnh hưởng của chất liệu", guidance: "So sánh mẫu 1 và mẫu 2; giữ nguyên chiều dài và tiết diện.", question: "Khi l và S không đổi, thay đổi chất liệu làm điện trở thay đổi thế nào?" },
  { key: "length", label: "Ảnh hưởng của chiều dài", guidance: "So sánh mẫu 1, mẫu 3 và mẫu 4; giữ nguyên chất liệu và tiết diện.", question: "Khi chất liệu và S không đổi, điện trở R phụ thuộc thế nào vào chiều dài l?" },
  { key: "area", label: "Ảnh hưởng của tiết diện", guidance: "So sánh mẫu 1 và mẫu 5; giữ nguyên chất liệu và chiều dài.", question: "Khi chất liệu và l không đổi, điện trở R phụ thuộc thế nào vào tiết diện S?" },
];

const sampleAssignments: Record<ResistanceFactor, number[]> = {
  material: [1, 2],
  length: [1, 3, 4],
  area: [1, 5],
};

const samplePurposes = [
  "Mẫu chuẩn dùng chung",
  "Đổi chất liệu",
  "Đổi chiều dài",
  "Đổi chiều dài",
  "Đổi tiết diện",
];

const blankRow = (id: number): FactorRowInput => ({ id, material: "", length: "", area: "", voltage: "", current: "" });
const initialRows = () => Array.from({ length: 5 }, (_, index) => blankRow(index + 1));

function parseDecimal(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function rowToMeasurement(row: FactorRowInput): ResistanceFactorMeasurement | null {
  const length = parseDecimal(row.length);
  const area = parseDecimal(row.area);
  const voltage = parseDecimal(row.voltage);
  const current = parseDecimal(row.current);
  const resistance = calculateResistance(voltage, current);
  if (
    !row.material.trim() || length === null || area === null || voltage === null || current === null || resistance === null ||
    length <= 0 || length > 10000 || area <= 0 || area > 10000 || voltage < 0 || voltage > 1000 || current > 100 || resistance > 1000000
  ) return null;
  return { sequence: row.id, material: row.material.trim(), length, area, voltage, current, resistance };
}

function rowsForInvestigation(rows: FactorRowInput[], factor: ResistanceFactor) {
  return sampleAssignments[factor].flatMap((sampleId) => {
    const row = rows.find((candidate) => candidate.id === sampleId);
    const measurement = row ? rowToMeasurement(row) : null;
    return measurement ? [measurement] : [];
  });
}

function hasControlledVariables(factor: ResistanceFactor, points: ResistanceFactorMeasurement[]) {
  if (points.length < sampleAssignments[factor].length) return false;
  const sameMaterial = new Set(points.map((point) => point.material.toLocaleLowerCase("vi"))).size === 1;
  const sameLength = new Set(points.map((point) => point.length)).size === 1;
  const sameArea = new Set(points.map((point) => point.area)).size === 1;
  return factor === "material" ? sameLength && sameArea : factor === "length" ? sameMaterial && sameArea : sameMaterial && sameLength;
}

function controlStatus(factor: ResistanceFactor, points: ResistanceFactorMeasurement[]) {
  const expectedCount = sampleAssignments[factor].length;
  if (points.length < expectedCount) return `Cần đủ ${expectedCount} mẫu hợp lệ để so sánh.`;
  return hasControlledVariables(factor, points) ? "Điều kiện đối chứng đã được giữ nguyên." : "Kiểm tra lại các đại lượng cần giữ nguyên để so sánh công bằng.";
}

export default function ResistanceFactorsLabForm() {
  const [className, setClassName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [rows, setRows] = useState<FactorRowInput[]>(initialRows);
  const [conclusions, setConclusions] = useState<Record<ResistanceFactor, string>>({ material: "", length: "", area: "" });
  const [state, setState] = useState<{ type: "idle" | "sending" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const measurements = useMemo<Record<ResistanceFactor, ResistanceFactorMeasurement[]>>(() => ({
    material: rowsForInvestigation(rows, "material"),
    length: rowsForInvestigation(rows, "length"),
    area: rowsForInvestigation(rows, "area"),
  }), [rows]);

  function updateRow(id: number, key: keyof Omit<FactorRowInput, "id">, value: string) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
    if (state.type !== "idle") setState({ type: "idle", message: "" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!className.trim() || !groupName.trim()) {
      setState({ type: "error", message: "Hãy nhập lớp và tên nhóm." });
      return;
    }
    const incompleteSample = rows.find((row) => !rowToMeasurement(row));
    if (incompleteSample) {
      setState({ type: "error", message: `Hãy kiểm tra và nhập đủ thông tin, U, I cho mẫu ${incompleteSample.id}.` });
      return;
    }
    const missingConclusion = factorDefinitions.find(({ key }) => !conclusions[key].trim());
    if (missingConclusion) {
      setState({ type: "error", message: `Hãy hoàn thành kết luận phần ${missingConclusion.label.toLowerCase()}.` });
      return;
    }

    setState({ type: "sending", message: "Đang gửi số liệu…" });
    try {
      const response = await fetch("/api/experiment-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityKey: "resistance-factors",
          className,
          groupName,
          payload: { investigations: measurements, conclusions },
          website: "",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể gửi số liệu.");
      setState({ type: "success", message: "Đã gửi đủ ba phần khảo sát cho giáo viên." });
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "Không thể gửi số liệu." });
    }
  }

  return (
    <form className="lab-card" onSubmit={handleSubmit}>
      <section className="identity-grid" aria-labelledby="factors-group-heading">
        <div className="section-heading"><span>1</span><div><h2 id="factors-group-heading">Nhóm</h2></div></div>
        <label className="field-span-2">Lớp<select required value={className} onChange={(event) => setClassName(event.target.value)}><option value="">Chọn lớp</option>{classNames.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="field-span-2">Tên nhóm<select required value={groupName} onChange={(event) => setGroupName(event.target.value)}><option value="">Chọn nhóm</option>{groupNames.map((name) => <option key={name}>{name}</option>)}</select></label>
      </section>

      <section aria-labelledby="factors-samples-heading">
        <div className="section-heading data-heading"><span>2</span><div><h2 id="factors-samples-heading">5 mẫu dây</h2><p>Nhập một lần; U, I, R được dùng chung.</p></div></div>
        <div className="sample-plan" aria-label="Cách sử dụng năm mẫu">
          {samplePurposes.map((purpose, index) => <div key={purpose + index}><strong>Mẫu {index + 1}</strong><span>{purpose}</span></div>)}
        </div>
        <div className="table-scroll">
          <table className="factor-data-table">
            <thead><tr><th>Mẫu</th><th>Chất liệu dây</th><th>Chiều dài l (m)</th><th>Tiết diện S (mm²)</th><th>U (V)</th><th>I (A)</th><th>R = U/I (Ω)</th></tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={row.id}>
                <th scope="row"><span className="sample-number">{row.id}</span></th>
                <td><input aria-label={`Mẫu ${row.id}, chất liệu`} value={row.material} onChange={(event) => updateRow(row.id, "material", event.target.value)} placeholder="Ví dụ: Đồng" /></td>
                {(["length", "area", "voltage", "current"] as const).map((key) => (
                  <td key={key}><input inputMode="decimal" aria-label={`Mẫu ${row.id}, ${key}`} value={row[key]} onChange={(event) => updateRow(row.id, key, event.target.value)} placeholder={key === "length" ? "m" : key === "area" ? "mm²" : key === "voltage" ? "V" : "A"} /></td>
                ))}
                <td className="ratio-cell"><output aria-live="polite" aria-label={`Mẫu ${row.id}, điện trở`}>{formatResistance(parseDecimal(row.voltage), parseDecimal(row.current))}</output></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="factors-investigations-heading">
        <div className="section-heading data-heading"><span>3</span><div><h2 id="factors-investigations-heading">3 lượt khảo sát</h2></div></div>
        <div className="investigation-stack">
          {factorDefinitions.map((definition, investigationIndex) => {
            const points = measurements[definition.key];
            const assignedRows = sampleAssignments[definition.key].map((id) => rows.find((row) => row.id === id)!);
            return (
              <article className="investigation-card" key={definition.key} aria-labelledby={`investigation-${definition.key}`}>
                <header className="investigation-header">
                  <span>Khảo sát {investigationIndex + 1}</span>
                  <div><h3 id={`investigation-${definition.key}`}>{definition.label}</h3><p>{definition.guidance}</p></div>
                </header>
                <div className="table-scroll">
                  <table className="factor-review-table">
                    <thead><tr><th>Mẫu</th><th>Chất liệu</th><th>l (m)</th><th>S (mm²)</th><th>U (V)</th><th>I (A)</th><th>R (Ω)</th></tr></thead>
                    <tbody>{assignedRows.map((row) => (
                      <tr key={row.id}>
                        <th scope="row">Mẫu {row.id}</th>
                        <td>{row.material || "—"}</td><td>{row.length || "—"}</td><td>{row.area || "—"}</td>
                        <td>{row.voltage || "—"}</td><td>{row.current || "—"}</td>
                        <td className="ratio-cell">{formatResistance(parseDecimal(row.voltage), parseDecimal(row.current))}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <p className={`control-status ${hasControlledVariables(definition.key, points) ? "ready" : ""}`} aria-live="polite">{controlStatus(definition.key, points)}</p>
                <div className="single-chart investigation-chart">
                  {definition.key === "material" ? <MaterialBarChart points={points} /> : (
                    <RelationshipChart
                      title={definition.key === "length" ? "Điện trở theo chiều dài dây" : "Điện trở theo tiết diện dây"}
                      xLabel={definition.key === "length" ? "Chiều dài l (m)" : "Tiết diện S (mm²)"}
                      yLabel="Điện trở R (Ω)"
                      points={points}
                      xValue={(point) => definition.key === "length" ? point.length : point.area}
                      yValue={(point) => point.resistance}
                      xCeiling={Math.max(1, ...points.map((point) => (definition.key === "length" ? point.length : point.area) * 1.2))}
                      yCeiling={Math.max(10, ...points.map((point) => point.resistance * 1.2))}
                    />
                  )}
                </div>
                <label className="conclusion-prompt">Kết luận: {definition.question}<textarea required maxLength={600} value={conclusions[definition.key]} onChange={(event) => setConclusions((current) => ({ ...current, [definition.key]: event.target.value }))} placeholder="Viết kết luận dựa trên số liệu và đồ thị của nhóm…" /></label>
              </article>
            );
          })}
        </div>
      </section>

      <div className="submit-row"><div className={`form-message ${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</div><button className="primary-button" type="submit" disabled={state.type === "sending"}>{state.type === "sending" ? "Đang gửi…" : "Nộp bài →"}</button></div>
    </form>
  );
}
