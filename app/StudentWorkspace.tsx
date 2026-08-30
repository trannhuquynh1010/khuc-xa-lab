"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { activityDefinitions, type ActivityKey } from "@/lib/activities";
import LabForm from "./LabForm";
import OhmLabForm from "./OhmLabForm";
import ResistanceFactorsLabForm from "./ResistanceFactorsLabForm";

type ActivityStatus = { key: ActivityKey; isOpen: boolean; updatedAt: string };

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

  const openKeys = useMemo(() => activityDefinitions
    .filter((definition) => activities?.some((activity) => activity.key === definition.key && activity.isOpen))
    .map((definition) => definition.key), [activities]);

  const visibleActiveKey = activeKey && openKeys.includes(activeKey) ? activeKey : openKeys[0] ?? null;
  const activeDefinition = visibleActiveKey ? activityDefinitions.find((activity) => activity.key === visibleActiveKey) : null;

  return (
    <>
      <header className="hero workspace-hero">
        <div><p className="eyebrow">PHÒNG THÍ NGHIỆM SỐ</p><h1>{activeDefinition?.label ?? "Hoạt động thí nghiệm"}</h1><p>{activeDefinition?.description ?? "Giáo viên sẽ mở hoạt động khi lớp bắt đầu thực hành."}</p></div>
        <span className="live-indicator"><i /> Tự động cập nhật</span>
      </header>

      {activities === null && !loadError ? (
        <div className="waiting-card"><span className="loading-dot" /><h2>Đang tải hoạt động…</h2></div>
      ) : loadError && activities === null ? (
        <div className="waiting-card"><h2>Chưa tải được hoạt động</h2><p>Kiểm tra kết nối rồi thử lại.</p><button type="button" className="secondary-button" onClick={loadActivities}>Thử lại</button></div>
      ) : !openKeys.length ? (
        <div className="waiting-card"><span className="lock-symbol">⌛</span><h2>Chưa có hoạt động đang mở</h2><p>Trang sẽ tự hiển thị công cụ ngay khi giáo viên mở bài.</p></div>
      ) : (
        <>
          <nav className="activity-tabs" role="tablist" aria-label="Công cụ thí nghiệm đang mở">
            {activityDefinitions.filter((activity) => openKeys.includes(activity.key)).map((activity) => (
              <button key={activity.key} type="button" role="tab" aria-selected={visibleActiveKey === activity.key} className={visibleActiveKey === activity.key ? "active" : ""} onClick={() => setActiveKey(activity.key)}>{activity.shortLabel}</button>
            ))}
          </nav>
          <div hidden={visibleActiveKey !== "refraction"}><LabForm /></div>
          <div hidden={visibleActiveKey !== "ohm"}><OhmLabForm /></div>
          <div hidden={visibleActiveKey !== "resistance-factors"}><ResistanceFactorsLabForm /></div>
        </>
      )}
    </>
  );
}
