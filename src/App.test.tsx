import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { FleetApi } from "./api";
import { createHttpApi } from "./api";
import { App } from "./App";

const TOKEN = "memory-token";

function successApi(overrides: Partial<FleetApi> = {}): FleetApi {
  return {
    login: overrides.login ?? (async () => ({ ok: true, token: TOKEN, role: "ADMIN" })),
    me: overrides.me ?? (async () => ({ ok: true, username: "Ada", role: "ADMIN" })),
    vehicles:
      overrides.vehicles ??
      (async () => ({ ok: true, vehicles: [{ vin: "VIN-1", fleet: "fleet-a" }] })),
  };
}

function expectNoStoredToken(): void {
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  expect(document.cookie).toBe("");
}

async function submitLogin(): Promise<void> {
  fireEvent.change(screen.getByLabelText("Benutzername"), { target: { value: "Ada" } });
  fireEvent.change(screen.getByLabelText("Passwort"), { target: { value: "entered" } });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

it("login_whenAccepted_showsNameRoleAndVehicles", async () => {
  render(<App api={successApi()} />);
  await submitLogin();
  expect(await screen.findByText("Ada")).toBeInTheDocument();
  expect(screen.getByText("ADMIN")).toBeInTheDocument();
  expect(screen.getByText("VIN-1")).toBeInTheDocument();
  expect(screen.getByText("fleet-a")).toBeInTheDocument();
});

it("login_whenUnauthorized_showsGermanErrorAndKeepsNoToken", async () => {
  render(
    <App
      api={successApi({
        async login() {
          return { ok: false, failure: "unauthorized" };
        },
      })}
    />,
  );
  await submitLogin();
  expect(await screen.findByRole("alert")).toHaveTextContent("Anmeldung fehlgeschlagen.");
  expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
  expect(screen.queryByText("VIN-1")).not.toBeInTheDocument();
  expectNoStoredToken();
});

it("vehicles_whenUnauthorized_returnsToLoginAndClearsToken", async () => {
  const seen: string[] = [];
  render(
    <App
      api={successApi({
        async vehicles(token) {
          seen.push(token);
          return { ok: false, failure: "unauthorized" };
        },
      })}
    />,
  );
  await submitLogin();
  expect(await screen.findByRole("alert")).toHaveTextContent("Bitte erneut anmelden.");
  expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Abmelden" })).not.toBeInTheDocument();
  expect(seen).toEqual([TOKEN]);
  expectNoStoredToken();
});

it("vehicles_whenFleetIsNull_showsUnassigned", async () => {
  render(
    <App
      api={successApi({
        async vehicles() {
          return { ok: true, vehicles: [{ vin: "VIN-1", fleet: null }] };
        },
      })}
    />,
  );
  await submitLogin();
  expect(await screen.findByText("nicht zugeordnet")).toBeInTheDocument();
  expect(screen.getByText("VIN-1")).toBeInTheDocument();
});

it("vehicles_whenEmpty_showsNoVehicles", async () => {
  render(
    <App
      api={successApi({
        async vehicles() {
          return { ok: true, vehicles: [] };
        },
      })}
    />,
  );
  await submitLogin();
  expect(await screen.findByText("Keine Fahrzeuge")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});

it("logout_clearsTokenAndShowsLogin", async () => {
  render(<App api={successApi()} />);
  await submitLogin();
  fireEvent.click(await screen.findByRole("button", { name: "Abmelden" }));
  expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
  expect(screen.queryByText("VIN-1")).not.toBeInTheDocument();
  expectNoStoredToken();
});

it("session_afterLoginAndLogout_storesNoToken", async () => {
  render(<App api={successApi()} />);
  await submitLogin();
  await screen.findByRole("button", { name: "Abmelden" });
  expectNoStoredToken();
  fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));
  expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
  expectNoStoredToken();
});

it("login_whenFetchFails_showsServiceMessageAndKeepsNoToken", async () => {
  vi.stubGlobal("fetch", () => Promise.reject(new TypeError("network")));
  render(<App api={createHttpApi()} />);
  await submitLogin();
  expect(await screen.findByRole("alert")).toHaveTextContent("Der Dienst ist nicht erreichbar.");
  expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Abmelden" })).not.toBeInTheDocument();
  expectNoStoredToken();
});

it("me_whenUnavailable_showsServiceMessageAndKeepsNoToken", async () => {
  let vehiclesCalled = false;
  render(
    <App
      api={successApi({
        async me() {
          return { ok: false, failure: "unavailable" };
        },
        async vehicles() {
          vehiclesCalled = true;
          return { ok: true, vehicles: [] };
        },
      })}
    />,
  );
  await submitLogin();
  expect(await screen.findByRole("alert")).toHaveTextContent("Der Dienst ist nicht erreichbar.");
  expect(vehiclesCalled).toBe(false);
  expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
  expectNoStoredToken();
});

it("vehicles_whenUnavailable_showsServiceMessageAndKeepsNoToken", async () => {
  const seen: string[] = [];
  render(
    <App
      api={successApi({
        async vehicles(token) {
          seen.push(token);
          return { ok: false, failure: "unavailable" };
        },
      })}
    />,
  );
  await submitLogin();
  expect(await screen.findByRole("alert")).toHaveTextContent("Der Dienst ist nicht erreichbar.");
  expect(seen).toEqual([TOKEN]);
  expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
  expectNoStoredToken();
});
