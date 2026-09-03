"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { classNames } from "@/lib/classes";
import type { ActivityKey } from "@/lib/activities";

export default function TeacherClassFilter({ selectedClass, selectedYear, activity }: { selectedClass: string; selectedYear: string; activity: ActivityKey }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <label className="class-filter">{isPending ? "Đang tải lớp…" : "Lớp"}
      <select value={selectedClass} disabled={isPending} aria-busy={isPending} onChange={(event) => { const nextClass = event.target.value; startTransition(() => router.push(`/giao-vien?tab=${activity}&class=${nextClass}&year=${selectedYear}`)); }}>
        {classNames.map((name) => <option key={name}>{name}</option>)}
      </select>
    </label>
  );
}
