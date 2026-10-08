export type VehicleDay = {
  day: string;
  pointCount: number;
};

export type TrackPoint = {
  longitude: number;
  latitude: number;
  time: string;
  altitude_m: number | null;
  battery_id: string | null;
  speed_kmh: number | null;
  gps_distance_km: number | null;
  odometer_km: number | null;
  soc_percent: number | null;
  pack_voltage_v: number | null;
  pack_current_a: number | null;
  consumption_kwh_per_100km: number | null;
  outside_temp_c: number | null;
  humidity_percent: number | null;
  pm25: number | null;
  pm10: number | null;
  fix_quality: number | null;
  satellites: number | null;
};

export type Track = {
  points: TrackPoint[];
  meta: {
    day: string;
    totalPoints: number;
    returnedPoints: number;
  };
};

export type HistoryFailure = "unauthorized" | "unavailable" | "notFound";

export type DaysResult =
  | { ok: true; days: VehicleDay[] }
  | { ok: false; failure: HistoryFailure };

export type TrackResult =
  | { ok: true; track: Track }
  | { ok: false; failure: HistoryFailure };

export interface HistoryApi {
  days(token: string, vin: string): Promise<DaysResult>;
  track(token: string, vin: string, day: string): Promise<TrackResult>;
}

const NUMBER_FIELDS = [
  "altitude_m",
  "speed_kmh",
  "gps_distance_km",
  "odometer_km",
  "soc_percent",
  "pack_voltage_v",
  "pack_current_a",
  "consumption_kwh_per_100km",
  "outside_temp_c",
  "humidity_percent",
  "pm25",
  "pm10",
  "fix_quality",
  "satellites",
] as const;

function isFailure(value: unknown): value is HistoryFailure {
  return value === "unauthorized" || value === "unavailable" || value === "notFound";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function nullableNumber(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return undefined;
}

async function historyRequest(
  url: string,
  token: string,
  accept: string,
): Promise<unknown | HistoryFailure> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: accept,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return "unavailable";
  }
  if (response.status === 401) {
    return "unauthorized";
  }
  if (response.status === 404) {
    return "notFound";
  }
  if (!response.ok) {
    return "unavailable";
  }
  try {
    return await response.json();
  } catch {
    return "unavailable";
  }
}

function parseDays(body: unknown): VehicleDay[] | null {
  if (!Array.isArray(body)) {
    return null;
  }
  const days: VehicleDay[] = [];
  for (const item of body) {
    if (!isRecord(item) || typeof item.day !== "string" || typeof item.pointCount !== "number") {
      return null;
    }
    days.push({ day: item.day, pointCount: item.pointCount });
  }
  return days;
}

function parsePoint(feature: unknown): TrackPoint | null {
  if (!isRecord(feature) || !isRecord(feature.geometry) || feature.geometry.type !== "Point") {
    return null;
  }
  const coordinates = feature.geometry.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }
  const longitude = coordinates[0];
  const latitude = coordinates[1];
  if (typeof longitude !== "number" || typeof latitude !== "number") {
    return null;
  }
  if (!isRecord(feature.properties) || typeof feature.properties.time !== "string") {
    return null;
  }
  const battery = feature.properties.battery_id;
  if (battery !== null && typeof battery !== "string") {
    return null;
  }
  const point: TrackPoint = {
    longitude,
    latitude,
    time: feature.properties.time,
    altitude_m: null,
    battery_id: battery,
    speed_kmh: null,
    gps_distance_km: null,
    odometer_km: null,
    soc_percent: null,
    pack_voltage_v: null,
    pack_current_a: null,
    consumption_kwh_per_100km: null,
    outside_temp_c: null,
    humidity_percent: null,
    pm25: null,
    pm10: null,
    fix_quality: null,
    satellites: null,
  };
  for (const key of NUMBER_FIELDS) {
    const value = nullableNumber(feature.properties[key]);
    if (value === undefined) {
      return null;
    }
    point[key] = value;
  }
  return point;
}

function parseTrack(body: unknown): Track | null {
  if (!isRecord(body) || body.type !== "FeatureCollection" || !Array.isArray(body.features)) {
    return null;
  }
  if (!isRecord(body.meta)) {
    return null;
  }
  const { day, totalPoints, returnedPoints } = body.meta;
  if (typeof day !== "string" || typeof totalPoints !== "number" || typeof returnedPoints !== "number") {
    return null;
  }
  const points: TrackPoint[] = [];
  for (const feature of body.features) {
    const point = parsePoint(feature);
    if (point === null) {
      return null;
    }
    points.push(point);
  }
  return { points, meta: { day, totalPoints, returnedPoints } };
}

export function createHistoryApi(): HistoryApi {
  return {
    async days(token, vin) {
      const body = await historyRequest(
        `/api/v1/vehicles/${encodeURIComponent(vin)}/days`,
        token,
        "application/json",
      );
      if (isFailure(body)) {
        return { ok: false, failure: body };
      }
      const days = parseDays(body);
      if (days === null) {
        return { ok: false, failure: "unavailable" };
      }
      return { ok: true, days };
    },
    async track(token, vin, day) {
      const body = await historyRequest(
        `/api/v1/vehicles/${encodeURIComponent(vin)}/days/${encodeURIComponent(day)}/track`,
        token,
        "application/geo+json",
      );
      if (isFailure(body)) {
        return { ok: false, failure: body };
      }
      const track = parseTrack(body);
      if (track === null) {
        return { ok: false, failure: "unavailable" };
      }
      return { ok: true, track };
    },
  };
}
