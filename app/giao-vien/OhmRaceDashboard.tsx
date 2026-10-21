"use client";

import { useEffect, useMemo, useState } from "react";
import { formatStudentNumber, studentNumbers } from "@/lib/classes";
import { OHM_RACE_STATION_COUNT, type OhmRaceSnapshot } from "@/lib/ohm-race";

function formatTime(totalSeconds: number | null) {
  if (totalSeconds === null) return "—";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function OhmRaceDashboard({ className, schoolYear, presentation = false }: { className: string; schoolYear: string; presentation?: boolean }) {
  const [snapshot, setSnapshot] = useState<OhmRaceSnapshot | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ className, schoolYear });
    const load = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch(`/api/ohm-race?${params}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải đường đua.");
        if (active) {
          setSnapshot(data as OhmRaceSnapshot);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 3000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [className, schoolYear]);

  const racerMap = useMemo(() => new Map(snapshot?.racers.map((racer) => [racer.studentNumber, racer]) ?? []), [snapshot?.racers]);
  const podium = useMemo(() => (snapshot?.racers ?? []).filter((racer) => racer.rank !== null && racer.rank <= 3).sort((left, right) => (left.rank ?? 99) - (right.rank ?? 99)), [snapshot?.racers]);

  return (
    <section className={`ohm-race-dashboard ${presentation ? "presentation" : ""}`} aria-live="polite">
      <div className="race-dashboard-summary">
        <div><p className="eyebrow">VÒNG {snapshot?.round ?? "—"}</p><h2>{className} · {snapshot?.finishedCount ?? 0}/33 về đích</h2></div>
        <div className="race-dashboard-stats"><span><b>{snapshot?.readyCount ?? 0}</b> vào làn</span><span><b>{snapshot?.finishedCount ?? 0}</b> hoàn thành</span><span className={snapshot?.isRunning ? "running" : "paused"}><b>{snapshot?.isRunning ? "●" : "○"}</b> {snapshot?.isRunning ? "Đang đua" : "Đang chờ"}</span></div>
      </div>

      {podium.length ? (
        <div className="race-podium" aria-label="Ba vị trí dẫn đầu">
          {podium.map((racer) => <div key={racer.studentNumber} className={`place-${racer.rank}`}><span>{racer.rank === 1 ? "⚡" : racer.rank === 2 ? "Ⅱ" : "Ⅲ"}</span><strong>STT {formatStudentNumber(racer.studentNumber)}</strong><small>{formatTime(racer.adjustedSeconds)}</small></div>)}
        </div>
      ) : (
        <div className="race-no-finish"><span>ϟ</span><p>Chưa có học sinh về đích.</p></div>
      )}

      <div className="race-class-grid">
        {studentNumbers.map((studentNumber) => {
          const racer = racerMap.get(studentNumber);
          const state = racer?.finished ? "finished" : racer ? racer.progress > 0 ? "racing" : "ready" : "absent";
          return (
            <div key={studentNumber} className={`race-student-card ${state}`} title={racer?.finished ? `Hạng ${racer.rank} · ${formatTime(racer.adjustedSeconds)}` : racer ? `${racer.progress}/${OHM_RACE_STATION_COUNT} trạm` : "Chưa vào làn"}>
              <div><strong>{formatStudentNumber(studentNumber)}</strong><span>{racer?.finished ? `#${racer.rank}` : racer ? `${racer.progress}/${OHM_RACE_STATION_COUNT}` : "—"}</span></div>
              <i><span style={{ width: `${(racer?.progress ?? 0) / OHM_RACE_STATION_COUNT * 100}%` }} /></i>
            </div>
          );
        })}
      </div>
      {error ? <p className="race-dashboard-error">Mất kết nối bảng đua · đang thử lại…</p> : null}
    </section>
  );
}

