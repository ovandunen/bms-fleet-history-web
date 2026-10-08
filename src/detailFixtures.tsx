import { fireEvent, render, screen } from "@testing-library/react";
import type { FleetApi } from "./api";
import { App } from "./App";
import type { HistoryApi, Track, TrackPoint } from "./historyApi";
import type { TrackMapProps } from "./trackMap";

export const TOKEN = "memory-token";

export function point(longitude: number, extra: Partial<TrackPoint> = {}): TrackPoint {
  return {
    longitude,
    latitude: 52.5,
    time: "2026-10-05T12:00:00Z",
    altitude_m: null,
    battery_id: "BAT-1",
    speed_kmh: 12.5,
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
    satellites: 7,
    ...extra,
  };
}

export function trackOf(day: string, longitude: number, total = 1, returned = 1): Track {
  return {
    points: [point(longitude)],
    meta: { day, totalPoints: total, returnedPoints: returned },
  };
}

export function FakeMap(props: TrackMapProps) {
  const mark = props.points.map((item) => item.longitude).join(" ");
  return (
    <div>
      <p>{`Spur:${mark}`}</p>
      {props.points.map((item, index) => (
        <button key={`${item.longitude}-${index}`} type="button" onClick={() => props.onPointClick(index)}>
          {`Punkt ${index}`}
        </button>
      ))}
    </div>
  );
}

export function fleet(): FleetApi {
  return {
    async login() {
      return { ok: true, token: TOKEN, role: "ADMIN" };
    },
    async me() {
      return { ok: true, username: "Ada", role: "ADMIN" };
    },
    async vehicles() {
      return { ok: true, vehicles: [{ vin: "VIN-1", fleet: "fleet-a" }] };
    },
  };
}

export function historyWith(track: HistoryApi["track"], days?: HistoryApi["days"]): HistoryApi {
  return {
    days:
      days ??
      (async () => ({
        ok: true,
        days: [
          { day: "2026-10-09", pointCount: 2 },
          { day: "2026-10-01", pointCount: 1 },
        ],
      })),
    track,
  };
}

export async function loginAndOpen(history: HistoryApi) {
  render(<App api={fleet()} history={history} map={FakeMap} />);
  fireEvent.change(screen.getByLabelText("Benutzername"), { target: { value: "Ada" } });
  fireEvent.change(screen.getByLabelText("Passwort"), { target: { value: "entered" } });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));
  fireEvent.click(await screen.findByRole("button", { name: "VIN-1" }));
}
