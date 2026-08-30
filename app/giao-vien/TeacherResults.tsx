import type { Submission } from "@/lib/db";
import type { ExperimentSubmission, OhmPayload, ResistanceFactor, ResistanceFactorsPayload } from "@/lib/experiments";
import { formatSineRatio } from "@/lib/physics";
import MaterialBarChart from "../MaterialBarChart";
import RelationshipChart from "../RelationshipChart";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function EmptyResults() {
  return <div className="empty-state"><span aria-hidden="true">⌁</span><h2>Chưa có bài nộp</h2></div>;
}

export function RefractionResults({ submissions }: { submissions: Submission[] }) {
  if (!submissions.length) return <EmptyResults />;
  return (
    <div className="submission-list">
      {submissions.map((submission, index) => (
        <article className="submission-card" key={submission.id}>
          <div className="submission-summary">
            <div><span>Lớp</span><strong>{submission.className}</strong></div>
            <div><span>Nhóm</span><strong>{submission.groupName}</strong></div>
            <div><span>Môi trường tới</span><strong>{submission.incidenceMedium ?? "—"}</strong></div>
            <div><span>Môi trường khúc xạ</span><strong>{submission.refractionMedium ?? "—"}</strong></div>
            <div><span>Số lần đo</span><strong>{submission.measurements.length}</strong></div>
            <time dateTime={submission.createdAt}>{formatDate(submission.createdAt)}</time>
          </div>
          <details className="refraction-result-details" open={index === 0}>
            <summary>Xem kết quả</summary>
            <div className="refraction-result-layout">
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Lần đo</th><th>i (°)</th><th>r (°)</th><th>sin i</th><th>sin r</th><th>sin i / sin r</th></tr></thead>
                  <tbody>{submission.measurements.map((item) => <tr key={item.sequence}><th scope="row">{item.sequence}</th><td>{item.incidenceAngle}</td><td>{item.refractionAngle}</td><td>{item.sinIncidence}</td><td>{item.sinRefraction}</td><td className="ratio-cell">{formatSineRatio(item.sinIncidence, item.sinRefraction)}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="chart-grid teacher-chart-grid">
                <div className="chart-with-conclusion"><RelationshipChart title="Góc tới và góc khúc xạ" xLabel="Góc tới i (°)" yLabel="Góc khúc xạ r (°)" points={submission.measurements} xValue={(point) => point.incidenceAngle} yValue={(point) => point.refractionAngle} ceiling={90} /><div className="conclusion-answer"><span>Kết luận của nhóm</span><p>{submission.conclusionAngles ?? "Bài nộp cũ chưa có kết luận."}</p></div></div>
                <div className="chart-with-conclusion"><RelationshipChart title="sin i và sin r" xLabel="sin i" yLabel="sin r" points={submission.measurements} xValue={(point) => point.sinIncidence} yValue={(point) => point.sinRefraction} ceiling={1} /><div className="conclusion-answer"><span>Kết luận của nhóm</span><p>{submission.conclusionSines ?? "Bài nộp cũ chưa có kết luận."}</p></div></div>
              </div>
            </div>
          </details>
        </article>
      ))}
    </div>
  );
}

export function OhmResults({ submissions }: { submissions: ExperimentSubmission<OhmPayload>[] }) {
  if (!submissions.length) return <EmptyResults />;
  return (
    <div className="submission-list">
      {submissions.map((submission, index) => {
        return (
          <article className="submission-card" key={submission.id}>
            <div className="submission-summary compact-summary">
              <div><span>Lớp</span><strong>{submission.className}</strong></div>
              <div><span>Nhóm</span><strong>{submission.groupName}</strong></div>
              <div><span>Số lần đo</span><strong>{submission.payload.measurements.length}</strong></div>
              <time dateTime={submission.createdAt}>{formatDate(submission.createdAt)}</time>
            </div>
            <details className="ohm-result-details" open={index === 0}>
              <summary>Xem kết quả</summary>
              <div className="ohm-result-layout">
                <div className="table-scroll"><table className="compact-data-table"><thead><tr><th>Lần đo</th><th>U (V)</th><th>I (A)</th></tr></thead><tbody>{submission.payload.measurements.map((item) => <tr key={item.sequence}><th scope="row">{item.sequence}</th><td>{item.voltage}</td><td>{item.current}</td></tr>)}</tbody></table></div>
                <div className="single-chart teacher-chart-grid"><RelationshipChart title="Cường độ dòng điện theo hiệu điện thế" xLabel="Hiệu điện thế U (V)" yLabel="Cường độ dòng điện I (A)" points={submission.payload.measurements} xValue={(point) => point.voltage} yValue={(point) => point.current} xCeiling={Math.max(5, ...submission.payload.measurements.map((point) => point.voltage * 1.2))} yCeiling={Math.max(1, ...submission.payload.measurements.map((point) => point.current * 1.2))} /><div className="conclusion-answer"><span>Kết luận của nhóm</span><p>{submission.payload.conclusion ?? "Bài nộp cũ chưa có kết luận."}</p></div></div>
              </div>
            </details>
          </article>
        );
      })}
    </div>
  );
}

const factorLabels: Array<{ key: ResistanceFactor; label: string }> = [
  { key: "material", label: "Ảnh hưởng của chất liệu" },
  { key: "length", label: "Ảnh hưởng của chiều dài" },
  { key: "area", label: "Ảnh hưởng của tiết diện" },
];

export function ResistanceFactorsResults({ submissions }: { submissions: ExperimentSubmission<ResistanceFactorsPayload>[] }) {
  if (!submissions.length) return <EmptyResults />;
  return (
    <div className="submission-list">
      {submissions.map((submission, index) => (
        <article className="submission-card" key={submission.id}>
          <div className="submission-summary factor-summary">
            <div><span>Lớp</span><strong>{submission.className}</strong></div>
            <div><span>Nhóm</span><strong>{submission.groupName}</strong></div>
            {factorLabels.map((factor) => <div key={factor.key}><span>{factor.label.replace("Ảnh hưởng của ", "")}</span><strong>{submission.payload.investigations[factor.key].length} mẫu</strong></div>)}
            <time dateTime={submission.createdAt}>{formatDate(submission.createdAt)}</time>
          </div>
          <details className="factor-result-details" open={index === 0}>
            <summary>Xem kết quả</summary>
            <div className="teacher-investigations">
              {factorLabels.map((factor) => {
                const points = submission.payload.investigations[factor.key];
                return (
                  <section key={factor.key} className="teacher-investigation">
                    <h3>{factor.label}</h3>
                    <div className="table-scroll"><table className="factor-data-table"><thead><tr><th>Mẫu</th><th>Chất liệu</th><th>l (m)</th><th>S (mm²)</th><th>U (V)</th><th>I (A)</th><th>R (Ω)</th></tr></thead><tbody>{points.map((item) => <tr key={item.sequence}><th scope="row">{item.sequence}</th><td>{item.material}</td><td>{item.length}</td><td>{item.area}</td><td>{item.voltage ?? "—"}</td><td>{item.current ?? "—"}</td><td>{item.resistance}</td></tr>)}</tbody></table></div>
                    <div className="single-chart">
                      {factor.key === "material" ? <MaterialBarChart points={points} /> : <RelationshipChart title={factor.label} xLabel={factor.key === "length" ? "Chiều dài l (m)" : "Tiết diện S (mm²)"} yLabel="Điện trở R (Ω)" points={points} xValue={(point) => factor.key === "length" ? point.length : point.area} yValue={(point) => point.resistance} xCeiling={Math.max(1, ...points.map((point) => (factor.key === "length" ? point.length : point.area) * 1.2))} yCeiling={Math.max(10, ...points.map((point) => point.resistance * 1.2))} />}
                      <div className="conclusion-answer"><span>Kết luận của nhóm</span><p>{submission.payload.conclusions?.[factor.key] ?? "Bài nộp cũ chưa có kết luận."}</p></div>
                    </div>
                  </section>
                );
              })}
            </div>
          </details>
        </article>
      ))}
    </div>
  );
}
