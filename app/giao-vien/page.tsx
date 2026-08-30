import { isTeacherAuthenticated } from "@/lib/auth";
import { listSubmissions } from "@/lib/db";
import { formatSineRatio } from "@/lib/physics";
import Link from "next/link";
import RelationshipChart from "../RelationshipChart";
import { login, logout } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export default async function TeacherPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const authenticated = await isTeacherAuthenticated();
  const params = await searchParams;

  if (!authenticated) {
    return (
      <main className="teacher-login-shell">
        <form action={login} className="teacher-login-card">
          <p className="eyebrow">KHU VỰC GIÁO VIÊN</p>
          <h1>Xem dữ liệu thí nghiệm</h1>
          <p>Đăng nhập bằng mật khẩu giáo viên để xem bài nộp của các nhóm.</p>
          <label>Mật khẩu<input type="password" name="password" required autoComplete="current-password" autoFocus /></label>
          {params.error && <p className="error-text" role="alert">Mật khẩu chưa đúng.</p>}
          <button className="primary-button" type="submit">Đăng nhập</button>
          <Link href="/">← Quay lại trang học sinh</Link>
        </form>
      </main>
    );
  }

  const submissions = await listSubmissions();

  return (
    <main className="teacher-shell">
      <header className="teacher-header">
        <div><p className="eyebrow">KHU VỰC GIÁO VIÊN</p><h1>Dữ liệu thí nghiệm</h1><p>{submissions.length} lượt gửi gần nhất</p></div>
        <div className="teacher-actions"><Link className="secondary-button" href="/giao-vien">Làm mới</Link><form action={logout}><button className="secondary-button" type="submit">Đăng xuất</button></form></div>
      </header>

      {!submissions.length ? (
        <div className="empty-state"><h2>Chưa có dữ liệu</h2><p>Kết quả học sinh gửi sẽ xuất hiện tại đây.</p></div>
      ) : (
        <div className="submission-list">
          {submissions.map((submission, index) => (
            <article className="submission-card" key={submission.id}>
              <div className="submission-summary">
                <div><span>Lớp</span><strong>{submission.className}</strong></div>
                <div><span>Nhóm</span><strong>{submission.groupName}</strong></div>
                <div><span>Số lần đo</span><strong>{submission.measurements.length}</strong></div>
                <time dateTime={submission.createdAt}>{formatDate(submission.createdAt)}</time>
              </div>
              <details open={index === 0}>
                <summary>Xem bảng số liệu và đồ thị</summary>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Lần đo</th><th>i (°)</th><th>r (°)</th><th>sin i</th><th>sin r</th><th>sin i / sin r</th></tr></thead>
                    <tbody>{submission.measurements.map((item) => <tr key={item.sequence}><th scope="row">{item.sequence}</th><td>{item.incidenceAngle}</td><td>{item.refractionAngle}</td><td>{item.sinIncidence}</td><td>{item.sinRefraction}</td><td className="ratio-cell">{formatSineRatio(item.sinIncidence, item.sinRefraction)}</td></tr>)}</tbody>
                  </table>
                </div>
                <div className="chart-grid teacher-chart-grid">
                  <RelationshipChart
                    title="Góc tới và góc khúc xạ"
                    xLabel="Góc tới i (°)"
                    yLabel="Góc khúc xạ r (°)"
                    points={submission.measurements}
                    xValue={(point) => point.incidenceAngle}
                    yValue={(point) => point.refractionAngle}
                    ceiling={90}
                  />
                  <RelationshipChart
                    title="sin i và sin r"
                    xLabel="sin i"
                    yLabel="sin r"
                    points={submission.measurements}
                    xValue={(point) => point.sinIncidence}
                    yValue={(point) => point.sinRefraction}
                    ceiling={1}
                  />
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
