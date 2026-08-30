import type { ResistanceFactorMeasurement } from "@/lib/experiments";

export default function MaterialBarChart({ points }: { points: ResistanceFactorMeasurement[] }) {
  const maximum = Math.max(1, ...points.map((point) => point.resistance));
  const description = points.length
    ? points.map((point) => `${point.material}: ${point.resistance} ôm`).join("; ")
    : "Chưa có số liệu.";

  return (
    <section className="chart-panel" aria-label="So sánh điện trở theo chất liệu">
      <h3>Điện trở theo chất liệu dây</h3>
      <div className="bar-chart" role="img" aria-label={description}>
        {points.length ? points.map((point) => (
          <div className="bar-row" key={point.sequence}>
            <span>{point.material}</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(2, point.resistance / maximum * 100)}%` }} /></div>
            <strong>{point.resistance} Ω</strong>
          </div>
        )) : <p className="empty-bars">Chưa có số liệu</p>}
      </div>
    </section>
  );
}
