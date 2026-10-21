"use client";

import { FormEvent, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { classNames, groupNames } from "@/lib/classes";
import type { ResistanceFactor, ResistanceFactorMeasurement } from "@/lib/experiments";
import { calculateResistance, formatResistance } from "@/lib/physics";
import { createEmptyTeamAssignments, isTeamAssignments, teamTasks, type TeamTaskKey } from "@/lib/team";
import MaterialBarChart from "./MaterialBarChart";
import RelationshipChart from "./RelationshipChart";
import TeamAssignmentsFields from "./TeamAssignmentsFields";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

const ResistivitySimulator = dynamic(() => import("./ResistivitySimulator"));
const ResistanceFactorsPractice = dynamic(() => import("./ResistanceFactorsPractice"));

type FactorRowInput = { id: number; material: string; length: string; area: string; voltage: string; current: string };
type SampleSelection = number | "";

const factorDefinitions: Array<{ key: ResistanceFactor; label: string; guidance: string; question: string }> = [
  { key: "material", label: "Ảnh hưởng của chất liệu", guidance: "Chọn 2 mẫu có cùng l, S nhưng khác chất liệu.", question: "Khi l và S không đổi, thay đổi chất liệu làm điện trở thay đổi thế nào?" },
  { key: "length", label: "Ảnh hưởng của chiều dài", guidance: "Chọn 3 mẫu có cùng chất liệu, S nhưng khác l.", question: "Khi chất liệu và S không đổi, điện trở R phụ thuộc thế nào vào chiều dài l?" },
  { key: "area", label: "Ảnh hưởng của tiết diện", guidance: "Chọn 2 mẫu có cùng chất liệu, l nhưng khác S.", question: "Khi chất liệu và l không đổi, điện trở R phụ thuộc thế nào vào tiết diện S?" },
];

const investigationSlots: Record<ResistanceFactor, number> = {
  material: 2,
  length: 3,
  area: 2,
};

const blankRow = (id: number): FactorRowInput => ({ id, material: "", length: "", area: "", voltage: "", current: "" });
const initialRows = () => Array.from({ length: 5 }, (_, index) => blankRow(index + 1));
const draftKey = deviceDraftKey("resistance-factors");
const initialSampleSelections = (): Record<ResistanceFactor, SampleSelection[]> => ({
  material: ["", ""],
  length: ["", "", ""],
  area: ["", ""],
});

function isFactorRowInput(value: unknown): value is FactorRowInput {
  return isDraftRecord(value) &&
    typeof value.id === "number" && value.id >= 1 && value.id <= 5 &&
    typeof value.material === "string" &&
    typeof value.length === "string" &&
    typeof value.area === "string" &&
    typeof value.voltage === "string" &&
    typeof value.current === "string";
}

function isSampleSelectionArray(value: unknown): value is SampleSelection[] {
  return Array.isArray(value) && value.every((item) => item === "" || (typeof item === "number" && item >= 1 && item <= 5));
}

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

function rowsForInvestigation(rows: FactorRowInput[], selectedSamples: SampleSelection[]) {
  return selectedSamples.flatMap((sampleId) => {
    if (sampleId === "") return [];
    const row = rows.find((candidate) => candidate.id === sampleId);
    const measurement = row ? rowToMeasurement(row) : null;
    return measurement ? [measurement] : [];
  });
}

function hasControlledVariables(factor: ResistanceFactor, points: ResistanceFactorMeasurement[]) {
  if (points.length < investigationSlots[factor]) return false;
  const sameMaterial = new Set(points.map((point) => point.material.toLocaleLowerCase("vi"))).size === 1;
  const sameLength = new Set(points.map((point) => point.length)).size === 1;
  const sameArea = new Set(points.map((point) => point.area)).size === 1;
  return factor === "material" ? sameLength && sameArea : factor === "length" ? sameMaterial && sameArea : sameMaterial && sameLength;
}

function hasCompleteDistinctSelection(selectedSamples: SampleSelection[]) {
  const chosenSamples = selectedSamples.filter((sampleId): sampleId is number => sampleId !== "");
  return chosenSamples.length === selectedSamples.length && new Set(chosenSamples).size === selectedSamples.length;
}

function controlStatus(factor: ResistanceFactor, points: ResistanceFactorMeasurement[], selectedSamples: SampleSelection[]) {
  const expectedCount = investigationSlots[factor];
  if (selectedSamples.some((sampleId) => sampleId === "")) return `Chọn đủ ${expectedCount} mẫu để so sánh.`;
  if (!hasCompleteDistinctSelection(selectedSamples)) return "Mỗi dòng cần chọn một mẫu khác nhau.";
  if (points.length < expectedCount) return "Hãy nhập đủ số liệu của các mẫu đã chọn.";
  return hasControlledVariables(factor, points) ? "Điều kiện đối chứng đã được giữ nguyên." : "Kiểm tra lại các đại lượng cần giữ nguyên để so sánh công bằng.";
}

export default function ResistanceFactorsLabForm({ showResistivity, showPractice }: { showResistivity: boolean; showPractice: boolean }) {
  const [className, setClassName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [teamAssignments, setTeamAssignments] = useState(createEmptyTeamAssignments);
  const [rows, setRows] = useState<FactorRowInput[]>(initialRows);
  const [sampleSelections, setSampleSelections] = useState<Record<ResistanceFactor, SampleSelection[]>>(initialSampleSelections);
  const [conclusions, setConclusions] = useState<Record<ResistanceFactor, string>>({ material: "", length: "", area: "" });
  const [overallConclusion, setOverallConclusion] = useState("");
  const [state, setState] = useState<{ type: "idle" | "sending" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const { draftStatus } = useDeviceDraft(draftKey, { className, groupName, teamAssignments, rows, sampleSelections, conclusions, overallConclusion }, (value) => {
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
    if (Array.isArray(value.rows)) {
      const restoredRows = value.rows.filter(isFactorRowInput);
      if (restoredRows.length === 5 && new Set(restoredRows.map((row) => row.id)).size === 5) setRows(restoredRows);
    }
    if (isDraftRecord(value.sampleSelections)) {
      const restoredSelections = initialSampleSelections();
      const selections = value.sampleSelections;
      factorDefinitions.forEach(({ key }) => {
        const selected = selections[key];
        if (isSampleSelectionArray(selected) && selected.length === investigationSlots[key]) restoredSelections[key] = selected;
      });
      setSampleSelections(restoredSelections);
    }
    if (isDraftRecord(value.conclusions)) {
      const restoredConclusions: Record<ResistanceFactor, string> = { material: "", length: "", area: "" };
      const savedConclusions = value.conclusions;
      factorDefinitions.forEach(({ key }) => {
        if (typeof savedConclusions[key] === "string") restoredConclusions[key] = savedConclusions[key];
      });
      setConclusions(restoredConclusions);
    }
    if (typeof value.overallConclusion === "string") setOverallConclusion(value.overallConclusion);
  });
  const measurements = useMemo<Record<ResistanceFactor, ResistanceFactorMeasurement[]>>(() => ({
    material: rowsForInvestigation(rows, sampleSelections.material),
    length: rowsForInvestigation(rows, sampleSelections.length),
    area: rowsForInvestigation(rows, sampleSelections.area),
  }), [rows, sampleSelections]);

  function updateRow(id: number, key: keyof Omit<FactorRowInput, "id">, value: string) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
    if (state.type !== "idle") setState({ type: "idle", message: "" });
  }

  function updateTeamAssignment(task: TeamTaskKey, memberName: string) {
    setTeamAssignments((current) => ({ ...current, [task]: memberName }));
  }

  function updateSampleSelection(factor: ResistanceFactor, index: number, value: string) {
    const sampleId: SampleSelection = value ? Number(value) : "";
    setSampleSelections((current) => ({
      ...current,
      [factor]: current[factor].map((selected, selectedIndex) => selectedIndex === index ? sampleId : selected),
    }));
    if (state.type !== "idle") setState({ type: "idle", message: "" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!className.trim() || !groupName.trim()) {
      setState({ type: "error", message: "Hãy nhập lớp và tên nhóm." });
      return;
    }
    if (!isTeamAssignments(teamAssignments)) {
      setState({ type: "error", message: "Hãy phân công thành viên cho đủ bốn nhiệm vụ." });
      return;
    }
    const incompleteSample = rows.find((row) => !rowToMeasurement(row));
    if (incompleteSample) {
      setState({ type: "error", message: `Hãy kiểm tra và nhập đủ thông tin, U, I cho mẫu ${incompleteSample.id}.` });
      return;
    }
    const incompleteInvestigation = factorDefinitions.find(({ key }) => !hasCompleteDistinctSelection(sampleSelections[key]));
    if (incompleteInvestigation) {
      setState({ type: "error", message: `Hãy chọn đủ các mẫu khác nhau cho phần ${incompleteInvestigation.label.toLowerCase()}.` });
      return;
    }
    const missingConclusion = factorDefinitions.find(({ key }) => !conclusions[key].trim());
    if (missingConclusion) {
      setState({ type: "error", message: `Hãy hoàn thành kết luận phần ${missingConclusion.label.toLowerCase()}.` });
      return;
    }
    if (!overallConclusion.trim()) {
      setState({ type: "error", message: "Hãy hoàn thành kết luận tổng từ ba lượt khảo sát." });
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
          payload: { teamAssignments, investigations: measurements, conclusions, overallConclusion },
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
        <TeamAssignmentsFields value={teamAssignments} onChange={updateTeamAssignment} />
      </section>

      <section aria-labelledby="factors-samples-heading">
        <div className="section-heading data-heading"><span>2</span><div><h2 id="factors-samples-heading">5 mẫu dây</h2><p>Nhập một lần; U, I, R được dùng chung.</p></div></div>
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
            const selectedSamples = sampleSelections[definition.key];
            const selectedRows = selectedSamples.map((sampleId) => sampleId === "" ? null : rows.find((row) => row.id === sampleId) ?? null);
            return (
              <article className="investigation-card" key={definition.key} aria-labelledby={`investigation-${definition.key}`}>
                <header className="investigation-header">
                  <span>Khảo sát {investigationIndex + 1}</span>
                  <div><h3 id={`investigation-${definition.key}`}>{definition.label}</h3><p>{definition.guidance}</p></div>
                </header>
                <div className="table-scroll">
                  <table className="factor-review-table">
                    <thead><tr><th>Mẫu</th><th>Chất liệu</th><th>l (m)</th><th>S (mm²)</th><th>U (V)</th><th>I (A)</th><th>R (Ω)</th></tr></thead>
                    <tbody>{selectedRows.map((row, selectionIndex) => (
                      <tr key={`${definition.key}-${selectionIndex}`}>
                        <th scope="row">
                          <select
                            className="sample-picker"
                            aria-label={`${definition.label}, lựa chọn ${selectionIndex + 1}`}
                            value={selectedSamples[selectionIndex]}
                            onChange={(event) => updateSampleSelection(definition.key, selectionIndex, event.target.value)}
                          >
                            <option value="">Chọn mẫu</option>
                            {rows.map((sample) => (
                              <option
                                key={sample.id}
                                value={sample.id}
                                disabled={selectedSamples.some((selected, index) => index !== selectionIndex && selected === sample.id)}
                              >
                                Mẫu {sample.id}
                              </option>
                            ))}
                          </select>
                        </th>
                        <td>{row?.material || "—"}</td><td>{row?.length || "—"}</td><td>{row?.area || "—"}</td>
                        <td>{row?.voltage || "—"}</td><td>{row?.current || "—"}</td>
                        <td className="ratio-cell">{row ? formatResistance(parseDecimal(row.voltage), parseDecimal(row.current)) : "—"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <p className={`control-status ${hasCompleteDistinctSelection(selectedSamples) && hasControlledVariables(definition.key, points) ? "ready" : ""}`} aria-live="polite">{controlStatus(definition.key, points, selectedSamples)}</p>
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

      <section aria-labelledby="overall-conclusion-heading">
        <div className="section-heading data-heading"><span>4</span><div><h2 id="overall-conclusion-heading">Tổng hợp kết luận</h2><p>Đọc lại ba nhận xét rồi tìm quy luật chung.</p></div></div>
        <div className="conclusion-summary-grid">
          {factorDefinitions.map((definition) => (
            <article key={definition.key} className="conclusion-summary-item">
              <h3>{definition.label}</h3>
              <p>{conclusions[definition.key].trim() || "Chưa viết kết luận."}</p>
            </article>
          ))}
        </div>
        <label className="conclusion-prompt overall-conclusion">Kết luận tổng: Điện trở R của dây dẫn phụ thuộc như thế nào vào chất liệu, chiều dài l và tiết diện S?<textarea required maxLength={800} value={overallConclusion} onChange={(event) => setOverallConclusion(event.target.value)} placeholder="Tổng hợp cả ba quy luật bằng lời của nhóm…" /></label>
      </section>

      {showResistivity ? (
        <section aria-labelledby="resistivity-heading">
          <div className="section-heading data-heading"><span>5</span><div><h2 id="resistivity-heading">Khám phá điện trở suất ρ</h2><p>Thay đổi dây dẫn để nhận ra đại lượng đặc trưng cho vật liệu.</p></div></div>
          <ResistivitySimulator />
        </section>
      ) : null}

      {showPractice ? (
        <section aria-labelledby="resistance-factors-practice-heading">
          <div className="section-heading data-heading"><span>6</span><div><h2 id="resistance-factors-practice-heading">Luyện tập sau bài học</h2><p>Vận dụng quy luật về chất liệu, chiều dài và tiết diện.</p></div></div>
          <ResistanceFactorsPractice />
        </section>
      ) : null}

      <div className="submit-row"><div className={`form-message ${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</div><span className="draft-status" aria-live="polite">{draftStatus}</span><button className="primary-button" type="submit" disabled={state.type === "sending"}>{state.type === "sending" ? "Đang gửi…" : "Nộp bài →"}</button></div>
    </form>
  );
}
