import Link from "next/link";
import { isTeacherAuthenticated } from "@/lib/auth";
import { isClassName } from "@/lib/classes";
import { getCurrentSchoolYear, isSchoolYear } from "@/lib/school-years";
import { redirect } from "next/navigation";
import OpticsQuestDashboard from "../../OpticsQuestDashboard";
import PresentationToolbar from "../PresentationToolbar";
import PhysicsBrand from "../../../PhysicsBrand";

export const dynamic = "force-dynamic";

export default async function OpticsGamePresentation({ searchParams }: { searchParams: Promise<{ class?: string; year?: string }> }) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");
  const params = await searchParams;
  const className = isClassName(params.class) ? params.class : "9H01";
  const schoolYear = isSchoolYear(params.year) ? params.year : getCurrentSchoolYear();
  return <main className="presentation-shell optics-presentation"><header className="presentation-header quest-presentation-header"><div><PhysicsBrand inverse/><p className="eyebrow">{className} · {schoolYear}</p><h1>Photon Quest</h1><p>Giải cứu Hải đăng Ánh sáng</p></div><div><PresentationToolbar/><Link href={`/giao-vien?tab=optics-game&class=${className}&year=${schoolYear}`}>← Bảng giáo viên</Link></div></header><OpticsQuestDashboard className={className} schoolYear={schoolYear} presentation/></main>;
}
