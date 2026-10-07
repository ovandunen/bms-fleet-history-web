export type Vehicle = {
  vin: string;
  fleet: string | null;
};

export type Failure = "unauthorized" | "unavailable";

type Failed = {
  ok: false;
  failure: Failure;
};

export type LoginSuccess = {
  ok: true;
  token: string;
  role: string;
};

export type MeSuccess = {
  ok: true;
  username: string;
  role: string;
};

export type VehiclesSuccess = {
  ok: true;
  vehicles: Vehicle[];
};

export interface FleetApi {
  login(username: string, password: string): Promise<LoginSuccess | Failed>;
  me(token: string): Promise<MeSuccess | Failed>;
  vehicles(token: string): Promise<VehiclesSuccess | Failed>;
}

function failed(failure: Failure): Failed {
  return { ok: false, failure };
}

function isFailure(value: unknown): value is Failure {
  return value === "unauthorized" || value === "unavailable";
}

function bearer(token: string): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function request(url: string, init: RequestInit): Promise<unknown | Failure> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    return "unavailable";
  }
  if (response.status === 401) {
    return "unauthorized";
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

function stringField(body: unknown, key: string): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function parseVehicle(value: unknown): Vehicle | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.vin !== "string") {
    return null;
  }
  if (record.fleet === null) {
    return { vin: record.vin, fleet: null };
  }
  if (typeof record.fleet === "string") {
    return { vin: record.vin, fleet: record.fleet };
  }
  return null;
}

export function createHttpApi(): FleetApi {
  return {
    async login(username, password) {
      const body = await request("/api/v1/auth/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (isFailure(body)) {
        return failed(body);
      }
      const token = stringField(body, "token");
      const role = stringField(body, "role");
      if (token === null || role === null) {
        return failed("unavailable");
      }
      return { ok: true, token, role };
    },
    async me(token) {
      const body = await request("/api/v1/me", { headers: bearer(token) });
      if (isFailure(body)) {
        return failed(body);
      }
      const username = stringField(body, "username");
      const role = stringField(body, "role");
      if (username === null || role === null) {
        return failed("unavailable");
      }
      return { ok: true, username, role };
    },
    async vehicles(token) {
      const body = await request("/api/v1/vehicles", { headers: bearer(token) });
      if (isFailure(body)) {
        return failed(body);
      }
      if (!Array.isArray(body)) {
        return failed("unavailable");
      }
      const vehicles: Vehicle[] = [];
      for (const item of body) {
        const vehicle = parseVehicle(item);
        if (vehicle === null) {
          return failed("unavailable");
        }
        vehicles.push(vehicle);
      }
      return { ok: true, vehicles };
    },
  };
}
