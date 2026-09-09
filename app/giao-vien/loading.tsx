import PhysicsBrand from "../PhysicsBrand";

export default function TeacherLoading() {
  return (
    <main className="teacher-shell teacher-route-loading" aria-busy="true">
      <header className="teacher-header"><div className="teacher-header-copy"><PhysicsBrand /><p className="eyebrow">GIÁO VIÊN</p><h1>Bảng điều khiển</h1><p className="teacher-context">Đang tải lớp học…</p></div></header>
      <div className="teacher-loading-tabs"><span /><span /><span /><span /><span /><span /></div>
      <div className="teacher-data-skeleton"><span /><span /><span /><p>Đang tải bảng điều khiển…</p></div>
    </main>
  );
}
