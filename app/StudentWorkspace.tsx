"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { activityDefinitions, isActivityKey, type ActivityKey } from "@/lib/activities";
import LabForm from "./LabForm";
import OhmLabForm from "./OhmLabForm";
import ResistanceFactorsLabForm from "./ResistanceFactorsLabForm";
import PrismColorLabForm from "./PrismColorLabForm";
import PhysicsBrand from "./PhysicsBrand";

type ActivityStatus = { key: ActivityKey; isOpen: boolean; constructionOpen: boolean; applicationOpen: boolean; colorOpen: boolean; iuPracticeOpen: boolean; ohmLawPracticeOpen: boolean; resistivityOpen: boolean; updatedAt: string };

export default function StudentWorkspace() {
  const [activities, setActivities] = useState<ActivityStatus[] | null>(null);
  const [activeKey, setActiveKey] = useState<ActivityKey | null>(null);
  const [loadError, setLoadError] = useState(false);

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

  const visibleActiveKey = activeKey && openKeys.includes(activeKey) ? activeKey : openKeys[0] ?? null;
  const activeDefinition = visibleActiveKey ? activityDefinitions.find((activity) => activity.key === visibleActiveKey) : null;
  const constructionOpen = activities?.find((activity) => activity.key === "refraction")?.constructionOpen ?? false;
  const applicationOpen = activities?.find((activity) => activity.key === "refraction")?.applicationOpen ?? false;
  const prismColorOpen = activities?.find((activity) => activity.key === "prism-colors")?.colorOpen ?? false;
  const currentVoltagePracticeOpen = activities?.find((activity) => activity.key === "ohm")?.iuPracticeOpen ?? false;
  const ohmsLawPracticeOpen = activities?.find((activity) => activity.key === "ohm")?.ohmLawPracticeOpen ?? false;
  const resistivityOpen = activities?.find((activity) => activity.key === "resistance-factors")?.resistivityOpen ?? false;
  const heroTheme = visibleActiveKey === "refraction" || visibleActiveKey === "prism-colors" || visibleActiveKey === null ? "optics" : "electricity";
  const heroSymbols = visibleActiveKey === "ohm"
    ? ["U", "I", "A"]
    : visibleActiveKey === "resistance-factors"
      ? ["R", "Ω", "ρ"]
      : visibleActiveKey === "prism-colors"
        ? ["△", "λ", "n"]
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
          <h1>{activeDefinition?.label ?? "Phòng thí nghiệm"}</h1>
          <p>{activeDefinition?.description ?? "Chờ giáo viên mở bài."}</p>
        </div>
        <div className={`physics-hero-art ${heroTheme}`} aria-hidden="true">
          {heroSymbols.map((symbol) => <span key={symbol}>{symbol}</span>)}
          <i />
        </div>
        <span className="live-indicator"><i /> Trực tuyến</span>
      </header>

      {activities === null && !loadError ? (
        <div className="waiting-card"><span className="loading-dot" /><h2>Đang tải…</h2></div>
      ) : loadError && activities === null ? (
        <div className="waiting-card"><h2>Mất kết nối</h2><button type="button" className="secondary-button" onClick={loadActivities}>Thử lại</button></div>
      ) : !openKeys.length ? (
        <div className="waiting-card"><span className="lock-symbol">⌁</span><h2>Đang chờ giáo viên</h2></div>
      ) : (
        <>
          <nav className="activity-tabs" role="tablist" aria-label="Công cụ thí nghiệm đang mở">
            {activityDefinitions.filter((activity) => openKeys.includes(activity.key)).map((activity) => (
              <button key={activity.key} type="button" role="tab" aria-selected={visibleActiveKey === activity.key} className={visibleActiveKey === activity.key ? "active" : ""} onClick={() => setActiveKey(activity.key)}><span className="activity-symbol" aria-hidden="true">{activity.symbol}</span><span>{activity.shortLabel}</span></button>
            ))}
          </nav>
          <div hidden={visibleActiveKey !== "refraction"}><LabForm showApplication={applicationOpen} showConstruction={constructionOpen} /></div>
          <div hidden={visibleActiveKey !== "ohm"}><OhmLabForm showCurrentVoltagePractice={currentVoltagePracticeOpen} showOhmsLawPractice={ohmsLawPracticeOpen} /></div>
          <div hidden={visibleActiveKey !== "resistance-factors"}><ResistanceFactorsLabForm showResistivity={resistivityOpen} /></div>
          <div hidden={visibleActiveKey !== "prism-colors"}><PrismColorLabForm showColorActivity={prismColorOpen} /></div>
        </>
      )}
    </>
  );
}
