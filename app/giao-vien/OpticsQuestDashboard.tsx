"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { formatStudentNumber } from "@/lib/classes";
import { getOpticsQuestGroupColor, OPTICS_QUEST_MAX_ENERGY, OPTICS_QUEST_QUESTION_COUNT, type OpticsQuestSnapshot } from "@/lib/optics-quest";

function groupColorStyle(groupName: string) {
  return { "--quest-group-color": getOpticsQuestGroupColor(groupName) } as CSSProperties;
}

export default function OpticsQuestDashboard({ className, schoolYear, presentation = false }: { className: string; schoolYear: string; presentation?: boolean }) {
  const [snapshot, setSnapshot] = useState<OpticsQuestSnapshot | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ className, schoolYear });
    const load = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch(`/api/optics-quest?${params}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (active) { setSnapshot(data); setError(false); }
      } catch { if (active) setError(true); }
    };
    void load(); const interval = window.setInterval(() => void load(), 2500);
    return () => { active = false; window.clearInterval(interval); };
  }, [className, schoolYear]);

  const playersByGroup = useMemo(() => new Map((snapshot?.groups ?? []).map((group) => [group.groupName, (snapshot?.players ?? []).filter((player) => player.groupName === group.groupName)])), [snapshot]);
  const podium = (snapshot?.groups ?? []).filter((group) => group.rank && group.rank <= 3).sort((a, b) => (a.rank ?? 9) - (b.rank ?? 9));
  return (
    <section className={`optics-quest-dashboard ${presentation ? "presentation" : ""}`} aria-live="polite">
      <div className="quest-dashboard-head"><div><p className="eyebrow">PHOTON QUEST · VÒNG {snapshot?.round ?? "—"}</p><h2>{className} · {snapshot?.finishedCount ?? 0}/{snapshot?.readyCount ?? 0} hoàn thành</h2></div><div className="quest-dashboard-status"><span><b>{snapshot?.readyCount ?? 0}</b> tham gia</span><span><b>{snapshot?.finishedCount ?? 0}</b> về đích</span><span className={snapshot?.isRunning ? "running" : "paused"}>{snapshot?.isRunning ? "● Đang chơi" : "○ Đang chờ"}</span></div></div>
      {podium.length ? <div className="quest-podium">{podium.map((group) => <div key={group.groupName} className={`place-${group.rank}`} style={groupColorStyle(group.groupName)}><span>{group.rank === 1 ? "✦" : `#${group.rank}`}</span><strong>{group.groupName}</strong><small>{group.averageEnergy}/{OPTICS_QUEST_MAX_ENERGY}</small></div>)}</div> : <div className="quest-no-rank"><span>✦</span><p>Nhóm cần ít nhất 75% thành viên hoàn thành để được xếp hạng.</p></div>}
      <div className="quest-group-grid">{(snapshot?.groups ?? []).map((group) => <article key={group.groupName} className={`quest-group-card ${group.eligible ? "eligible" : "waiting"}`} style={groupColorStyle(group.groupName)}><header><div><span>{group.rank ? `#${group.rank}` : "—"}</span><strong>{group.groupName}</strong></div><b>{group.averageEnergy}<small>/{OPTICS_QUEST_MAX_ENERGY}</small></b></header><div className="quest-group-progress"><i><span style={{ width: `${group.completionRate * 100}%` }}/></i><small>{group.finishedCount}/{group.participantCount} xong</small></div><div className="quest-member-dots">{playersByGroup.get(group.groupName)?.map((player) => <span key={player.studentNumber} className={player.finished ? "finished" : player.progress ? "playing" : "ready"} title={`STT ${formatStudentNumber(player.studentNumber)} · ${player.progress}/${OPTICS_QUEST_QUESTION_COUNT} câu · ${player.energy} NL`}>{formatStudentNumber(player.studentNumber)}</span>)}</div></article>)}</div>
      {!presentation ? <details className="quest-player-details"><summary>Chi tiết học sinh ({snapshot?.readyCount ?? 0})</summary><div className="table-scroll"><table><thead><tr><th>STT</th><th>Nhóm</th><th>Tiến độ</th><th>Năng lượng</th><th>Trạng thái</th></tr></thead><tbody>{(snapshot?.players ?? []).map((player) => <tr key={player.studentNumber}><td>{formatStudentNumber(player.studentNumber)}</td><td><span className="quest-table-group" style={groupColorStyle(player.groupName)}><i />{player.groupName}</span></td><td>{player.progress}/{OPTICS_QUEST_QUESTION_COUNT} câu</td><td>{player.energy}/{OPTICS_QUEST_MAX_ENERGY}</td><td>{player.finished ? "Hoàn thành" : "Đang làm"}</td></tr>)}</tbody></table></div></details> : null}
      {error ? <p className="race-dashboard-error">Mất kết nối · đang thử lại…</p> : null}
    </section>
  );
}
