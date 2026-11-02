import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createHttpApi } from "./api";
import { App } from "./App";
import { FakeMap, TOKEN, historyWith, loginAndOpen, trackOf } from "./detailFixtures";
import type { Track } from "./historyApi";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

it("lateTrack_doesNotReplaceNewerDay", async () => {
  let release: (value: { ok: true; track: Track }) => void = () => {};
  const held = new Promise<{ ok: true; track: Track }>((resolve) => {
    release = resolve;
  });
  await loginAndOpen(
    historyWith(async (token, vin, day) => {
      if (day === "2026-10-09") {
        return held;
      }
      void token;
      void vin;
      return { ok: true, track: trackOf(day, 1) };
    }),
  );
  expect(await screen.findByLabelText("Tag wählen")).toHaveValue("2026-10-09");
  fireEvent.change(screen.getByLabelText("Tag wählen"), { target: { value: "2026-10-01" } });
  expect(await screen.findByText("Spur:1")).toBeInTheDocument();
  await act(async () => {
    release({ ok: true, track: trackOf("2026-10-09", 9) });
  });
  expect(screen.getByText("Spur:1")).toBeInTheDocument();
  expect(screen.queryByText("Spur:9")).not.toBeInTheDocument();
});

it("lateUnauthorized_afterBack_doesNotLeaveTheList", async () => {
  let release: (value: { ok: false; failure: "unauthorized" }) => void = () => {};
  const held = new Promise<{ ok: false; failure: "unauthorized" }>((resolve) => {
    release = resolve;
  });
  await loginAndOpen(
    historyWith(
      async (token, vin, day) => {
        void token;
        void vin;
        return { ok: true, track: trackOf(day, 9) };
      },
      () => held,
    ),
  );
  expect(await screen.findByRole("heading", { name: "Fahrzeug VIN-1" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Zurück zur Fahrzeugliste" }));
  await act(async () => {
    release({ ok: false, failure: "unauthorized" });
  });
  expect(screen.getByRole("button", { name: "Abmelden" })).toBeInTheDocument();
  expect(screen.queryByText("Bitte erneut anmelden.")).not.toBeInTheDocument();
});

it("session_afterOpenAndBack_storesNoToken", async () => {
  await loginAndOpen(
    historyWith(async (token, vin, day) => {
      void token;
      void vin;
      return { ok: true, track: trackOf(day, 9) };
    }),
  );
  expect(await screen.findByRole("heading", { name: "Fahrzeug VIN-1" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Zurück zur Fahrzeugliste" }));
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  expect(document.cookie).toBe("");
});

it("serverErrorAndNetworkError_showServiceMessage", async () => {
  function routes(status: number | "network") {
    vi.stubGlobal("fetch", (input: RequestInfo | URL) => {
      const url = String(input);
      if (status === "network" && url.endsWith("/days")) {
        return Promise.reject(new TypeError("network"));
      }
      if (url.endsWith("/days")) {
        return Promise.resolve(new Response("down", { status: 500 }));
      }
      if (url.endsWith("/auth/login")) {
        return Promise.resolve(Response.json({ token: TOKEN, role: "ADMIN" }));
      }
      if (url.endsWith("/me")) {
        return Promise.resolve(Response.json({ username: "Ada", role: "ADMIN" }));
      }
      return Promise.resolve(Response.json([{ vin: "VIN-1", fleet: "fleet-a" }]));
    });
    return createHttpApi();
  }

  const failed = routes(500);
  render(<App api={failed} history={failed} map={FakeMap} />);
  fireEvent.change(screen.getByLabelText("Benutzername"), { target: { value: "Ada" } });
  fireEvent.change(screen.getByLabelText("Passwort"), { target: { value: "entered" } });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));
  fireEvent.click(await screen.findByRole("button", { name: "VIN-1" }));
  expect(await screen.findByText("Der Dienst ist nicht erreichbar.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Zurück zur Fahrzeugliste" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Anmelden" })).not.toBeInTheDocument();
  cleanup();

  const offline = routes("network");
  render(<App api={offline} history={offline} map={FakeMap} />);
  fireEvent.change(screen.getByLabelText("Benutzername"), { target: { value: "Ada" } });
  fireEvent.change(screen.getByLabelText("Passwort"), { target: { value: "entered" } });
  fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));
  fireEvent.click(await screen.findByRole("button", { name: "VIN-1" }));
  expect(await screen.findByText("Der Dienst ist nicht erreichbar.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Zurück zur Fahrzeugliste" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Anmelden" })).not.toBeInTheDocument();
});
