"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ActivityKey } from "@/lib/activities";

export default function TeacherYearFilter({ schoolYears, selectedYear, selectedClass, activity }: { schoolYears: string[]; selectedYear: string; selectedClass: string; activity: ActivityKey }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <label className="year-filter">{isPending ? "Đang tải…" : "Năm học"}
      <select value={selectedYear} disabled={isPending} aria-busy={isPending} onChange={(event) => { const nextYear = event.target.value; startTransition(() => router.push(`/giao-vien?tab=${activity}&class=${selectedClass}&year=${nextYear}`)); }}>
        {schoolYears.map((year) => <option key={year}>{year}</option>)}
      </select>
    </label>
  );
}
