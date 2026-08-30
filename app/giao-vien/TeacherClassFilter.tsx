"use client";

import { useRouter } from "next/navigation";
import { classNames } from "@/lib/classes";
import type { ActivityKey } from "@/lib/activities";

export default function TeacherClassFilter({ selectedClass, selectedYear, activity }: { selectedClass: string; selectedYear: string; activity: ActivityKey }) {
  const router = useRouter();
  return (
    <label className="class-filter">Lớp đang dạy
      <select value={selectedClass} onChange={(event) => router.push(`/giao-vien?tab=${activity}&class=${event.target.value}&year=${selectedYear}`)}>
        {classNames.map((name) => <option key={name}>{name}</option>)}
      </select>
    </label>
  );
}
