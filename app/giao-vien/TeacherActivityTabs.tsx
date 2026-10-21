"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { ActivityKey } from "@/lib/activities";

type TeacherTabItem = {
  key: ActivityKey;
  shortLabel: string;
  symbol: string;
  isOpen: boolean;
};

export default function TeacherActivityTabs({ items, selectedKey, selectedClass, selectedYear }: {
  items: TeacherTabItem[];
  selectedKey: ActivityKey;
  selectedClass: string;
  selectedYear: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<ActivityKey | null>(null);
  const menuRef = useRef<HTMLDetailsElement | null>(null);
  const visibleKey = isPending && pendingKey ? pendingKey : selectedKey;
  const visibleItem = items.find((item) => item.key === visibleKey) ?? items[0];

  return (
    <details ref={menuRef} className="activity-menu teacher-activity-menu" aria-busy={isPending}>
      <summary aria-label={`Bài đang chọn: ${visibleItem.shortLabel}. Bấm để đổi bài học.`}>
        <span className="activity-menu-current" data-activity={visibleItem.key}>
          <span className="activity-symbol" aria-hidden="true">{visibleItem.symbol}</span>
          <span><small>BÀI ĐANG CHỌN</small><strong>{visibleItem.shortLabel}</strong></span>
        </span>
        <span className={`activity-menu-status ${visibleItem.isOpen ? "open" : "closed"}`}>{isPending ? "Đang tải…" : visibleItem.isOpen ? "Đang mở" : "Đang đóng"}</span>
        <span className="activity-menu-chevron" aria-hidden="true">⌄</span>
      </summary>

      <nav className="activity-menu-panel teacher-activity-menu-panel" aria-label="Chọn bài học">
        <div className="activity-menu-panel-head"><span>CHỌN BÀI HỌC</span><small>{items.length} bài</small></div>
        <div className="activity-menu-grid">
          {items.map((activity) => {
            const href = `/giao-vien?tab=${activity.key}&class=${selectedClass}&year=${selectedYear}`;
            return (
              <Link
                key={activity.key}
                data-activity={activity.key}
                className={`activity-menu-item ${visibleKey === activity.key ? "active" : ""}`}
                href={href}
                prefetch={false}
                onClick={(event) => {
                  menuRef.current?.removeAttribute("open");
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  startTransition(() => {
                    setPendingKey(activity.key);
                    router.push(href);
                  });
                }}
                aria-current={visibleKey === activity.key ? "page" : undefined}
                aria-label={`${activity.shortLabel} · ${activity.isOpen ? "đang mở" : "đang đóng"}`}
              >
                <span className="activity-symbol" aria-hidden="true">{activity.symbol}</span>
                <span className="activity-menu-item-copy"><strong>{activity.shortLabel}</strong><small className={activity.isOpen ? "open" : "closed"}>{isPending && pendingKey === activity.key ? "Đang tải…" : activity.isOpen ? "Đang mở" : "Đang đóng"}</small></span>
                <span className="activity-menu-check" aria-hidden="true">{visibleKey === activity.key ? "✓" : ""}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </details>
  );
}
