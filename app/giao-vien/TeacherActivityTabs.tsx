"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  const visibleKey = isPending && pendingKey ? pendingKey : selectedKey;

  return (
    <nav className="teacher-tabs" aria-label="Các công cụ thí nghiệm">
      {items.map((activity) => {
        const href = `/giao-vien?tab=${activity.key}&class=${selectedClass}&year=${selectedYear}`;
        return (
          <Link
            key={activity.key}
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
            aria-current={selectedKey === activity.key ? "page" : undefined}
          >
            <span className="teacher-tab-label"><b aria-hidden="true">{activity.symbol}</b>{activity.shortLabel}</span>
            <small className={activity.isOpen ? "open" : "closed"}>{isPending && pendingKey === activity.key ? "Đang tải…" : activity.isOpen ? "Mở" : "Đóng"}</small>
          </Link>
        );
      })}
    </nav>
  );
}
