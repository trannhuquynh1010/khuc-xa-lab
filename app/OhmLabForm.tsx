"use client";

import { FormEvent, useMemo, useState } from "react";
import type { OhmMeasurement } from "@/lib/experiments";
import { calculateResistance, formatResistance } from "@/lib/physics";
import RelationshipChart from "./RelationshipChart";

type InputRow = { id: number; voltage: string; current: string };
const blankRow = (id: number): InputRow => ({ id, voltage: "", current: "" });

function parseDecimal(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function rowsToMeasurements(rows: InputRow[]): OhmMeasurement[] {
  return rows.flatMap((row, index) => {
    const voltage = parseDecimal(row.voltage);
    const current = parseDecimal(row.current);
    if (voltage === null || current === null || voltage < 0 || voltage > 1000 || current < 0 || current > 100) return [];
    return [{ sequence: index + 1, voltage, current }];
  });
}

export default function OhmLabForm() {
  const [className, setClassName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [resistorName, setResistorName] = useState("");
  const [rows, setRows] = useState<InputRow[]>(() => Array.from({ length: 5 }, (_, index) => blankRow(index + 1)));
  const [state, setState] = useState<{ type: "idle" | "sending" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const measurements = useMemo(() => rowsToMeasurements(rows), [rows]);
  const resistances = measurements.flatMap((item) => {
    const value = calculateResistance(item.voltage, item.current);
    return value === null ? [] : [value];
  });
  const averageResistance = resistances.length ? resistances.reduce((sum, value) => sum + value, 0) / resistances.length : null;

  function updateRow(id: number, key: "voltage" | "current", value: string) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
    if (state.type !== "idle") setState({ type: "idle", message: "" });
  }

  function addRow() {
    setRows((current) => [...current, blankRow(Math.max(0, ...current.map((row) => row.id)) + 1)]);
  }

  function removeRow(id: number) {
    setRows((current) => current.length === 1 ? current : current.filter((row) => row.id !== id));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasPartialRow = rows.some((row) => [row.voltage, row.current].filter((value) => value.trim()).length === 1);
    if (!className.trim() || !groupName.trim() || !resistorName.trim()) {
      setState({ type: "error", message: "Hãy nhập lớp, tên nhóm và tên điện trở khảo sát." });
      return;
    }
    if (hasPartialRow) {
      setState({ type: "error", message: "Có một lần đo chưa nhập đủ U và I." });
      return;
    }
    if (measurements.length < 2 || !resistances.length) {
      setState({ type: "error", message: "Hãy nhập ít nhất hai lần đo hợp lệ, trong đó có I lớn hơn 0." });
      return;
    }

    setState({ type: "sending", message: "Đang gửi số liệu…" });
    try {
      const response = await fetch("/api/experiment-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityKey: "ohm",
          className,
          groupName,
          payload: { resistorName, measurements },
          website: "",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể gửi số liệu.");
      setState({ type: "success", message: `Đã gửi thành công ${measurements.length} lần đo cho giáo viên.` });
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "Không thể gửi số liệu." });
    }
  }

  return (
    <form className="lab-card" onSubmit={handleSubmit}>
      <section className="identity-grid" aria-labelledby="ohm-group-heading">
        <div className="section-heading"><span>1</span><div><h2 id="ohm-group-heading">Thông tin thí nghiệm</h2><p>Ghi rõ nhóm và điện trở đang khảo sát.</p></div></div>
        <label>Lớp<input required maxLength={30} value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Ví dụ: 9A1" /></label>
        <label>Tên nhóm<input required maxLength={60} value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Ví dụ: Nhóm 3" /></label>
        <label className="field-span-2">Điện trở hoặc dây dẫn khảo sát<input required maxLength={80} value={resistorName} onChange={(event) => setResistorName(event.target.value)} placeholder="Ví dụ: Điện trở R1" /></label>
      </section>

      <section aria-labelledby="ohm-data-heading">
        <div className="section-heading data-heading"><span>2</span><div><h2 id="ohm-data-heading">Số liệu U – I</h2><p>Nhập số đo; điện trở R = U/I được tính tự động.</p></div><button type="button" className="secondary-button" onClick={addRow}>+ Thêm lần đo</button></div>
        <div className="table-scroll">
          <table className="compact-data-table">
            <thead><tr><th>Lần đo</th><th>Hiệu điện thế U (V)</th><th>Cường độ dòng điện I (A)</th><th>Điện trở R (Ω)</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
            <tbody>{rows.map((row, index) => (
              <tr key={row.id}>
                <th scope="row">{index + 1}</th>
                <td><input inputMode="decimal" aria-label={`Lần đo ${index + 1}, hiệu điện thế U`} value={row.voltage} onChange={(event) => updateRow(row.id, "voltage", event.target.value)} placeholder="V" /></td>
                <td><input inputMode="decimal" aria-label={`Lần đo ${index + 1}, cường độ dòng điện I`} value={row.current} onChange={(event) => updateRow(row.id, "current", event.target.value)} placeholder="A" /></td>
                <td className="ratio-cell"><output aria-live="polite">{formatResistance(parseDecimal(row.voltage), parseDecimal(row.current))}</output></td>
                <td><button type="button" className="icon-button" onClick={() => removeRow(row.id)} disabled={rows.length === 1} aria-label={`Xóa lần đo ${index + 1}`}>×</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="result-strip"><span>Điểm dữ liệu hoàn chỉnh: <strong>{measurements.length}</strong></span><span>Điện trở trung bình: <strong>{averageResistance === null ? "—" : `${averageResistance.toFixed(2)} Ω`}</strong></span></div>
      </section>

      <section aria-labelledby="ohm-chart-heading">
        <div className="section-heading"><span>3</span><div><h2 id="ohm-chart-heading">Đồ thị định luật Ohm</h2><p>Nếu điện trở không đổi, các điểm U – I gần nằm trên một đường thẳng.</p></div></div>
        <div className="single-chart">
          <RelationshipChart title="Cường độ dòng điện theo hiệu điện thế" xLabel="Hiệu điện thế U (V)" yLabel="Cường độ dòng điện I (A)" points={measurements} xValue={(point) => point.voltage} yValue={(point) => point.current} xCeiling={Math.max(5, ...measurements.map((point) => point.voltage * 1.2))} yCeiling={Math.max(1, ...measurements.map((point) => point.current * 1.2))} />
        </div>
      </section>

      <div className="submit-row"><div className={`form-message ${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</div><button className="primary-button" type="submit" disabled={state.type === "sending"}>{state.type === "sending" ? "Đang gửi…" : "Gửi số liệu cho giáo viên"}</button></div>
    </form>
  );
}
