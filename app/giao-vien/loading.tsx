import PhysicsBrand from "../PhysicsBrand";

export default function TeacherLoading() {
  return (
    <main className="teacher-shell teacher-route-loading" aria-busy="true">
      <header className="teacher-header"><div><PhysicsBrand /><p className="eyebrow">GIÁO VIÊN</p><h1>Bảng điều khiển</h1></div></header>
      <div className="teacher-loading-tabs"><span /><span /><span /><span /></div>
      <div className="teacher-data-skeleton"><span /><span /><span /><p>Đang tải bảng điều khiển…</p></div>
    </main>
  );
}
