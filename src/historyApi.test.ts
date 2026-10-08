import { afterEach, expect, it, vi } from "vitest";
import { createHttpApi } from "./api";

const TOKEN = "memory-token";
const VIN = "VIN/1 ä";
const DAY = "2026-10-05";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const featureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [13.4, 52.5] },
      properties: {
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
      },
    },
  ],
  meta: { day: DAY, totalPoints: 3, returnedPoints: 1 },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

it("daysAndTrack_sendEncodedUrlBearerAndAcceptWithoutMaxPoints", async () => {
  const seen: { url: string; authorization: string | null; accept: string | null }[] = [];
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const url = String(input);
    seen.push({ url, authorization: headers.get("Authorization"), accept: headers.get("Accept") });
    if (url.includes("/track")) {
      return Promise.resolve(json(200, featureCollection));
    }
    return Promise.resolve(json(200, [{ day: DAY, pointCount: 1 }]));
  });
  const api = createHttpApi();
  const days = await api.days(TOKEN, VIN);
  const track = await api.track(TOKEN, VIN, DAY);
  expect(seen[0]).toEqual({
    url: `/api/v1/vehicles/${encodeURIComponent(VIN)}/days`,
    authorization: `Bearer ${TOKEN}`,
    accept: "application/json",
  });
  expect(seen[1]).toEqual({
    url: `/api/v1/vehicles/${encodeURIComponent(VIN)}/days/${encodeURIComponent(DAY)}/track`,
    authorization: `Bearer ${TOKEN}`,
    accept: "application/geo+json",
  });
  expect(seen[0].url.includes("maxPoints")).toBe(false);
  expect(seen[1].url.includes("maxPoints")).toBe(false);
  expect(days).toEqual({ ok: true, days: [{ day: DAY, pointCount: 1 }] });
  expect(track).toEqual({
    ok: true,
    track: {
      points: [
        {
          longitude: 13.4,
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
        },
      ],
      meta: { day: DAY, totalPoints: 3, returnedPoints: 1 },
    },
  });
});

it("history_whenUnauthorizedNotFoundOrServerError_mapsStatus", async () => {
  const api = createHttpApi();
  vi.stubGlobal("fetch", () => Promise.resolve(json(401, {})));
  expect(await api.days(TOKEN, VIN)).toEqual({ ok: false, failure: "unauthorized" });
  vi.stubGlobal("fetch", () => Promise.resolve(json(404, { message: "Not found" })));
  expect(await api.track(TOKEN, VIN, DAY)).toEqual({ ok: false, failure: "notFound" });
  vi.stubGlobal("fetch", () => Promise.resolve(new Response("down", { status: 500 })));
  expect(await api.days(TOKEN, VIN)).toEqual({ ok: false, failure: "unavailable" });
  vi.stubGlobal("fetch", () => Promise.reject(new TypeError("network")));
  expect(await api.track(TOKEN, VIN, DAY)).toEqual({ ok: false, failure: "unavailable" });
});
