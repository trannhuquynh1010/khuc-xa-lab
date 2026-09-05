import { redirect } from "next/navigation";
import Link from "next/link";
import { isTeacherAuthenticated } from "@/lib/auth";
import { isClassName } from "@/lib/classes";
import { getCurrentSchoolYear, isSchoolYear } from "@/lib/school-years";
import PhysicsBrand from "../../../PhysicsBrand";
import OhmRaceDashboard from "../../OhmRaceDashboard";
import PresentationToolbar from "../PresentationToolbar";

export const dynamic = "force-dynamic";

export default async function OhmRacePresentationPage({ searchParams }: { searchParams: Promise<{ class?: string; year?: string }> }) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");
  const query = await searchParams;
  const selectedClass = isClassName(query.class) ? query.class : "9H01";
  const selectedYear = isSchoolYear(query.year) ? query.year : getCurrentSchoolYear();

  return (
    <main className="presentation-shell ohm-race-presentation-shell">
      <header className="presentation-header race-presentation-header">
        <div><PhysicsBrand inverse /><p className="eyebrow">{selectedClass} · {selectedYear}</p><h1>Đường đua Điện học</h1><p>Khôi phục trạm năng lượng</p></div>
        <div><PresentationToolbar /><Link href={`/giao-vien?tab=ohm&class=${selectedClass}&year=${selectedYear}`}>← Bảng giáo viên</Link></div>
      </header>
      <OhmRaceDashboard className={selectedClass} schoolYear={selectedYear} presentation />
    </main>
  );
}

