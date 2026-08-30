import { redirect } from "next/navigation";
import Link from "next/link";
import { isTeacherAuthenticated } from "@/lib/auth";
import { getActivityDefinition, isActivityKey } from "@/lib/activities";
import { listExperimentSubmissions, listSubmissions } from "@/lib/db";
import { OhmResults, RefractionResults, ResistanceFactorsResults } from "../../TeacherResults";
import PresentationToolbar from "../PresentationToolbar";

export const dynamic = "force-dynamic";

export default async function PresentationPage({ params }: { params: Promise<{ activity: string }> }) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");
  const { activity } = await params;
  if (!isActivityKey(activity)) redirect("/giao-vien");
  const definition = getActivityDefinition(activity);

  let latestResult;
  let groupLabel = "Chưa có bài nộp";
  if (activity === "refraction") {
    const submissions = (await listSubmissions()).slice(0, 1);
    if (submissions[0]) groupLabel = `${submissions[0].className} · ${submissions[0].groupName}`;
    latestResult = <RefractionResults submissions={submissions} />;
  } else if (activity === "ohm") {
    const submissions = (await listExperimentSubmissions("ohm")).slice(0, 1);
    if (submissions[0]) groupLabel = `${submissions[0].className} · ${submissions[0].groupName}`;
    latestResult = <OhmResults submissions={submissions} />;
  } else {
    const submissions = (await listExperimentSubmissions("resistance-factors")).slice(0, 1);
    if (submissions[0]) groupLabel = `${submissions[0].className} · ${submissions[0].groupName}`;
    latestResult = <ResistanceFactorsResults submissions={submissions} />;
  }

  return (
    <main className="presentation-shell">
      <header className="presentation-header">
        <div><p className="eyebrow">KẾT QUẢ MỚI NHẤT</p><h1>{definition.label}</h1><p>{groupLabel}</p></div>
        <div><PresentationToolbar /><Link href={`/giao-vien?tab=${activity}`}>← Quay lại bảng giáo viên</Link></div>
      </header>
      {latestResult}
    </main>
  );
}
