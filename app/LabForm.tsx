"use client";

import { FormEvent, useMemo, useState } from "react";

type InputRow = {
  id: number;
  i: string;
  r: string;
  sinI: string;
  sinR: string;
};

type Point = {
  sequence: number;
  incidenceAngle: number;
  refractionAngle: number;
  sinIncidence: number;
  sinRefraction: number;
};

const blankRow = (id: number): InputRow => ({ id, i: "", r: "", sinI: "", sinR: "" });

function parseDecimal(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function rowsToPoints(rows: InputRow[]) {
  return rows.flatMap((row, index) => {
    const values = [row.i, row.r, row.sinI, row.sinR].map(parseDecimal);
    if (values.some((value) => value === null)) return [];
    const [incidenceAngle, refractionAngle, sinIncidence, sinRefraction] = values as number[];
    if (
      incidenceAngle < 0 || incidenceAngle > 90 ||
      refractionAngle < 0 || refractionAngle > 90 ||
      sinIncidence < 0 || sinIncidence > 1 ||
      sinRefraction < 0 || sinRefraction > 1
    ) return [];
    return [{ sequence: index + 1, incidenceAngle, refractionAngle, sinIncidence, sinRefraction }];
  });
}

function RelationshipChart({
  title,
  xLabel,
  yLabel,
  points,
  xValue,
  yValue,
  ceiling,
}: {
  title: string;
  xLabel: string;
  yLabel: string;
  points: Point[];
  xValue: (point: Point) => number;
  yValue: (point: Point) => number;
  ceiling: number;
}) {
  const width = 520;
  const height = 300;
  const margin = { top: 18, right: 20, bottom: 52, left: 62 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const maxX = points.length ? Math.max(...points.map(xValue)) : ceiling;
  const maxY = points.length ? Math.max(...points.map(yValue)) : ceiling;
  const domainX = Math.min(ceiling, Math.max(ceiling * 0.2, maxX * 1.12));
  const domainY = Math.min(ceiling, Math.max(ceiling * 0.2, maxY * 1.12));
  const x = (value: number) => margin.left + (value / domainX) * innerWidth;
  const y = (value: number) => margin.top + innerHeight - (value / domainY) * innerHeight;
  const ticks = Array.from({ length: 6 }, (_, index) => index / 5);
  const sorted = [...points].sort((a, b) => xValue(a) - xValue(b));
  const line = sorted.map((point) => `${x(xValue(point))},${y(yValue(point))}`).join(" ");
  const format = (value: number) => ceiling === 1 ? value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "") : value.toFixed(0);

  return (
    <section className="chart-panel" aria-label={title}>
      <h3>{title}</h3>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. Có ${points.length} điểm dữ liệu.`}>
        <rect className="plot-frame" x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} />
        {ticks.map((tick) => {
          const tickY = margin.top + innerHeight - tick * innerHeight;
          return (
            <g key={`y-${tick}`}>
              <line className="grid-line" x1={margin.left} x2={width - margin.right} y1={tickY} y2={tickY} />
              <text className="tick-label" x={margin.left - 10} y={tickY + 4} textAnchor="end">{format(tick * domainY)}</text>
            </g>
          );
        })}
        {ticks.map((tick) => {
          const tickX = margin.left + tick * innerWidth;
          return <text className="tick-label" key={`x-${tick}`} x={tickX} y={height - 30} textAnchor="middle">{format(tick * domainX)}</text>;
        })}
        {sorted.length > 1 && <polyline className="data-line" points={line} />}
        {points.map((point) => (
          <g key={point.sequence}>
            <circle className="data-point" cx={x(xValue(point))} cy={y(yValue(point))} r="5" />
            <text className="point-label" x={x(xValue(point)) + 8} y={y(yValue(point)) - 8}>{point.sequence}</text>
          </g>
        ))}
        {!points.length && <text className="empty-chart" x={margin.left + innerWidth / 2} y={margin.top + innerHeight / 2} textAnchor="middle">Chưa có số liệu</text>}
        <text className="axis-label" x={margin.left + innerWidth / 2} y={height - 5} textAnchor="middle">{xLabel}</text>
        <text className="axis-label" transform={`translate(16 ${margin.top + innerHeight / 2}) rotate(-90)`} textAnchor="middle">{yLabel}</text>
      </svg>
    </section>
  );
}

export default function LabForm() {
  const [className, setClassName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [rows, setRows] = useState<InputRow[]>(() => Array.from({ length: 5 }, (_, index) => blankRow(index + 1)));
  const [state, setState] = useState<{ type: "idle" | "sending" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const points = useMemo(() => rowsToPoints(rows), [rows]);

  function updateRow(id: number, key: keyof Omit<InputRow, "id">, value: string) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
    if (state.type !== "idle") setState({ type: "idle", message: "" });
  }

  function addRow() {
    const nextId = Math.max(0, ...rows.map((row) => row.id)) + 1;
    setRows((current) => [...current, blankRow(nextId)]);
  }

  function removeRow(id: number) {
    setRows((current) => current.length === 1 ? current : current.filter((row) => row.id !== id));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasPartialRow = rows.some((row) => {
      const filled = [row.i, row.r, row.sinI, row.sinR].filter((value) => value.trim()).length;
      return filled > 0 && filled < 4;
    });

    if (!className.trim() || !groupName.trim()) {
      setState({ type: "error", message: "Hãy nhập lớp và tên nhóm." });
      return;
    }
    if (hasPartialRow) {
      setState({ type: "error", message: "Có một lần đo chưa nhập đủ bốn giá trị." });
      return;
    }
    if (!points.length) {
      setState({ type: "error", message: "Hãy nhập ít nhất một lần đo hợp lệ." });
      return;
    }

    setState({ type: "sending", message: "Đang gửi số liệu…" });
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ className, groupName, measurements: points, website: "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể gửi số liệu.");
      setState({ type: "success", message: `Đã gửi thành công ${points.length} lần đo cho giáo viên.` });
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "Không thể gửi số liệu." });
    }
  }

  return (
    <form className="lab-card" onSubmit={handleSubmit}>
      <section className="identity-grid" aria-labelledby="group-heading">
        <div className="section-heading">
          <span>1</span>
          <div><h2 id="group-heading">Thông tin nhóm</h2><p>Điền thông tin để giáo viên nhận đúng bài.</p></div>
        </div>
        <label>Lớp<input required maxLength={30} value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Ví dụ: 9A1" /></label>
        <label>Tên nhóm<input required maxLength={60} value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Ví dụ: Nhóm 3" /></label>
      </section>

      <section aria-labelledby="data-heading">
        <div className="section-heading data-heading">
          <span>2</span>
          <div><h2 id="data-heading">Số liệu thí nghiệm</h2><p>Tự tính và nhập các giá trị sin; có thể dùng dấu phẩy hoặc dấu chấm.</p></div>
          <button type="button" className="secondary-button" onClick={addRow}>+ Thêm lần đo</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Lần đo</th><th>Góc tới i (°)</th><th>Góc khúc xạ r (°)</th><th>sin i</th><th>sin r</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <th scope="row">{index + 1}</th>
                  {(["i", "r", "sinI", "sinR"] as const).map((key) => (
                    <td key={key}><input inputMode="decimal" aria-label={`Lần đo ${index + 1}, ${key}`} value={row[key]} onChange={(event) => updateRow(row.id, key, event.target.value)} placeholder={key === "i" || key === "r" ? "0–90" : "0–1"} /></td>
                  ))}
                  <td><button type="button" className="icon-button" onClick={() => removeRow(row.id)} disabled={rows.length === 1} aria-label={`Xóa lần đo ${index + 1}`}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="data-status" aria-live="polite">Đã vẽ {points.length} điểm dữ liệu hoàn chỉnh.</p>
      </section>

      <section aria-labelledby="chart-heading">
        <div className="section-heading"><span>3</span><div><h2 id="chart-heading">Đồ thị kết quả</h2><p>Điểm trên đồ thị được đánh số theo lần đo.</p></div></div>
        <div className="chart-grid">
          <RelationshipChart title="Góc tới và góc khúc xạ" xLabel="Góc tới i (°)" yLabel="Góc khúc xạ r (°)" points={points} xValue={(point) => point.incidenceAngle} yValue={(point) => point.refractionAngle} ceiling={90} />
          <RelationshipChart title="sin i và sin r" xLabel="sin i" yLabel="sin r" points={points} xValue={(point) => point.sinIncidence} yValue={(point) => point.sinRefraction} ceiling={1} />
        </div>
      </section>

      <div className="submit-row">
        <div className={`form-message ${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</div>
        <button className="primary-button" type="submit" disabled={state.type === "sending"}>{state.type === "sending" ? "Đang gửi…" : "Gửi số liệu cho giáo viên"}</button>
      </div>
    </form>
  );
}

