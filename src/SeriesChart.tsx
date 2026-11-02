import type { PlotPoint } from "./daySeries";

export function SeriesChart(props: { points: PlotPoint[]; kind: "soc" | "speed" }) {
  if (props.points.length === 0) {
    return null;
  }
  const color = props.kind === "soc" ? "#318d72" : "#497da5";
  const label =
    props.kind === "soc"
      ? "Batterieladestand-Verlauf in Prozent"
      : "Geschwindigkeitsverlauf in Kilometern pro Stunde";
  let max = props.kind === "soc" ? 100 : 1;
  if (props.kind === "speed") {
    for (const point of props.points) {
      if (point.value > max) {
        max = point.value;
      }
    }
  }
  const count = props.points.length;
  let line = "";
  const dots: { x: number; y: number; key: number }[] = [];
  const ticks: { x: number; text: string; key: string }[] = [];
  const step = Math.max(1, Math.ceil(count / 7));
  for (let index = 0; index < count; index += 1) {
    const point = props.points[index];
    const x = count === 1 ? 325 : 40 + (index * 570) / (count - 1);
    const y = 176 - (point.value / max) * 135;
    line = line === "" ? `${x},${y}` : `${line} ${x},${y}`;
    if (count <= 40) {
      dots.push({ x, y, key: index });
    }
    if (index % step === 0 || index === count - 1) {
      ticks.push({ x, text: point.label, key: `${index}` });
    }
  }
  const grid: { y: number; text: string; key: number }[] = [];
  for (let index = 0; index < 4; index += 1) {
    const y = 40 + index * (136 / 3);
    const value = max * (1 - (y - 40) / 135);
    grid.push({ y, text: String(Math.round(value)), key: index });
  }
  return (
    <svg className="series-chart" viewBox="0 0 650 218" role="img" aria-label={label}>
      {grid.map((item) => (
        <g key={item.key}>
          <line x1="40" x2="610" y1={item.y} y2={item.y} stroke="#e9eeea" strokeDasharray="3 5" />
          <text x="6" y={item.y + 4} fill="#83908a" fontSize="9">
            {item.text}
          </text>
        </g>
      ))}
      <polyline points={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {dots.map((dot) => (
        <circle key={dot.key} cx={dot.x} cy={dot.y} r="4" fill="white" stroke={color} strokeWidth="2" />
      ))}
      {ticks.map((tick) => (
        <text key={tick.key} x={tick.x} y="204" textAnchor="middle" fill="#82908a" fontSize="9">
          {tick.text}
        </text>
      ))}
    </svg>
  );
}
