"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { formatStudentNumber } from "@/lib/classes";
import { getOpticsQuestGroupColor, OPTICS_QUEST_QUESTION_COUNT, type OpticsQuestSnapshot } from "@/lib/optics-quest";

function groupColorStyle(groupName: string) {
  return { "--quest-group-color": getOpticsQuestGroupColor(groupName) } as CSSProperties;
}

function formatTime(totalSeconds: number | null) {
  if (totalSeconds === null) return "—";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function OpticsQuestDashboard({ className, schoolYear, presentation = false }: { className: string; schoolYear: string; presentation?: boolean }) {
  const [snapshot, setSnapshot] = useState<OpticsQuestSnapshot | null>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ className, schoolYear });
      const response = await fetch(`/api/optics-quest?${params}`, { cache: "no-store" });
      if (response.ok) setSnapshot(await response.json());
    } catch {
      /* giữ dữ liệu cũ khi lỗi mạng tạm thời */
    }
  }, [className, schoolYear]);

  useEffect(() => {
    const initial = window.setTimeout(load, 0);
    const interval = window.setInterval(load, 2500);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [load]);

  const playersByGroup = useMemo(() => {
    const map = new Map<string, OpticsQuestSnapshot["players"]>();
    (snapshot?.players ?? []).forEach((player) => {
      const list = map.get(player.groupName) ?? [];
      list.push(player);
      map.set(player.groupName, list);
    });
    return map;
  }, [snapshot]);

  const rankedGroups = useMemo(() => [...(snapshot?.groups ?? [])].filter((group) => group.participantCount > 0)
    .sort((left, right) => (left.rank ?? 99) - (right.rank ?? 99)), [snapshot]);
  const ended = snapshot?.ended ?? false;
  const classPercent = Math.round((snapshot?.classCorrectRate ?? 0) * 100);
  const statusLabel = ended ? "✓ Đã công bố" : snapshot?.isRunning ? "● Đang chơi" : "○ Đang chờ";

  return (
    <section className={`optics-quest-dashboard ${presentation ? "presentation" : ""}`} aria-live="polite">
      <div className="quest-dashboard-head">
        <div><p className="eyebrow">PHOTON QUEST · VÒNG {snapshot?.round ?? "—"}</p><h2>{className} · % đúng cả lớp: {classPercent}%</h2></div>
        <div className="quest-dashboard-status">
          <span><b>{snapshot?.participantCount ?? 0}</b> tham gia</span>
          <span><b>{snapshot?.submittedCount ?? 0}</b> nộp sớm</span>
          <span className={ended ? "running" : snapshot?.isRunning ? "running" : "paused"}>{statusLabel}</span>
        </div>
      </div>

      {rankedGroups.length ? (
        <ol className="quest-rank-board">
          {rankedGroups.map((group) => (
            <li key={group.groupName} style={groupColorStyle(group.groupName)}>
              <span className="quest-rank-no">{group.rank ? `#${group.rank}` : "—"}</span>
              <strong>{group.groupName}</strong>
              <b>{group.averageScore}<small>/{OPTICS_QUEST_QUESTION_COUNT}</small></b>
              <em>Σt {formatTime(group.totalTimeSeconds)}</em>
            </li>
          ))}
        </ol>
      ) : <div className="quest-no-rank"><span>✦</span><p>Chưa có nhóm nào tham gia. Xếp hạng theo điểm trung bình, đồng điểm xét tổng thời gian.</p></div>}

      <div className="quest-group-grid">
        {rankedGroups.map((group) => (
          <article key={group.groupName} className="quest-group-card eligible" style={groupColorStyle(group.groupName)}>
            <header><div><span>{group.rank ? `#${group.rank}` : "—"}</span><strong>{group.groupName}</strong></div><b>{group.averageScore}<small>/{OPTICS_QUEST_QUESTION_COUNT}</small></b></header>
            <div className="quest-group-progress"><small>{group.participantCount} thành viên · Σt {formatTime(group.totalTimeSeconds)}</small></div>
            <div className="quest-member-dots">{(playersByGroup.get(group.groupName) ?? []).map((player) => (
              <span key={player.studentNumber} className={player.finished ? "finished" : player.answeredCount ? "playing" : "ready"} title={`STT ${formatStudentNumber(player.studentNumber)} · ${player.correctCount}/${OPTICS_QUEST_QUESTION_COUNT} đúng · ${player.answeredCount}/${OPTICS_QUEST_QUESTION_COUNT} đã trả lời · ${formatTime(player.elapsedSeconds)}`}>{formatStudentNumber(player.studentNumber)}</span>
            ))}</div>
          </article>
        ))}
      </div>

      {!presentation ? (
        <details className="quest-player-details">
          <summary>Báo cáo theo từng câu ({(snapshot?.questionStats ?? []).length})</summary>
          <div className="table-scroll quest-table-scroll"><table>
            <thead><tr><th>Trạm</th><th>Câu hỏi</th><th>Đã trả lời</th><th>Đúng</th><th>Sai</th><th>% đúng</th></tr></thead>
            <tbody>{(snapshot?.questionStats ?? []).map((stat) => (
              <tr key={stat.id}>
                <td>{stat.station}</td>
                <td>{stat.stationLabel} · {stat.title}</td>
                <td>{stat.answeredCount}/{stat.attemptedCount}</td>
                <td className="quest-stat-correct">{stat.correctCount}</td>
                <td className="quest-stat-wrong">{stat.wrongCount}</td>
                <td>{stat.attemptedCount ? Math.round(stat.correctCount / stat.attemptedCount * 100) : 0}%</td>
              </tr>
            ))}</tbody>
          </table></div>
        </details>
      ) : null}

      {!presentation ? (
        <details className="quest-player-details">
          <summary>Chi tiết học sinh ({snapshot?.participantCount ?? 0})</summary>
          <div className="table-scroll quest-table-scroll"><table>
            <thead><tr><th>STT</th><th>Nhóm</th><th>Đã trả lời</th><th>Số câu đúng</th><th>% đúng</th><th>Thời gian</th><th>Trạng thái</th></tr></thead>
            <tbody>{(snapshot?.players ?? []).map((player) => (
              <tr key={player.studentNumber}>
                <td>{formatStudentNumber(player.studentNumber)}</td>
                <td><span className="quest-table-group" style={groupColorStyle(player.groupName)}><i />{player.groupName}</span></td>
                <td>{player.answeredCount}/{OPTICS_QUEST_QUESTION_COUNT}</td>
                <td>{player.correctCount}/{OPTICS_QUEST_QUESTION_COUNT}</td>
                <td>{Math.round(player.correctCount / OPTICS_QUEST_QUESTION_COUNT * 100)}%</td>
                <td>{formatTime(player.elapsedSeconds)}</td>
                <td>{player.finished ? "Đã nộp sớm" : ended ? "Thu khi kết thúc" : "Đang làm"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </details>
      ) : null}
    </section>
  );
}
