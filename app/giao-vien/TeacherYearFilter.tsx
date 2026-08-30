"use client";

import { useRouter } from "next/navigation";
import type { ActivityKey } from "@/lib/activities";

export default function TeacherYearFilter({ schoolYears, selectedYear, selectedClass, activity }: { schoolYears: string[]; selectedYear: string; selectedClass: string; activity: ActivityKey }) {
  const router = useRouter();
  return (
    <label className="year-filter">Năm học
      <select value={selectedYear} onChange={(event) => router.push(`/giao-vien?tab=${activity}&class=${selectedClass}&year=${event.target.value}`)}>
        {schoolYears.map((year) => <option key={year}>{year}</option>)}
      </select>
    </label>
  );
}
