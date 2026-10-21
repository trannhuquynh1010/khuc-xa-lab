"use client";

import { FormEvent, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { classNames, groupNames } from "@/lib/classes";
import type { OhmMeasurement } from "@/lib/experiments";
import { createEmptyTeamAssignments, isTeamAssignments, teamTasks, type TeamTaskKey } from "@/lib/team";
import RelationshipChart from "./RelationshipChart";
import TeamAssignmentsFields from "./TeamAssignmentsFields";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

const CurrentVoltagePractice = dynamic(() => import("./CurrentVoltagePractice"));
const OhmsLawPractice = dynamic(() => import("./OhmsLawPractice"));
const OhmRaceGame = dynamic(() => import("./OhmRaceGame"));

type InputRow = { id: number; voltage: string; current: string };
const blankRow = (id: number): InputRow => ({ id, voltage: "", current: "" });
const draftKey = deviceDraftKey("ohm");

function isInputRow(value: unknown): value is InputRow {
  return isDraftRecord(value) &&
    typeof value.id === "number" &&
    typeof value.voltage === "string" &&
    typeof value.current === "string";
}

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

export default function OhmLabForm({ showCurrentVoltagePractice, showOhmsLawPractice, showRace, raceRunning, raceRound, raceStartedAt }: {
  showCurrentVoltagePractice: boolean;
  showOhmsLawPractice: boolean;
  showRace: boolean;
  raceRunning: boolean;
  raceRound: number;
  raceStartedAt: string | null;
}) {
  const [className, setClassName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [teamAssignments, setTeamAssignments] = useState(createEmptyTeamAssignments);
  const [conclusion, setConclusion] = useState("");
  const [rows, setRows] = useState<InputRow[]>(() => Array.from({ length: 5 }, (_, index) => blankRow(index + 1)));
  const [state, setState] = useState<{ type: "idle" | "sending" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const { draftStatus } = useDeviceDraft(draftKey, { className, groupName, teamAssignments, conclusion, rows }, (value) => {
    if (!isDraftRecord(value)) return;
    if (typeof value.className === "string" && classNames.includes(value.className)) setClassName(value.className);
    if (typeof value.groupName === "string" && groupNames.includes(value.groupName)) setGroupName(value.groupName);
    if (isDraftRecord(value.teamAssignments)) {
      const restoredAssignments = createEmptyTeamAssignments();
      const assignments = value.teamAssignments;
      teamTasks.forEach(({ key }) => {
        if (typeof assignments[key] === "string") restoredAssignments[key] = assignments[key];
      });
      setTeamAssignments(restoredAssignments);
    }
    if (typeof value.conclusion === "string") setConclusion(value.conclusion);
    if (Array.isArray(value.rows)) {
      const restoredRows = value.rows.filter(isInputRow);
      if (restoredRows.length) setRows(restoredRows);
    }
  });
  const measurements = useMemo(() => rowsToMeasurements(rows), [rows]);

  function updateRow(id: number, key: "voltage" | "current", value: string) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
    if (state.type !== "idle") setState({ type: "idle", message: "" });
  }

  function updateTeamAssignment(task: TeamTaskKey, memberName: string) {
    setTeamAssignments((current) => ({ ...current, [task]: memberName }));
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
    if (!className.trim() || !groupName.trim()) {
      setState({ type: "error", message: "Hãy chọn lớp và tên nhóm." });
      return;
    }
    if (!isTeamAssignments(teamAssignments)) {
      setState({ type: "error", message: "Hãy phân công thành viên cho đủ bốn nhiệm vụ." });
      return;
    }
    if (hasPartialRow) {
      setState({ type: "error", message: "Có một lần đo chưa nhập đủ U và I." });
      return;
    }
    if (measurements.length < 2) {
      setState({ type: "error", message: "Hãy nhập ít nhất hai lần đo hợp lệ." });
      return;
    }
    if (!conclusion.trim()) {
      setState({ type: "error", message: "Hãy hoàn thành câu kết luận dưới đồ thị." });
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
          payload: { teamAssignments, measurements, conclusion },
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
        <div className="section-heading"><span>1</span><div><h2 id="ohm-group-heading">Nhóm</h2></div></div>
        <label className="field-span-2">Lớp<select required value={className} onChange={(event) => setClassName(event.target.value)}><option value="">Chọn lớp</option>{classNames.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="field-span-2">Tên nhóm<select required value={groupName} onChange={(event) => setGroupName(event.target.value)}><option value="">Chọn nhóm</option>{groupNames.map((name) => <option key={name}>{name}</option>)}</select></label>
        <TeamAssignmentsFields value={teamAssignments} onChange={updateTeamAssignment} />
      </section>

      <section aria-labelledby="ohm-workspace-heading">
        <div className="section-heading data-heading"><span>2</span><div><h2 id="ohm-workspace-heading">Số liệu & đồ thị</h2></div></div>
        <div className="ohm-workspace-grid">
          <div className="ohm-panel">
            <div className="ohm-panel-header"><div><h3>U – I</h3></div><button type="button" className="secondary-button" onClick={addRow}>＋ Thêm dòng</button></div>
            <div className="table-scroll">
              <table className="compact-data-table ohm-data-table">
                <thead><tr><th>Lần đo</th><th>U (V)</th><th>I (A)</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
                <tbody>{rows.map((row, index) => (
                  <tr key={row.id}>
                    <th scope="row">{index + 1}</th>
                    <td><input inputMode="decimal" aria-label={`Lần đo ${index + 1}, hiệu điện thế U`} value={row.voltage} onChange={(event) => updateRow(row.id, "voltage", event.target.value)} placeholder="V" /></td>
                    <td><input inputMode="decimal" aria-label={`Lần đo ${index + 1}, cường độ dòng điện I`} value={row.current} onChange={(event) => updateRow(row.id, "current", event.target.value)} placeholder="A" /></td>
                    <td><button type="button" className="icon-button" onClick={() => removeRow(row.id)} disabled={rows.length === 1} aria-label={`Xóa lần đo ${index + 1}`}>×</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="result-strip"><span><strong>{measurements.length}</strong> điểm dữ liệu</span></div>
          </div>
          <div className="ohm-panel ohm-graph-panel">
            <RelationshipChart title="Cường độ dòng điện theo hiệu điện thế" xLabel="Hiệu điện thế U (V)" yLabel="Cường độ dòng điện I (A)" points={measurements} xValue={(point) => point.voltage} yValue={(point) => point.current} xCeiling={Math.max(5, ...measurements.map((point) => point.voltage * 1.2))} yCeiling={Math.max(1, ...measurements.map((point) => point.current * 1.2))} />
          </div>
        </div>
        <label className="conclusion-prompt ohm-conclusion">Kết luận: Khi hiệu điện thế U thay đổi, cường độ dòng điện I thay đổi như thế nào?<textarea required maxLength={600} value={conclusion} onChange={(event) => setConclusion(event.target.value)} placeholder="Viết nhận xét dựa trên số liệu và đồ thị của nhóm…" /></label>
      </section>

      {showCurrentVoltagePractice && (
        <section aria-labelledby="current-voltage-practice-heading">
          <div className="section-heading data-heading"><span>3</span><div><h2 id="current-voltage-practice-heading">Luyện tập I phụ thuộc vào U</h2><p>Lắp mạch, giải mã số liệu và phát hiện phép đo bất thường.</p></div></div>
          <CurrentVoltagePractice />
        </section>
      )}

      {showOhmsLawPractice && (
        <section aria-labelledby="ohms-law-practice-heading">
          <div className="section-heading data-heading"><span>{showCurrentVoltagePractice ? 4 : 3}</span><div><h2 id="ohms-law-practice-heading">Luyện tập định luật Ohm</h2><p>Giải mã số liệu, vận dụng định luật và chọn giới hạn an toàn.</p></div></div>
          <OhmsLawPractice />
        </section>
      )}

      {showRace && (
        <section aria-labelledby="ohm-race-heading">
          <div className="section-heading data-heading"><span>{3 + Number(showCurrentVoltagePractice) + Number(showOhmsLawPractice)}</span><div><h2 id="ohm-race-heading">Đường đua Điện học</h2><p>Vượt 6 trạm bằng kiến thức I–U và định luật Ohm.</p></div></div>
          <OhmRaceGame round={raceRound} running={raceRunning} startedAt={raceStartedAt} />
        </section>
      )}

      <div className="submit-row"><div className={`form-message ${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</div><span className="draft-status" aria-live="polite">{draftStatus}</span><button className="primary-button" type="submit" disabled={state.type === "sending"}>{state.type === "sending" ? "Đang gửi…" : "Nộp bài →"}</button></div>
    </form>
  );
}
