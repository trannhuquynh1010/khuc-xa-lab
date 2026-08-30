export type ChartPoint = {
  sequence: number;
  incidenceAngle: number;
  refractionAngle: number;
  sinIncidence: number;
  sinRefraction: number;
};

export default function RelationshipChart({
  title,
  xLabel,
  yLabel,
  points,
  xValue,
  yValue,
  ceiling,
}: {
  title: string;
  xLabel: string;
  yLabel: string;
  points: ChartPoint[];
  xValue: (point: ChartPoint) => number;
  yValue: (point: ChartPoint) => number;
  ceiling: number;
}) {
  const width = 520;
  const height = 300;
  const margin = { top: 18, right: 20, bottom: 52, left: 62 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const maxX = points.length ? Math.max(...points.map(xValue)) : ceiling;
  const maxY = points.length ? Math.max(...points.map(yValue)) : ceiling;
  const domainX = Math.min(ceiling, Math.max(ceiling * 0.2, maxX * 1.12));
  const domainY = Math.min(ceiling, Math.max(ceiling * 0.2, maxY * 1.12));
  const x = (value: number) => margin.left + (value / domainX) * innerWidth;
  const y = (value: number) => margin.top + innerHeight - (value / domainY) * innerHeight;
  const ticks = Array.from({ length: 6 }, (_, index) => index / 5);
  const sorted = [...points].sort((a, b) => xValue(a) - xValue(b));
  const line = sorted.map((point) => `${x(xValue(point))},${y(yValue(point))}`).join(" ");
  const format = (value: number) => ceiling === 1
    ? value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
    : value.toFixed(0);

  return (
    <section className="chart-panel" aria-label={title}>
      <h3>{title}</h3>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. Có ${points.length} điểm dữ liệu.`}>
        <rect className="plot-frame" x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} />
        {ticks.map((tick) => {
          const tickY = margin.top + innerHeight - tick * innerHeight;
          return (
            <g key={`y-${tick}`}>
              <line className="grid-line" x1={margin.left} x2={width - margin.right} y1={tickY} y2={tickY} />
              <text className="tick-label" x={margin.left - 10} y={tickY + 4} textAnchor="end">{format(tick * domainY)}</text>
            </g>
          );
        })}
        {ticks.map((tick) => {
          const tickX = margin.left + tick * innerWidth;
          return <text className="tick-label" key={`x-${tick}`} x={tickX} y={height - 30} textAnchor="middle">{format(tick * domainX)}</text>;
        })}
        {sorted.length > 1 && <polyline className="data-line" points={line} />}
        {points.map((point) => (
          <g key={point.sequence}>
            <circle className="data-point" cx={x(xValue(point))} cy={y(yValue(point))} r="5" />
            <text className="point-label" x={x(xValue(point)) + 8} y={y(yValue(point)) - 8}>{point.sequence}</text>
          </g>
        ))}
        {!points.length && <text className="empty-chart" x={margin.left + innerWidth / 2} y={margin.top + innerHeight / 2} textAnchor="middle">Chưa có số liệu</text>}
        <text className="axis-label" x={margin.left + innerWidth / 2} y={height - 5} textAnchor="middle">{xLabel}</text>
        <text className="axis-label" transform={`translate(16 ${margin.top + innerHeight / 2}) rotate(-90)`} textAnchor="middle">{yLabel}</text>
      </svg>
    </section>
  );
}

