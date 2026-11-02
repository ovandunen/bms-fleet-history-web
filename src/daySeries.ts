import type { TrackPoint } from "./historyApi";

export type PlotPoint = {
  label: string;
  value: number;
};

function clock(time: string): string {
  const marker = time.indexOf("T");
  if (marker < 0 || time.length < marker + 6) {
    return "";
  }
  return time.slice(marker + 1, marker + 6);
}

export function movingSpeeds(points: TrackPoint[]): PlotPoint[] {
  const series: PlotPoint[] = [];
  for (const point of points) {
    if (point.speed_kmh !== null && point.speed_kmh > 1) {
      series.push({ label: clock(point.time), value: point.speed_kmh });
    }
  }
  return series;
}

export function socSeries(points: TrackPoint[]): PlotPoint[] {
  const series: PlotPoint[] = [];
  for (const point of points) {
    if (point.soc_percent !== null) {
      series.push({ label: clock(point.time), value: point.soc_percent });
    }
  }
  return series;
}

export function lastSoc(points: TrackPoint[]): number | null {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const value = points[index].soc_percent;
    if (value !== null) {
      return value;
    }
  }
  return null;
}

export function meanMovingSpeed(points: TrackPoint[]): number | null {
  const series = movingSpeeds(points);
  if (series.length === 0) {
    return null;
  }
  let sum = 0;
  for (const item of series) {
    sum += item.value;
  }
  return sum / series.length;
}

export function trackSpan(points: TrackPoint[]): string | null {
  let first = Number.POSITIVE_INFINITY;
  let last = Number.NEGATIVE_INFINITY;
  let count = 0;
  for (const point of points) {
    const time = Date.parse(point.time);
    if (Number.isNaN(time)) {
      continue;
    }
    count += 1;
    if (time < first) {
      first = time;
    }
    if (time > last) {
      last = time;
    }
  }
  if (count < 2) {
    return null;
  }
  const minutes = Math.round((last - first) / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) {
    return `${rest} min`;
  }
  return `${hours} h ${rest} min`;
}

export function formatMetric(value: number | null, digits: number): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }
  const fixed = value.toFixed(digits);
  const negative = fixed.startsWith("-");
  const unsigned = negative ? fixed.slice(1) : fixed;
  const dot = unsigned.indexOf(".");
  const whole = dot === -1 ? unsigned : unsigned.slice(0, dot);
  const fraction = dot === -1 ? "" : unsigned.slice(dot + 1);
  let grouped = "";
  for (let index = 0; index < whole.length; index += 1) {
    if (index > 0 && (whole.length - index) % 3 === 0) {
      grouped += ".";
    }
    grouped += whole.charAt(index);
  }
  const body = fraction === "" ? grouped : `${grouped},${fraction}`;
  return negative ? `-${body}` : body;
}

export function germanDay(day: string): string {
  const parts = day.split("-");
  if (parts.length !== 3 || parts[0].length !== 4) {
    return day;
  }
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}
