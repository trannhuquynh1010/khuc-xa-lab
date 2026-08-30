import { isTeacherAuthenticated } from "@/lib/auth";
import { activityDefinitions, getActivityDefinition, isActivityKey, type ActivityKey } from "@/lib/activities";
import { listActivitySettings, listExperimentSubmissions, listSubmissions } from "@/lib/db";
import Link from "next/link";
import { login, logout, toggleActivity } from "./actions";
import { OhmResults, RefractionResults, ResistanceFactorsResults } from "./TeacherResults";

export const dynamic = "force-dynamic";

export default async function TeacherPage({ searchParams }: { searchParams: Promise<{ error?: string; tab?: string }> }) {
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
  const definition = getActivityDefinition(selectedKey);
  const settings = await listActivitySettings();
  const currentSetting = settings.find((setting) => setting.key === selectedKey)!;

  let resultContent;
  let resultCount = 0;
  if (selectedKey === "refraction") {
    const submissions = await listSubmissions();
    resultCount = submissions.length;
    resultContent = <RefractionResults submissions={submissions} />;
  } else if (selectedKey === "ohm") {
    const submissions = await listExperimentSubmissions("ohm");
    resultCount = submissions.length;
    resultContent = <OhmResults submissions={submissions} />;
  } else {
    const submissions = await listExperimentSubmissions("resistance-factors");
    resultCount = submissions.length;
    resultContent = <ResistanceFactorsResults submissions={submissions} />;
  }

  return (
    <main className="teacher-shell">
      <header className="teacher-header">
        <div><p className="eyebrow">KHU VỰC GIÁO VIÊN</p><h1>Phòng thí nghiệm số</h1><p>Mở bài cho học sinh, theo dõi dữ liệu và trình chiếu kết quả.</p></div>
        <div className="teacher-actions"><Link className="secondary-button" href={`/giao-vien?tab=${selectedKey}`}>Làm mới</Link><form action={logout}><button className="secondary-button" type="submit">Đăng xuất</button></form></div>
      </header>

      <nav className="teacher-tabs" aria-label="Các công cụ thí nghiệm">
        {activityDefinitions.map((activity) => {
          const setting = settings.find((item) => item.key === activity.key);
          return <Link key={activity.key} className={selectedKey === activity.key ? "active" : ""} href={`/giao-vien?tab=${activity.key}`}><span>{activity.shortLabel}</span><small className={setting?.isOpen ? "open" : "closed"}>{setting?.isOpen ? "Đang mở" : "Đang đóng"}</small></Link>;
        })}
      </nav>

      <section className="activity-control-panel">
        <div><p className="eyebrow">HOẠT ĐỘNG ĐANG CHỌN</p><h2>{definition.label}</h2><p>{definition.description}</p></div>
        <div className="activity-control-actions">
          <span className={`status-badge ${currentSetting.isOpen ? "open" : "closed"}`}>{currentSetting.isOpen ? "Học sinh đang thấy bài" : "Học sinh chưa thấy bài"}</span>
          <form action={toggleActivity}>
            <input type="hidden" name="activityKey" value={selectedKey} />
            <input type="hidden" name="nextOpen" value={String(!currentSetting.isOpen)} />
            <button className={currentSetting.isOpen ? "secondary-button close-activity" : "primary-button"} type="submit">{currentSetting.isOpen ? "Đóng hoạt động" : "Mở cho học sinh"}</button>
          </form>
          <Link className="presentation-button" href={`/giao-vien/trinh-chieu/${selectedKey}`} target="_blank" rel="noreferrer">▣ Trình chiếu</Link>
        </div>
      </section>

      <div className="results-heading"><div><h2>Bài nộp: {definition.shortLabel}</h2><p>{resultCount} lượt gửi gần nhất</p></div></div>
      {resultContent}
    </main>
  );
}
