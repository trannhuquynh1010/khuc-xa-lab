import { isTeacherAuthenticated } from "@/lib/auth";
import { activityDefinitions, getActivityDefinition, isActivityKey, type ActivityKey } from "@/lib/activities";
import { isClassName, isRefractionQuizClassName } from "@/lib/classes";
import { listActivitySettings, listRefractionQuizSubmissions, listSchoolYears } from "@/lib/db";
import { getCurrentSchoolYear, isSchoolYear } from "@/lib/school-years";
import Link from "next/link";
import { Suspense } from "react";
import { login, logout, toggleActivity, togglePrismColor, toggleRefractionConstruction } from "./actions";
import { loadTeacherActivityData, RefractionQuizPanel, TeacherActivityData, TeacherDataSkeleton } from "./TeacherDashboardSections";
import TeacherYearFilter from "./TeacherYearFilter";
import ResetYearButton from "./ResetYearButton";
import PhysicsBrand from "../PhysicsBrand";

export const dynamic = "force-dynamic";

export default async function TeacherPage({ searchParams }: { searchParams: Promise<{ error?: string; tab?: string; class?: string; year?: string }> }) {
  const authenticated = await isTeacherAuthenticated();
  const params = await searchParams;

  if (!authenticated) {
    return (
      <main className="teacher-login-shell">
        <form action={login} className="teacher-login-card">
          <PhysicsBrand />
          <p className="eyebrow">GIÁO VIÊN</p>
          <h1>Đăng nhập</h1>
          <label>Mật khẩu<input type="password" name="password" required autoComplete="current-password" autoFocus /></label>
          {params.error && <p className="error-text" role="alert">Sai mật khẩu.</p>}
          <button className="primary-button" type="submit">Tiếp tục →</button>
          <Link href="/">← Học sinh</Link>
        </form>
      </main>
    );
  }

  const selectedKey: ActivityKey = isActivityKey(params.tab) ? params.tab : "refraction";
  const selectedClass = isClassName(params.class) ? params.class : selectedKey === "refraction" ? "9H04" : "9H01";
  const selectedYear = isSchoolYear(params.year) ? params.year : getCurrentSchoolYear();
  const definition = getActivityDefinition(selectedKey);
  const activityDataPromise = loadTeacherActivityData(selectedKey, selectedYear, selectedClass);
  const quizSubmissionsPromise = selectedKey === "refraction" && isRefractionQuizClassName(selectedClass)
    ? listRefractionQuizSubmissions(selectedYear, selectedClass, 100)
    : null;
  const [settings, knownSchoolYears] = await Promise.all([listActivitySettings(), listSchoolYears()]);
  const schoolYears = [...new Set([...knownSchoolYears, selectedYear])].sort((left, right) => right.localeCompare(left));
  const currentSetting = settings.find((setting) => setting.key === selectedKey)!;

  return (
    <main className="teacher-shell">
      <header className="teacher-header">
        <div><PhysicsBrand /><p className="eyebrow">GIÁO VIÊN</p><h1>Bảng điều khiển</h1></div>
        <div className="teacher-actions"><Link className="secondary-button" href={`/giao-vien?tab=${selectedKey}&class=${selectedClass}&year=${selectedYear}`}>↻ Làm mới</Link><form action={logout}><button className="secondary-button" type="submit">Thoát</button></form></div>
      </header>

      <nav className="teacher-tabs" aria-label="Các công cụ thí nghiệm">
        {activityDefinitions.map((activity) => {
          const setting = settings.find((item) => item.key === activity.key);
          return <Link key={activity.key} className={selectedKey === activity.key ? "active" : ""} href={`/giao-vien?tab=${activity.key}&class=${selectedClass}&year=${selectedYear}`}><span className="teacher-tab-label"><b aria-hidden="true">{activity.symbol}</b>{activity.shortLabel}</span><small className={setting?.isOpen ? "open" : "closed"}>{setting?.isOpen ? "Mở" : "Đóng"}</small></Link>;
        })}
      </nav>

      <section className="academic-year-panel">
        <div><p className="eyebrow">NĂM HỌC</p><h2>{selectedYear}</h2></div>
        <div className="academic-year-actions"><TeacherYearFilter schoolYears={schoolYears} selectedYear={selectedYear} selectedClass={selectedClass} activity={selectedKey} /><ResetYearButton schoolYear={selectedYear} /></div>
      </section>

      <section className="activity-control-panel">
        <div className="activity-control-title"><span aria-hidden="true">{definition.symbol}</span><div><p className="eyebrow">HOẠT ĐỘNG</p><h2>{definition.label}</h2></div></div>
        <div className="activity-control-actions">
          <span className={`status-badge ${currentSetting.isOpen ? "open" : "closed"}`}>{currentSetting.isOpen ? "● Đang mở" : "○ Đang đóng"}</span>
          <form action={toggleActivity}>
            <input type="hidden" name="activityKey" value={selectedKey} />
            <input type="hidden" name="nextOpen" value={String(!currentSetting.isOpen)} />
            <button className={currentSetting.isOpen ? "secondary-button close-activity" : "primary-button"} type="submit">{currentSetting.isOpen ? "Đóng bài" : "Mở bài"}</button>
          </form>
          <Link className="presentation-button" href={`/giao-vien/trinh-chieu/${selectedKey}?class=${selectedClass}&year=${selectedYear}`} target="_blank" rel="noreferrer">▣ Trình chiếu</Link>
        </div>
      </section>

      {selectedKey === "refraction" && (
        <section className="activity-control-panel construction-control-panel">
          <div className="activity-control-title"><span aria-hidden="true">↘</span><div><p className="eyebrow">BỔ TRỢ</p><h2>Dựng hình khúc xạ</h2><p>Hiện hoặc ẩn riêng phần hướng dẫn dựng tia.</p></div></div>
          <div className="activity-control-actions">
            <span className={`status-badge ${currentSetting.constructionOpen ? "open" : "closed"}`}>{currentSetting.constructionOpen ? "● Đang mở" : "○ Đang đóng"}</span>
            <form action={toggleRefractionConstruction}>
              <input type="hidden" name="nextOpen" value={String(!currentSetting.constructionOpen)} />
              <button className={currentSetting.constructionOpen ? "secondary-button close-activity" : "primary-button"} type="submit">{currentSetting.constructionOpen ? "Đóng dựng hình" : "Mở dựng hình"}</button>
            </form>
          </div>
        </section>
      )}

      {quizSubmissionsPromise && (
        <Suspense fallback={<TeacherDataSkeleton />}>
          <RefractionQuizPanel submissionsPromise={quizSubmissionsPromise} selectedClass={selectedClass} selectedYear={selectedYear} />
        </Suspense>
      )}

      {selectedKey === "prism-colors" && (
        <section className="activity-control-panel construction-control-panel color-control-panel">
          <div className="activity-control-title"><span aria-hidden="true">◉</span><div><p className="eyebrow">NỘI DUNG</p><h2>Màu sắc của vật</h2><p>Hiện hoặc ẩn riêng mô phỏng ánh sáng phản xạ vào mắt.</p></div></div>
          <div className="activity-control-actions">
            <span className={`status-badge ${currentSetting.colorOpen ? "open" : "closed"}`}>{currentSetting.colorOpen ? "● Đang mở" : "○ Đang đóng"}</span>
            <form action={togglePrismColor}>
              <input type="hidden" name="nextOpen" value={String(!currentSetting.colorOpen)} />
              <button className={currentSetting.colorOpen ? "secondary-button close-activity" : "primary-button"} type="submit">{currentSetting.colorOpen ? "Đóng màu sắc" : "Mở màu sắc"}</button>
            </form>
          </div>
        </section>
      )}

      <Suspense fallback={<TeacherDataSkeleton />}>
        <TeacherActivityData dataPromise={activityDataPromise} selectedClass={selectedClass} selectedYear={selectedYear} selectedKey={selectedKey} />
      </Suspense>
    </main>
  );
}
