import { isTeacherAuthenticated } from "@/lib/auth";
import { activityDefinitions, getActivityDefinition, isActivityKey, type ActivityKey } from "@/lib/activities";
import { groupNames, isClassName } from "@/lib/classes";
import { listActivitySettings, listExperimentSubmissions, listSchoolYears, listSubmissions } from "@/lib/db";
import { getCurrentSchoolYear, isSchoolYear } from "@/lib/school-years";
import Link from "next/link";
import { login, logout, toggleActivity } from "./actions";
import { OhmResults, RefractionResults, ResistanceFactorsResults } from "./TeacherResults";
import TeacherClassFilter from "./TeacherClassFilter";
import TeacherYearFilter from "./TeacherYearFilter";
import ResetYearButton from "./ResetYearButton";

export const dynamic = "force-dynamic";

export default async function TeacherPage({ searchParams }: { searchParams: Promise<{ error?: string; tab?: string; class?: string; year?: string }> }) {
  const authenticated = await isTeacherAuthenticated();
  const params = await searchParams;

  if (!authenticated) {
    return (
      <main className="teacher-login-shell">
        <form action={login} className="teacher-login-card">
          <p className="eyebrow">KHU VỰC GIÁO VIÊN</p>
          <h1>Điều khiển phòng thí nghiệm</h1>
          <p>Đăng nhập để mở hoạt động, xem bài nộp và trình chiếu kết quả.</p>
          <label>Mật khẩu<input type="password" name="password" required autoComplete="current-password" autoFocus /></label>
          {params.error && <p className="error-text" role="alert">Mật khẩu chưa đúng.</p>}
          <button className="primary-button" type="submit">Đăng nhập</button>
          <Link href="/">← Quay lại trang học sinh</Link>
        </form>
      </main>
    );
  }

  const selectedKey: ActivityKey = isActivityKey(params.tab) ? params.tab : "refraction";
  const selectedClass = isClassName(params.class) ? params.class : "9H01";
  const selectedYear = isSchoolYear(params.year) ? params.year : getCurrentSchoolYear();
  const definition = getActivityDefinition(selectedKey);
  const [settings, knownSchoolYears] = await Promise.all([listActivitySettings(), listSchoolYears()]);
  const schoolYears = [...new Set([...knownSchoolYears, selectedYear])].sort((left, right) => right.localeCompare(left));
  const currentSetting = settings.find((setting) => setting.key === selectedKey)!;

  let resultContent;
  let resultCount = 0;
  let submittedGroups: string[] = [];
  if (selectedKey === "refraction") {
    const submissions = (await listSubmissions(selectedYear)).filter((submission) => submission.className === selectedClass);
    resultCount = submissions.length;
    submittedGroups = submissions.map((submission) => submission.groupName);
    resultContent = <RefractionResults submissions={submissions} />;
  } else if (selectedKey === "ohm") {
    const submissions = (await listExperimentSubmissions("ohm", selectedYear)).filter((submission) => submission.className === selectedClass);
    resultCount = submissions.length;
    submittedGroups = submissions.map((submission) => submission.groupName);
    resultContent = <OhmResults submissions={submissions} />;
  } else {
    const submissions = (await listExperimentSubmissions("resistance-factors", selectedYear)).filter((submission) => submission.className === selectedClass);
    resultCount = submissions.length;
    submittedGroups = submissions.map((submission) => submission.groupName);
    resultContent = <ResistanceFactorsResults submissions={submissions} />;
  }
  const submittedGroupSet = new Set(submittedGroups);
  const submittedCount = groupNames.filter((group) => submittedGroupSet.has(group)).length;

  return (
    <main className="teacher-shell">
      <header className="teacher-header">
        <div><p className="eyebrow">KHU VỰC GIÁO VIÊN</p><h1>Phòng thí nghiệm số</h1><p>Mở bài cho học sinh, theo dõi dữ liệu và trình chiếu kết quả.</p></div>
        <div className="teacher-actions"><Link className="secondary-button" href={`/giao-vien?tab=${selectedKey}&class=${selectedClass}&year=${selectedYear}`}>Làm mới</Link><form action={logout}><button className="secondary-button" type="submit">Đăng xuất</button></form></div>
      </header>

      <nav className="teacher-tabs" aria-label="Các công cụ thí nghiệm">
        {activityDefinitions.map((activity) => {
          const setting = settings.find((item) => item.key === activity.key);
          return <Link key={activity.key} className={selectedKey === activity.key ? "active" : ""} href={`/giao-vien?tab=${activity.key}&class=${selectedClass}&year=${selectedYear}`}><span>{activity.shortLabel}</span><small className={setting?.isOpen ? "open" : "closed"}>{setting?.isOpen ? "Đang mở" : "Đang đóng"}</small></Link>;
        })}
      </nav>

      <section className="academic-year-panel">
        <div><p className="eyebrow">DỮ LIỆU THEO NĂM HỌC</p><h2>Năm học {selectedYear}</h2><p>Bài nộp mới được tự động xếp vào năm học hiện hành.</p></div>
        <div className="academic-year-actions"><TeacherYearFilter schoolYears={schoolYears} selectedYear={selectedYear} selectedClass={selectedClass} activity={selectedKey} /><ResetYearButton schoolYear={selectedYear} /></div>
      </section>

      <section className="activity-control-panel">
        <div><p className="eyebrow">HOẠT ĐỘNG ĐANG CHỌN</p><h2>{definition.label}</h2><p>{definition.description}</p></div>
        <div className="activity-control-actions">
          <span className={`status-badge ${currentSetting.isOpen ? "open" : "closed"}`}>{currentSetting.isOpen ? "Học sinh đang thấy bài" : "Học sinh chưa thấy bài"}</span>
          <form action={toggleActivity}>
            <input type="hidden" name="activityKey" value={selectedKey} />
            <input type="hidden" name="nextOpen" value={String(!currentSetting.isOpen)} />
            <button className={currentSetting.isOpen ? "secondary-button close-activity" : "primary-button"} type="submit">{currentSetting.isOpen ? "Đóng hoạt động" : "Mở cho học sinh"}</button>
          </form>
          <Link className="presentation-button" href={`/giao-vien/trinh-chieu/${selectedKey}?class=${selectedClass}&year=${selectedYear}`} target="_blank" rel="noreferrer">▣ Trình chiếu</Link>
        </div>
      </section>

      <section className="class-progress-panel">
        <div className="class-progress-header"><div><p className="eyebrow">TIẾN ĐỘ NỘP BÀI · {selectedYear}</p><h2>{selectedClass} · {definition.shortLabel}</h2><p><strong>{submittedCount}/8 nhóm</strong> đã nộp</p></div><TeacherClassFilter selectedClass={selectedClass} selectedYear={selectedYear} activity={selectedKey} /></div>
        <div className="group-progress-grid">
          {groupNames.map((group) => {
            const submitted = submittedGroupSet.has(group);
            return <div key={group} className={`group-progress-item ${submitted ? "submitted" : "pending"}`}><span>{submitted ? "✓" : "○"}</span><div><strong>{group}</strong><small>{submitted ? "Đã nộp" : "Chưa nộp"}</small></div></div>;
          })}
        </div>
      </section>

      <div className="results-heading"><div><h2>Bài nộp: {definition.shortLabel}</h2><p>{resultCount} nhóm của lớp {selectedClass} · Năm học {selectedYear}</p></div></div>
      {resultContent}
    </main>
  );
}
