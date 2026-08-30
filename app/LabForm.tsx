"use client";

import { FormEvent, useMemo, useState } from "react";
import { classNames, groupNames } from "@/lib/classes";
import { formatSineRatio } from "@/lib/physics";
import { createEmptyTeamAssignments, isTeamAssignments, type TeamTaskKey } from "@/lib/team";
import RelationshipChart from "./RelationshipChart";
import RefractionConstructionGuide from "./RefractionConstructionGuide";
import TeamAssignmentsFields from "./TeamAssignmentsFields";

type InputRow = {
  id: number;
  i: string;
  r: string;
  sinI: string;
  sinR: string;
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

export default function LabForm() {
  const [className, setClassName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [teamAssignments, setTeamAssignments] = useState(createEmptyTeamAssignments);
  const [incidenceMedium, setIncidenceMedium] = useState("");
  const [refractionMedium, setRefractionMedium] = useState("");
  const [conclusionAngles, setConclusionAngles] = useState("");
  const [conclusionSines, setConclusionSines] = useState("");
  const [rows, setRows] = useState<InputRow[]>(() => Array.from({ length: 5 }, (_, index) => blankRow(index + 1)));
  const [state, setState] = useState<{ type: "idle" | "sending" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const points = useMemo(() => rowsToPoints(rows), [rows]);

  function updateRow(id: number, key: keyof Omit<InputRow, "id">, value: string) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
    if (state.type !== "idle") setState({ type: "idle", message: "" });
  }

  function updateTeamAssignment(task: TeamTaskKey, memberName: string) {
    setTeamAssignments((current) => ({ ...current, [task]: memberName }));
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
    if (!isTeamAssignments(teamAssignments)) {
      setState({ type: "error", message: "Hãy phân công thành viên cho đủ bốn nhiệm vụ." });
      return;
    }
    if (!incidenceMedium.trim() || !refractionMedium.trim()) {
      setState({ type: "error", message: "Hãy nhập đủ môi trường tới và môi trường khúc xạ." });
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
    if (!conclusionAngles.trim() || !conclusionSines.trim()) {
      setState({ type: "error", message: "Hãy hoàn thành hai câu kết luận dưới đồ thị." });
      return;
    }

    setState({ type: "sending", message: "Đang gửi số liệu…" });
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ className, groupName, teamAssignments, incidenceMedium, refractionMedium, conclusionAngles, conclusionSines, measurements: points, website: "" }),
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
          <div><h2 id="group-heading">Nhóm</h2></div>
        </div>
        <label>Lớp<select required value={className} onChange={(event) => setClassName(event.target.value)}><option value="">Chọn lớp</option>{classNames.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label>Tên nhóm<select required value={groupName} onChange={(event) => setGroupName(event.target.value)}><option value="">Chọn nhóm</option>{groupNames.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label>Môi trường tới<input required maxLength={80} value={incidenceMedium} onChange={(event) => setIncidenceMedium(event.target.value)} placeholder="Ví dụ: Không khí" /></label>
        <label>Môi trường khúc xạ<input required maxLength={80} value={refractionMedium} onChange={(event) => setRefractionMedium(event.target.value)} placeholder="Ví dụ: Thủy tinh" /></label>
        <TeamAssignmentsFields value={teamAssignments} onChange={updateTeamAssignment} />
      </section>

      <section aria-labelledby="data-heading">
        <div className="section-heading data-heading">
          <span>2</span>
          <div><h2 id="data-heading">Số liệu</h2><p>Tự tính sin i và sin r.</p></div>
          <button type="button" className="secondary-button" onClick={addRow}>＋ Thêm dòng</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Lần đo</th><th>Góc tới i (°)</th><th>Góc khúc xạ r (°)</th><th>sin i</th><th>sin r</th><th>sin i / sin r</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <th scope="row">{index + 1}</th>
                  {(["i", "r", "sinI", "sinR"] as const).map((key) => (
                    <td key={key}><input inputMode="decimal" aria-label={`Lần đo ${index + 1}, ${key}`} value={row[key]} onChange={(event) => updateRow(row.id, key, event.target.value)} placeholder={key === "i" || key === "r" ? "0–90" : "0–1"} /></td>
                  ))}
                  <td className="ratio-cell"><output aria-live="polite" aria-label={`Tỉ số sin i chia sin r, lần đo ${index + 1}`}>{formatSineRatio(parseDecimal(row.sinI), parseDecimal(row.sinR))}</output></td>
                  <td><button type="button" className="icon-button" onClick={() => removeRow(row.id)} disabled={rows.length === 1} aria-label={`Xóa lần đo ${index + 1}`}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="data-status" aria-live="polite">{points.length} điểm dữ liệu</p>
      </section>

      <section aria-labelledby="chart-heading">
        <div className="section-heading"><span>3</span><div><h2 id="chart-heading">Đồ thị</h2></div></div>
        <div className="chart-grid">
          <div className="chart-with-conclusion">
            <RelationshipChart title="Góc tới và góc khúc xạ" xLabel="Góc tới i (°)" yLabel="Góc khúc xạ r (°)" points={points} xValue={(point) => point.incidenceAngle} yValue={(point) => point.refractionAngle} ceiling={90} />
            <label className="conclusion-prompt">Kết luận 1: Khi góc tới i tăng, góc khúc xạ r thay đổi thế nào? i và r có tỉ lệ thuận không?<textarea required maxLength={600} value={conclusionAngles} onChange={(event) => setConclusionAngles(event.target.value)} placeholder="Viết kết luận dựa trên số liệu và đồ thị của nhóm…" /></label>
          </div>
          <div className="chart-with-conclusion">
            <RelationshipChart title="sin i và sin r" xLabel="sin i" yLabel="sin r" points={points} xValue={(point) => point.sinIncidence} yValue={(point) => point.sinRefraction} ceiling={1} />
            <label className="conclusion-prompt">Kết luận 2: Tỉ số sin i / sin r có gần không đổi không? Từ đó nêu mối liên hệ giữa sin i và sin r.<textarea required maxLength={600} value={conclusionSines} onChange={(event) => setConclusionSines(event.target.value)} placeholder="Viết kết luận dựa trên số liệu và đồ thị của nhóm…" /></label>
          </div>
        </div>
      </section>

      <section aria-labelledby="construction-heading">
        <div className="section-heading data-heading"><span>4</span><div><h2 id="construction-heading">Dựng hình khúc xạ</h2><p>Quan sát từng bước rồi tự rút ra kết luận.</p></div></div>
        <RefractionConstructionGuide />
      </section>

      <div className="submit-row">
        <div className={`form-message ${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</div>
        <button className="primary-button" type="submit" disabled={state.type === "sending"}>{state.type === "sending" ? "Đang gửi…" : "Nộp bài →"}</button>
      </div>
    </form>
  );
}
