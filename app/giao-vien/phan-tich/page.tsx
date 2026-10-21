import Link from "next/link";
import { isTeacherAuthenticated } from "@/lib/auth";
import { getCurrentSchoolYear, isSchoolYear } from "@/lib/school-years";
import PhysicsBrand from "@/app/PhysicsBrand";
import AiAnalyticsDashboard from "../AiAnalyticsDashboard";

/** Current school year plus the two before it, newest first. */
function recentSchoolYears(current: string) {
  const start = Number(current.slice(0, 2));
  return [0, 1, 2].map(back => {
    const from = (start - back + 100) % 100;
    return `${String(from).padStart(2, "0")}-${String((from + 1) % 100).padStart(2, "0")}`;
  });
}

export default async function AiAnalyticsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  if (!await isTeacherAuthenticated()) {
    return <main className="teacher-shell"><h1>Phân tích học tập</h1><Link href="/giao-vien">Đăng nhập giáo viên để xem</Link></main>;
  }
  const params = await searchParams;
  const current = getCurrentSchoolYear();
  const year = isSchoolYear(params.year) ? params.year : current;
  return <main className="teacher-shell">
    <header className="teacher-header">
      <div><PhysicsBrand /><p className="eyebrow">GIÁO VIÊN · MINH CHỨNG</p><h1>Phân tích học tập có AI</h1></div>
      <div className="ai-analytics-years">
        {recentSchoolYears(current).map(option => (
          <Link key={option} className={option === year ? "selected" : ""} href={`/giao-vien/phan-tich?year=${option}`}>{option}</Link>
        ))}
        <Link href="/giao-vien?tab=optics-ai-review">← Bảng giáo viên</Link>
      </div>
    </header>
    <AiAnalyticsDashboard key={year} schoolYear={year} />
  </main>;
}
