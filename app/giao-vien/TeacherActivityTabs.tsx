"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
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
  const activeTabRef = useRef<HTMLAnchorElement | null>(null);
  const visibleKey = isPending && pendingKey ? pendingKey : selectedKey;

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [visibleKey]);

  return (
    <nav className="teacher-tabs" aria-label="Các công cụ thí nghiệm" aria-busy={isPending}>
      {items.map((activity) => {
        const href = `/giao-vien?tab=${activity.key}&class=${selectedClass}&year=${selectedYear}`;
        return (
          <Link
            key={activity.key}
            ref={visibleKey === activity.key ? activeTabRef : undefined}
            data-activity={activity.key}
            className={visibleKey === activity.key ? "active" : ""}
            href={href}
            onClick={(event) => {
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
            <span className="teacher-tab-label"><b aria-hidden="true">{activity.symbol}</b>{activity.shortLabel}</span>
            <small className={activity.isOpen ? "open" : "closed"}>{isPending && pendingKey === activity.key ? "Đang tải…" : activity.isOpen ? "Mở" : "Đóng"}</small>
          </Link>
        );
      })}
    </nav>
  );
}
