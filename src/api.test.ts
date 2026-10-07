import { afterEach, expect, it, vi } from "vitest";
import { createHttpApi } from "./api";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

it("meAndVehicles_sendBearerToken", async () => {
  const seen: string[] = [];
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    seen.push(`${String(input)} ${headers.get("Authorization")}`);
    if (String(input) === "/api/v1/me") {
      return Promise.resolve(json(200, { username: "Ada", role: "USER" }));
    }
    return Promise.resolve(json(200, [{ vin: "VIN-1", fleet: null }]));
  });
  const api = createHttpApi();
  const me = await api.me("memory-token");
  const vehicles = await api.vehicles("memory-token");
  expect(seen).toEqual([
    "/api/v1/me Bearer memory-token",
    "/api/v1/vehicles Bearer memory-token",
  ]);
  expect(me).toEqual({ ok: true, username: "Ada", role: "USER" });
  expect(vehicles).toEqual({ ok: true, vehicles: [{ vin: "VIN-1", fleet: null }] });
});

it("login_whenUnauthorized_returnsUnauthorized", async () => {
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    expect(String(input)).toBe("/api/v1/auth/login");
    expect(init?.method).toBe("POST");
    expect(headers.get("Authorization")).toBeNull();
    expect(init?.body).toBe(JSON.stringify({ username: "Ada", password: "entered" }));
    return Promise.resolve(json(401, { message: "Invalid credentials" }));
  });
  const result = await createHttpApi().login("Ada", "entered");
  expect(result).toEqual({ ok: false, failure: "unauthorized" });
});

it("login_whenServerError_returnsUnavailable", async () => {
  vi.stubGlobal("fetch", () => Promise.resolve(new Response("down", { status: 500 })));
  const result = await createHttpApi().login("Ada", "entered");
  expect(result).toEqual({ ok: false, failure: "unavailable" });
});

it("login_whenFetchRejects_returnsUnavailable", async () => {
  vi.stubGlobal("fetch", () => Promise.reject(new TypeError("network")));
  const result = await createHttpApi().login("Ada", "entered");
  expect(result).toEqual({ ok: false, failure: "unavailable" });
});
