"use client";

import { FormEvent, useState } from "react";
import { classNames, groupNames } from "@/lib/classes";
import { createEmptyTeamAssignments, isTeamAssignments, teamTasks, type TeamTaskKey } from "@/lib/team";
import ColorVisionChallenge, { colorChallengeTaskCount, emptyColorChallengeProgress, isColorChallengeComplete, isColorChallengeProgress, type ColorChallengeProgress } from "./ColorVisionChallenge";
import PrismConstructionGuide, { emptyPrismConstructionProgress, isPrismConstructionComplete, isPrismConstructionProgress, type PrismConstructionProgress } from "./PrismConstructionGuide";
import TeamAssignmentsFields from "./TeamAssignmentsFields";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

const draftKey = deviceDraftKey("prism-colors");

export default function PrismColorLabForm() {
  const [className, setClassName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [teamAssignments, setTeamAssignments] = useState(createEmptyTeamAssignments);
  const [constructionProgress, setConstructionProgress] = useState<PrismConstructionProgress>(emptyPrismConstructionProgress);
  const [colorProgress, setColorProgress] = useState<ColorChallengeProgress>(emptyColorChallengeProgress);
  const [dispersionConclusion, setDispersionConclusion] = useState("");
  const [colorConclusion, setColorConclusion] = useState("");
  const [state, setState] = useState<{ type: "idle" | "sending" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const constructionComplete = isPrismConstructionComplete(constructionProgress);
  const colorChallengeComplete = isColorChallengeComplete(colorProgress);
  const { draftStatus } = useDeviceDraft(draftKey, { className, groupName, teamAssignments, constructionProgress, colorProgress, dispersionConclusion, colorConclusion }, (value) => {
    if (!isDraftRecord(value)) return;
    if (typeof value.className === "string" && classNames.includes(value.className)) setClassName(value.className);
    if (typeof value.groupName === "string" && groupNames.includes(value.groupName)) setGroupName(value.groupName);
    if (isDraftRecord(value.teamAssignments)) {
      const restoredAssignments = createEmptyTeamAssignments();
      teamTasks.forEach(({ key }) => {
        if (typeof value.teamAssignments === "object" && value.teamAssignments && typeof (value.teamAssignments as Record<string, unknown>)[key] === "string") {
          restoredAssignments[key] = (value.teamAssignments as Record<string, string>)[key];
        }
      });
      setTeamAssignments(restoredAssignments);
    }
    if (isPrismConstructionProgress(value.constructionProgress)) setConstructionProgress(value.constructionProgress);
    if (isColorChallengeProgress(value.colorProgress)) setColorProgress(value.colorProgress);
    if (typeof value.dispersionConclusion === "string") setDispersionConclusion(value.dispersionConclusion);
    if (typeof value.colorConclusion === "string") setColorConclusion(value.colorConclusion);
  });

  function updateTeamAssignment(task: TeamTaskKey, memberName: string) {
    setTeamAssignments((current) => ({ ...current, [task]: memberName }));
  }

  function updateConstruction(progress: PrismConstructionProgress) {
    setConstructionProgress(progress);
    if (state.type !== "idle") setState({ type: "idle", message: "" });
  }

  function updateColorProgress(progress: ColorChallengeProgress) {
    setColorProgress(progress);
    if (state.type !== "idle") setState({ type: "idle", message: "" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!className || !groupName) {
      setState({ type: "error", message: "Hãy chọn lớp và tên nhóm." });
      return;
    }
    if (!isTeamAssignments(teamAssignments)) {
      setState({ type: "error", message: "Hãy phân công thành viên cho đủ bốn nhiệm vụ." });
      return;
    }
    if (!constructionComplete) {
      setState({ type: "error", message: "Hãy hoàn thành đủ bảy bước dựng hình lăng kính." });
      return;
    }
    if (!colorChallengeComplete) {
      setState({ type: "error", message: "Hãy hoàn thành đủ bốn tình huống màu sắc của vật." });
      return;
    }
    if (!dispersionConclusion.trim() || !colorConclusion.trim()) {
      setState({ type: "error", message: "Hãy hoàn thành hai câu kết luận." });
      return;
    }

    setState({ type: "sending", message: "Đang gửi kết quả…" });
    try {
      const response = await fetch("/api/experiment-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityKey: "prism-colors",
          className,
          groupName,
          payload: {
            teamAssignments,
            constructionCompleted: true,
            colorChallengeCompleted: true,
            dispersionConclusion,
            colorConclusion,
          },
          website: "",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể gửi kết quả.");
      setState({ type: "success", message: "Đã gửi kết quả cho giáo viên." });
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "Không thể gửi kết quả." });
    }
  }

  return (
    <form className="lab-card prism-color-lab" onSubmit={handleSubmit}>
      <section className="identity-grid" aria-labelledby="prism-group-heading">
        <div className="section-heading"><span>1</span><div><h2 id="prism-group-heading">Nhóm</h2></div></div>
        <label className="field-span-2">Lớp<select required value={className} onChange={(event) => setClassName(event.target.value)}><option value="">Chọn lớp</option>{classNames.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="field-span-2">Tên nhóm<select required value={groupName} onChange={(event) => setGroupName(event.target.value)}><option value="">Chọn nhóm</option>{groupNames.map((name) => <option key={name}>{name}</option>)}</select></label>
        <TeamAssignmentsFields value={teamAssignments} onChange={updateTeamAssignment} />
      </section>

      <section aria-labelledby="prism-construction-heading">
        <div className="section-heading data-heading"><span>2</span><div><h2 id="prism-construction-heading">Dựng hình tán sắc</h2><p>Trả lời đúng để dựng từng phần của đường truyền ánh sáng.</p></div></div>
        <PrismConstructionGuide value={constructionProgress} onChange={updateConstruction} />
      </section>

      <section aria-labelledby="object-color-heading">
        <div className="section-heading data-heading"><span>3</span><div><h2 id="object-color-heading">Màu sắc của vật</h2><p>Dự đoán màu quan sát được dưới các ánh sáng khác nhau.</p></div></div>
        <ColorVisionChallenge value={colorProgress} onChange={updateColorProgress} />
      </section>

      <section aria-labelledby="prism-conclusion-heading">
        <div className="section-heading data-heading"><span>4</span><div><h2 id="prism-conclusion-heading">Kết luận</h2><p>Tổng hợp điều nhóm đã nhận ra từ hai hoạt động.</p></div></div>
        <div className="prism-completion-strip">
          <span className={constructionComplete ? "complete" : ""}>{constructionComplete ? "✓" : "·"} Dựng hình {constructionComplete ? "7/7" : "chưa xong"}</span>
          <span className={colorChallengeComplete ? "complete" : ""}>{colorChallengeComplete ? "✓" : "·"} Màu sắc {colorChallengeComplete ? `${colorChallengeTaskCount}/${colorChallengeTaskCount}` : "chưa xong"}</span>
        </div>
        <div className="prism-conclusion-grid">
          <label className="conclusion-prompt">Vì sao tia tím lệch nhiều hơn tia đỏ khi đi qua lăng kính?<textarea required maxLength={700} value={dispersionConclusion} onChange={(event) => setDispersionConclusion(event.target.value)} placeholder="Dùng chiết suất hoặc tốc độ truyền sáng để giải thích…" /></label>
          <label className="conclusion-prompt">Màu ta nhìn thấy của một vật phụ thuộc vào những yếu tố nào?<textarea required maxLength={700} value={colorConclusion} onChange={(event) => setColorConclusion(event.target.value)} placeholder="Nêu vai trò của ánh sáng chiếu tới và khả năng phản xạ của vật…" /></label>
        </div>
      </section>

      <div className="submit-row"><div className={`form-message ${state.type}`} role={state.type === "error" ? "alert" : "status"}>{state.message}</div><span className="draft-status" aria-live="polite">{draftStatus}</span><button className="primary-button" type="submit" disabled={state.type === "sending"}>{state.type === "sending" ? "Đang gửi…" : "Nộp bài →"}</button></div>
    </form>
  );
}
