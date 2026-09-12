"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { activityDefinitions, isActivityKey, type ActivityKey } from "@/lib/activities";
import PhysicsBrand from "./PhysicsBrand";

function ActivityToolLoading() {
  return <div className="waiting-card tool-loading-card"><span className="loading-dot" /><div><h2>Đang mở hoạt động</h2><p>Chỉ mất một chút thời gian.</p></div></div>;
}

const LabForm = dynamic(() => import("./LabForm"), { loading: ActivityToolLoading });
const PrismColorLabForm = dynamic(() => import("./PrismColorLabForm"), { loading: ActivityToolLoading });
const PrismLiveStudent = dynamic(() => import("./PrismLiveStudent"), { loading: ActivityToolLoading });
const OpticsQuestGame = dynamic(() => import("./OpticsQuestGame"), { loading: ActivityToolLoading });
const OpticsReviewPractice = dynamic(() => import("./OpticsReviewPractice"), { loading: ActivityToolLoading });
const LensPathExplorer = dynamic(() => import("./LensPathExplorer"), { loading: ActivityToolLoading });
const OhmLabForm = dynamic(() => import("./OhmLabForm"), { loading: ActivityToolLoading });
const ResistanceFactorsLabForm = dynamic(() => import("./ResistanceFactorsLabForm"), { loading: ActivityToolLoading });

type ActivityStatus = { key: ActivityKey; isOpen: boolean; constructionOpen: boolean; applicationOpen: boolean; colorOpen: boolean; iuPracticeOpen: boolean; ohmLawPracticeOpen: boolean; ohmRaceOpen: boolean; ohmRaceRunning: boolean; ohmRaceRound: number; ohmRaceStartedAt: string | null; resistivityOpen: boolean; resistanceFactorsPracticeOpen: boolean; opticsGameRunning: boolean; opticsGameRound: number; opticsGameStartedAt: string | null; updatedAt: string };

export default function StudentWorkspace() {
  const [activities, setActivities] = useState<ActivityStatus[] | null>(null);
  const [activeKey, setActiveKey] = useState<ActivityKey | null>(null);
  const [loadError, setLoadError] = useState(false);
  const activityMenuRef = useRef<HTMLDetailsElement | null>(null);

  const loadActivities = useCallback(async () => {
    try {
      const response = await fetch("/api/activities", { cache: "no-store" });
      if (!response.ok) throw new Error("Activity request failed");
      const result = await response.json();
      setActivities(result.activities);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadActivities, 0);
    const interval = window.setInterval(loadActivities, 5000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadActivities]);

  useEffect(() => {
    const requestedActivity = new URLSearchParams(window.location.search).get("activity");
    const timer = window.setTimeout(() => {
      if (isActivityKey(requestedActivity)) setActiveKey(requestedActivity);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const openKeys = useMemo(() => activityDefinitions
    .filter((definition) => activities?.some((activity) => activity.key === definition.key && activity.isOpen))
    .map((definition) => definition.key), [activities]);
  const openActivities = useMemo(() => activityDefinitions.filter((definition) => openKeys.includes(definition.key)), [openKeys]);

  const visibleActiveKey = activeKey && openKeys.includes(activeKey) ? activeKey : openKeys[0] ?? null;
  const activeDefinition = visibleActiveKey ? activityDefinitions.find((activity) => activity.key === visibleActiveKey) : null;
  const constructionOpen = activities?.find((activity) => activity.key === "refraction")?.constructionOpen ?? false;
  const applicationOpen = activities?.find((activity) => activity.key === "refraction")?.applicationOpen ?? false;
  const prismColorOpen = activities?.find((activity) => activity.key === "prism-colors")?.colorOpen ?? false;
  const currentVoltagePracticeOpen = activities?.find((activity) => activity.key === "ohm")?.iuPracticeOpen ?? false;
  const ohmsLawPracticeOpen = activities?.find((activity) => activity.key === "ohm")?.ohmLawPracticeOpen ?? false;
  const ohmSetting = activities?.find((activity) => activity.key === "ohm");
  const ohmRaceOpen = ohmSetting?.ohmRaceOpen ?? false;
  const ohmRaceRunning = ohmSetting?.ohmRaceRunning ?? false;
  const ohmRaceRound = ohmSetting?.ohmRaceRound ?? 1;
  const ohmRaceStartedAt = ohmSetting?.ohmRaceStartedAt ?? null;
  const resistivityOpen = activities?.find((activity) => activity.key === "resistance-factors")?.resistivityOpen ?? false;
  const resistanceFactorsPracticeOpen = activities?.find((activity) => activity.key === "resistance-factors")?.resistanceFactorsPracticeOpen ?? false;
  const opticsGameSetting = activities?.find((activity) => activity.key === "optics-game");
  const heroTheme = visibleActiveKey === "refraction" || visibleActiveKey === "prism-colors" || visibleActiveKey === "optics-game" || visibleActiveKey === "optics-review" || visibleActiveKey === "lenses" || visibleActiveKey === null ? "optics" : "electricity";
  const heroSymbols = visibleActiveKey === "ohm"
    ? ["U", "I", "A"]
    : visibleActiveKey === "resistance-factors"
      ? ["R", "Ω", "ρ"]
      : visibleActiveKey === "prism-colors"
        ? ["△", "λ", "n"]
        : visibleActiveKey === "optics-game"
          ? ["✦", "λ", "n"]
          : visibleActiveKey === "optics-review"
            ? ["◎", "↘", "△"]
            : visibleActiveKey === "lenses"
              ? ["O", "F", "F′"]
          : ["i", "r", "n"];

  return (
    <>
      <header className="hero workspace-hero">
        <div className="hero-copy">
          <div className="hero-meta">
            <PhysicsBrand />
            <div className="course-identity">
              <strong>Lawrence S. Ting School</strong>
              <span>Ms. Quỳnh</span>
              <span>Natural Science - Physics 9</span>
            </div>
          </div>
          <p className="eyebrow">THÍ NGHIỆM TRỰC TUYẾN</p>
          <h1>{activities === null ? "Physics Lab" : activeDefinition?.label ?? "Phòng thí nghiệm"}</h1>
          <p>{activities === null ? "Đang kết nối lớp học…" : activeDefinition?.description ?? "Chờ giáo viên mở bài."}</p>
        </div>
        <div className={`physics-hero-art ${heroTheme}`} aria-hidden="true">
          {heroSymbols.map((symbol) => <span key={symbol}>{symbol}</span>)}
          <i />
        </div>
        <span className={`live-indicator ${activities === null ? "connecting" : loadError ? "offline" : ""}`} aria-live="polite"><i /> {activities === null ? "Đang kết nối" : loadError ? "Mất kết nối" : "Trực tuyến"}</span>
      </header>

      {activities === null && !loadError ? (
        <div className="waiting-card workspace-loading-card"><span className="loading-dot" /><div><h2>Đang chuẩn bị lớp học</h2><p>Hệ thống đang kiểm tra hoạt động giáo viên đã mở.</p></div></div>
      ) : loadError && activities === null ? (
        <div className="waiting-card"><h2>Mất kết nối</h2><button type="button" className="secondary-button" onClick={loadActivities}>Thử lại</button></div>
      ) : !openKeys.length ? (
        <div className="waiting-card"><span className="lock-symbol">⌁</span><h2>Đang chờ giáo viên</h2></div>
      ) : (
        <>
          <details ref={activityMenuRef} className="activity-menu student-activity-menu">
            <summary aria-label={`Bài đang chọn: ${activeDefinition?.shortLabel}. Bấm để đổi bài học.`}>
              <span className="activity-menu-current" data-activity={visibleActiveKey ?? undefined}>
                <span className="activity-symbol" aria-hidden="true">{activeDefinition?.symbol}</span>
                <span><small>BÀI ĐANG HỌC</small><strong>{activeDefinition?.shortLabel}</strong></span>
              </span>
              <span className="activity-menu-count">{openActivities.length} bài đang mở</span>
              <span className="activity-menu-chevron" aria-hidden="true">⌄</span>
            </summary>

            <nav className="activity-menu-panel student-activity-menu-panel" role="tablist" aria-label="Chọn bài học đang mở">
              <div className="activity-menu-panel-head"><span>CHỌN BÀI HỌC</span><small>{openActivities.length} bài đang mở</small></div>
              <div className="activity-menu-grid">
                {openActivities.map((activity) => (
                  <button
                    key={activity.key}
                    type="button"
                    role="tab"
                    data-activity={activity.key}
                    aria-selected={visibleActiveKey === activity.key}
                    className={`activity-menu-item ${visibleActiveKey === activity.key ? "active" : ""}`}
                    onClick={() => {
                      setActiveKey(activity.key);
                      activityMenuRef.current?.removeAttribute("open");
                    }}
                  >
                    <span className="activity-symbol" aria-hidden="true">{activity.symbol}</span>
                    <span className="activity-menu-item-copy"><strong>{activity.shortLabel}</strong><small>Nhấn để mở bài</small></span>
                    <span className="activity-menu-check" aria-hidden="true">{visibleActiveKey === activity.key ? "✓" : ""}</span>
                  </button>
                ))}
              </div>
            </nav>
          </details>
          {visibleActiveKey === "refraction" ? <LabForm showApplication={applicationOpen} showConstruction={constructionOpen} /> : null}
          {visibleActiveKey === "prism-colors" ? <><PrismColorLabForm showColorActivity={prismColorOpen} /><PrismLiveStudent /></> : null}
          {visibleActiveKey === "optics-game" ? <div className="lab-card quest-shell"><OpticsQuestGame round={opticsGameSetting?.opticsGameRound ?? 1} running={opticsGameSetting?.opticsGameRunning ?? false} startedAt={opticsGameSetting?.opticsGameStartedAt ?? null} /></div> : null}
          {visibleActiveKey === "optics-review" ? <OpticsReviewPractice /> : null}
          {visibleActiveKey === "lenses" ? <LensPathExplorer /> : null}
          {visibleActiveKey === "ohm" ? <OhmLabForm showCurrentVoltagePractice={currentVoltagePracticeOpen} showOhmsLawPractice={ohmsLawPracticeOpen} showRace={ohmRaceOpen} raceRunning={ohmRaceRunning} raceRound={ohmRaceRound} raceStartedAt={ohmRaceStartedAt} /> : null}
          {visibleActiveKey === "resistance-factors" ? <ResistanceFactorsLabForm showResistivity={resistivityOpen} showPractice={resistanceFactorsPracticeOpen} /> : null}
        </>
      )}
    </>
  );
}
