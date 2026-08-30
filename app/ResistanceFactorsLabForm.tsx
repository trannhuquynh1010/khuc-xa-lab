"use client";

import { FormEvent, useMemo, useState } from "react";
import { classNames, groupNames } from "@/lib/classes";
import type { ResistanceFactor, ResistanceFactorMeasurement } from "@/lib/experiments";
import { calculateResistance, formatResistance } from "@/lib/physics";
import MaterialBarChart from "./MaterialBarChart";
import RelationshipChart from "./RelationshipChart";

type FactorRowInput = { id: number; material: string; length: string; area: string; voltage: string; current: string };

const factorDefinitions: Array<{ key: ResistanceFactor; label: string; guidance: string; question: string }> = [
  { key: "material", label: "Chất liệu", guidance: "Thay đổi chất liệu; giữ nguyên chiều dài và tiết diện.", question: "Khi l và S không đổi, thay đổi chất liệu làm điện trở thay đổi thế nào?" },
  { key: "length", label: "Chiều dài", guidance: "Thay đổi chiều dài; giữ nguyên chất liệu và tiết diện.", question: "Khi chất liệu và S không đổi, điện trở R phụ thuộc thế nào vào chiều dài l?" },
  { key: "area", label: "Tiết diện", guidance: "Thay đổi tiết diện; giữ nguyên chất liệu và chiều dài.", question: "Khi chất liệu và l không đổi, điện trở R phụ thuộc thế nào vào tiết diện S?" },
];

const blankRow = (id: number): FactorRowInput => ({ id, material: "", length: "", area: "", voltage: "", current: "" });
const initialRows = () => Array.from({ length: 3 }, (_, index) => blankRow(index + 1));

function parseDecimal(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function rowsToMeasurements(rows: FactorRowInput[]): ResistanceFactorMeasurement[] {
  return rows.flatMap((row, index) => {
  const length = parseDecimal(row.length);
  const area = parseDecimal(row.area);
  const voltage = parseDecimal(row.voltage);
  const current = parseDecimal(row.current);
  const resistance = calculateResistance(voltage, current);
  if (
      !row.material.trim() || length === null || area === null || voltage === null || current === null || resistance === null ||
      length <= 0 || length > 10000 || area <= 0 || area > 10000 || voltage < 0 || voltage > 1000 || current > 100 || resistance > 1000000
    ) return [];
    return [{ sequence: index + 1, material: row.material.trim(), length, area, voltage, current, resistance }];
  });
}

function hasControlledVariables(factor: ResistanceFactor, points: ResistanceFactorMeasurement[]) {
  if (points.length < 2) return false;
  const sameMaterial = new Set(points.map((point) => point.material.toLocaleLowerCase("vi"))).size === 1;
  const sameLength = new Set(points.map((point) => point.length)).size === 1;
  const sameArea = new Set(points.map((point) => point.area)).size === 1;
  return factor === "material" ? sameLength && sameArea : factor === "length" ? sameMaterial && sameArea : sameMaterial && sameLength;
}

function controlStatus(factor: ResistanceFactor, points: ResistanceFactorMeasurement[]) {
  if (points.length < 2) return "Cần ít nhất hai mẫu để so sánh.";
  return hasControlledVariables(factor, points) ? "Điều kiện đối chứng đã được giữ nguyên." : "Kiểm tra lại các đại lượng cần giữ nguyên để so sánh công bằng.";
}

export default function ResistanceFactorsLabForm() {
  const [className, setClassName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [activeFactor, setActiveFactor] = useState<ResistanceFactor>("material");
  const [rows, setRows] = useState<Record<ResistanceFactor, FactorRowInput[]>>(() => ({ material: initialRows(), length: initialRows(), area: initialRows() }));
  const [conclusions, setConclusions] = useState<Record<ResistanceFactor, string>>({ material: "", length: "", area: "" });
  const [state, setState] = useState<{ type: "idle" | "sending" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const measurements = useMemo(() => ({
    material: rowsToMeasurements(rows.material),
    length: rowsToMeasurements(rows.length),
    area: rowsToMeasurements(rows.area),
  }), [rows]);
  const currentPoints = measurements[activeFactor];
  const activeDefinition = factorDefinitions.find((factor) => factor.key === activeFactor)!;

  function updateRow(factor: ResistanceFactor, id: number, key: keyof Omit<FactorRowInput, "id">, value: string) {
    setRows((current) => ({
      ...current,
      [factor]: current[factor].map((row) => row.id === id ? { ...row, [key]: value } : row),
    }));
    if (state.type !== "idle") setState({ type: "idle", message: "" });
  }

  function addRow() {
    setRows((current) => ({
      ...current,
      [activeFactor]: [...current[activeFactor], blankRow(Math.max(0, ...current[activeFactor].map((row) => row.id)) + 1)],
    }));
  }

  function removeRow(id: number) {
    setRows((current) => ({
      ...current,
      [activeFactor]: current[activeFactor].length === 1 ? current[activeFactor] : current[activeFactor].filter((row) => row.id !== id),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!className.trim() || !groupName.trim()) {
      setState({ type: "error", message: "Hãy nhập lớp và tên nhóm." });
      return;
    }
    const hasPartialRow = factorDefinitions.some(({ key }) => rows[key].some((row) => {
      const values = [row.material, row.length, row.area, row.voltage, row.current];
      const filled = values.filter((value) => value.trim()).length;
      return filled > 0 && filled < values.length;
    }));
    if (hasPartialRow) {
      setState({ type: "error", message: "Có mẫu dây chưa được nhập đủ chất liệu, l, S, U và I." });
      return;
    }
    const incompleteFactor = factorDefinitions.find(({ key }) => measurements[key].length < 2);
    if (incompleteFactor) {
      setActiveFactor(incompleteFactor.key);
      setState({ type: "error", message: `Phần ${incompleteFactor.label.toLowerCase()} cần ít nhất hai mẫu hợp lệ.` });
      return;
    }
    const missingConclusion = factorDefinitions.find(({ key }) => !conclusions[key].trim());
    if (missingConclusion) {
      setActiveFactor(missingConclusion.key);
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
        <div className="section-heading"><span>1</span><div><h2 id="factors-group-heading">Thông tin nhóm</h2><p>Hoàn thành cả ba phần khảo sát trước khi nộp.</p></div></div>
        <label className="field-span-2">Lớp<select required value={className} onChange={(event) => setClassName(event.target.value)}><option value="">Chọn lớp</option>{classNames.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="field-span-2">Tên nhóm<select required value={groupName} onChange={(event) => setGroupName(event.target.value)}><option value="">Chọn nhóm</option>{groupNames.map((name) => <option key={name}>{name}</option>)}</select></label>
      </section>

      <section aria-labelledby="factors-data-heading">
        <div className="section-heading data-heading"><span>2</span><div><h2 id="factors-data-heading">Khảo sát từng yếu tố</h2><p>Nhập số đo U, I; điện trở R = U/I được tính tự động.</p></div></div>
        <div className="factor-tabs" role="tablist" aria-label="Yếu tố khảo sát">
          {factorDefinitions.map((factor) => (
            <button key={factor.key} type="button" role="tab" aria-selected={activeFactor === factor.key} className={activeFactor === factor.key ? "active" : ""} onClick={() => setActiveFactor(factor.key)}>
              {factor.label}<span>{measurements[factor.key].length} mẫu{conclusions[factor.key].trim() ? " · đã kết luận" : ""}</span>
            </button>
          ))}
        </div>

        <div className="factor-toolbar"><div><strong>{activeDefinition.label}</strong><p>{activeDefinition.guidance}</p></div><button type="button" className="secondary-button" onClick={addRow}>+ Thêm mẫu dây</button></div>
        <div className="table-scroll" role="tabpanel">
          <table className="factor-data-table">
            <thead><tr><th>Mẫu</th><th>Chất liệu dây</th><th>Chiều dài l (m)</th><th>Tiết diện S (mm²)</th><th>U (V)</th><th>I (A)</th><th>R = U/I (Ω)</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
            <tbody>{rows[activeFactor].map((row, index) => (
              <tr key={row.id}>
                <th scope="row">{index + 1}</th>
                <td><input aria-label={`${activeDefinition.label}, mẫu ${index + 1}, chất liệu`} value={row.material} onChange={(event) => updateRow(activeFactor, row.id, "material", event.target.value)} placeholder="Ví dụ: Đồng" /></td>
                {(["length", "area", "voltage", "current"] as const).map((key) => (
                  <td key={key}><input inputMode="decimal" aria-label={`${activeDefinition.label}, mẫu ${index + 1}, ${key}`} value={row[key]} onChange={(event) => updateRow(activeFactor, row.id, key, event.target.value)} placeholder={key === "length" ? "m" : key === "area" ? "mm²" : key === "voltage" ? "V" : "A"} /></td>
                ))}
                <td className="ratio-cell"><output aria-live="polite" aria-label={`${activeDefinition.label}, mẫu ${index + 1}, điện trở`}>{formatResistance(parseDecimal(row.voltage), parseDecimal(row.current))}</output></td>
                <td><button type="button" className="icon-button" onClick={() => removeRow(row.id)} disabled={rows[activeFactor].length === 1} aria-label={`Xóa mẫu ${index + 1}`}>×</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className={`control-status ${hasControlledVariables(activeFactor, currentPoints) ? "ready" : ""}`} aria-live="polite">{controlStatus(activeFactor, currentPoints)}</p>
      </section>

      <section aria-labelledby="factors-chart-heading">
        <div className="section-heading"><span>3</span><div><h2 id="factors-chart-heading">So sánh kết quả</h2><p>Đồ thị thay đổi theo phần khảo sát đang chọn.</p></div></div>
        <div className="single-chart">
          {activeFactor === "material" ? <MaterialBarChart points={currentPoints} /> : (
            <RelationshipChart
              title={activeFactor === "length" ? "Điện trở theo chiều dài dây" : "Điện trở theo tiết diện dây"}
              xLabel={activeFactor === "length" ? "Chiều dài l (m)" : "Tiết diện S (mm²)"}
              yLabel="Điện trở R (Ω)"
              points={currentPoints}
              xValue={(point) => activeFactor === "length" ? point.length : point.area}
              yValue={(point) => point.resistance}
              xCeiling={Math.max(1, ...currentPoints.map((point) => (activeFactor === "length" ? point.length : point.area) * 1.2))}
              yCeiling={Math.max(10, ...currentPoints.map((point) => point.resistance * 1.2))}
            />
          )}
          <label className="conclusion-prompt">Kết luận: {activeDefinition.question}<textarea required maxLength={600} value={conclusions[activeFactor]} onChange={(event) => setConclusions((current) => ({ ...current, [activeFactor]: event.target.value }))} placeholder="Viết kết luận dựa trên số liệu và đồ thị của nhóm…" /></label>
        </div>
      </section>

      <div className="submit-row"><div className={`form-message ${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</div><button className="primary-button" type="submit" disabled={state.type === "sending"}>{state.type === "sending" ? "Đang gửi…" : "Gửi ba phần khảo sát"}</button></div>
    </form>
  );
}
