import { redirect } from "next/navigation";
import Link from "next/link";
import { isTeacherAuthenticated } from "@/lib/auth";
import { getActivityDefinition, isActivityKey } from "@/lib/activities";
import { classNames, isClassName } from "@/lib/classes";
import { getCurrentSchoolYear, isSchoolYear } from "@/lib/school-years";
import PrismLiveStage from "../../PrismLiveStage";
import FullscreenButton from "../../FullscreenButton";

export const dynamic = "force-dynamic";

/**
 * Trình chiếu câu hỏi từng câu kiểu ClassPoint (toàn màn hình).
 * Dùng chung cho mọi hoạt động chạy trên hệ prism-live (hiện tại: prism-colors, total-internal-reflection).
 * Thêm hoạt động mới chỉ cần seed câu hỏi có quiz_set và (nếu muốn điểm cộng) cấu hình trong prismLiveBonusConfigs.
 */
export default async function LiveQuizPresentation({ params, searchParams }: { params: Promise<{ activity: string }>; searchParams: Promise<{ class?: string; year?: string }> }) {
  if (!(await isTeacherAuthenticated())) redirect("/giao-vien");
  const { activity } = await params;
  if (!isActivityKey(activity)) redirect("/giao-vien");
  const query = await searchParams;
  const selectedClass = isClassName(query.class) ? query.class : classNames[0];
  const selectedYear = isSchoolYear(query.year) ? query.year : getCurrentSchoolYear();
  const definition = getActivityDefinition(activity);

  return (
    <main className="cp-shell">
      <div className="cp-shell-bar">
        <Link className="cp-mini-button" href={`/giao-vien?tab=${activity}&class=${selectedClass}&year=${selectedYear}`}>← Bảng giáo viên</Link>
        <FullscreenButton />
      </div>
      <PrismLiveStage
        className={selectedClass}
        schoolYear={selectedYear}
        isCurrentYear={selectedYear === getCurrentSchoolYear()}
        activityKey={activity}
        title={definition.label}
        presentation
      />
    </main>
  );
}
