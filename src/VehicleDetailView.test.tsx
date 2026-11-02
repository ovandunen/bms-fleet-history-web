import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { historyWith, loginAndOpen, trackOf } from "./detailFixtures";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

it("openVehicle_loadsNewestDayTrack", async () => {
  const calls: string[] = [];
  await loginAndOpen(
    historyWith(
      async (token, vin, day) => {
        void token;
        calls.push(`${vin} ${day}`);
        return { ok: true, track: trackOf(day, 9) };
      },
      async (token, vin) => {
        calls.push(`days ${token} ${vin}`);
        return {
          ok: true,
          days: [
            { day: "2026-10-09", pointCount: 2 },
            { day: "2026-10-01", pointCount: 1 },
          ],
        };
      },
    ),
  );
  expect(await screen.findByRole("heading", { name: "Fahrzeug VIN-1" })).toBeInTheDocument();
  expect(screen.getByLabelText("Tag wählen")).toHaveValue("2026-10-09");
  expect(await screen.findByText("Spur:9")).toBeInTheDocument();
  expect(calls).toEqual(["days memory-token VIN-1", "VIN-1 2026-10-09"]);
});

it("selectDay_loadsThatTrack", async () => {
  await loginAndOpen(
    historyWith(async (token, vin, day) => {
      void token;
      void vin;
      return { ok: true, track: trackOf(day, day.endsWith("09") ? 9 : 1) };
    }),
  );
  expect(await screen.findByText("Spur:9")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Tag wählen"), { target: { value: "2026-10-01" } });
  expect(await screen.findByText("Spur:1")).toBeInTheDocument();
  expect(screen.getByLabelText("Tag wählen")).toHaveValue("2026-10-01");
});

it("pointClick_showsSixteenLabelsAndDashForNull", async () => {
  await loginAndOpen(
    historyWith(async (token, vin, day) => {
      void token;
      void vin;
      return { ok: true, track: trackOf(day, 9) };
    }),
  );
  fireEvent.click(await screen.findByRole("button", { name: "Punkt 0" }));
  for (const label of [
    "Zeit (UTC)",
    "Höhe (m)",
    "Batterie-ID",
    "Geschwindigkeit (km/h)",
    "GPS-Strecke (km)",
    "Kilometerstand (km)",
    "Ladezustand (%)",
    "Packspannung (V)",
    "Packstrom (A)",
    "Verbrauch (kWh/100 km)",
    "Außentemperatur (°C)",
    "Luftfeuchtigkeit (%)",
    "Feinstaub PM2.5",
    "Feinstaub PM10",
    "GPS-Fixqualität",
    "Satelliten",
  ]) {
    expect(screen.getByText(label)).toBeInTheDocument();
  }
  expect(screen.getByText("2026-10-05T12:00:00Z")).toBeInTheDocument();
  expect(screen.getByText("BAT-1")).toBeInTheDocument();
  expect(screen.getByText("12.5")).toBeInTheDocument();
  expect(screen.getByText("7")).toBeInTheDocument();
  expect(screen.getAllByText("–").length).toBeGreaterThan(0);
});

it("notFound_showsMessageAndBackReturnsToList", async () => {
  await loginAndOpen(
    historyWith(
      async (token, vin, day) => {
        void token;
        void vin;
        return { ok: true, track: trackOf(day, 9) };
      },
      async () => ({ ok: false, failure: "notFound" }),
    ),
  );
  expect(await screen.findByText("Fahrzeug oder Tag nicht gefunden.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Zurück zur Fahrzeugliste" }));
  expect(screen.getByRole("button", { name: "VIN-1" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Fahrzeug VIN-1" })).not.toBeInTheDocument();
});

it("unauthorized_returnsToLoginAndDropsToken", async () => {
  await loginAndOpen(
    historyWith(
      async (token, vin, day) => {
        void token;
        void vin;
        return { ok: true, track: trackOf(day, 9) };
      },
      async () => ({ ok: false, failure: "unauthorized" }),
    ),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("Bitte erneut anmelden.");
  expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  expect(document.cookie).toBe("");
});

it("unavailable_showsServiceMessageAndKeepsSession", async () => {
  await loginAndOpen(
    historyWith(
      async (token, vin, day) => {
        void token;
        void vin;
        return { ok: true, track: trackOf(day, 9) };
      },
      async () => ({ ok: false, failure: "unavailable" }),
    ),
  );
  expect(await screen.findByText("Der Dienst ist nicht erreichbar.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Zurück zur Fahrzeugliste" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Anmelden" })).not.toBeInTheDocument();
});

it("back_returnsToVehicleList", async () => {
  await loginAndOpen(
    historyWith(async (token, vin, day) => {
      void token;
      void vin;
      return { ok: true, track: trackOf(day, 9) };
    }),
  );
  expect(await screen.findByRole("heading", { name: "Fahrzeug VIN-1" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Zurück zur Fahrzeugliste" }));
  expect(screen.getByText("fleet-a")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Abmelden" })).toBeInTheDocument();
});

it("emptyDays_showsNoDaysMessage", async () => {
  await loginAndOpen(
    historyWith(
      async (token, vin, day) => {
        void token;
        void vin;
        return { ok: true, track: trackOf(day, 9) };
      },
      async () => ({ ok: true, days: [] }),
    ),
  );
  expect(await screen.findByText("Keine Tagesdaten vorhanden.")).toBeInTheDocument();
  expect(screen.queryByLabelText("Tag wählen")).not.toBeInTheDocument();
});

it("downsampleNote_onlyWhenTotalExceedsReturned", async () => {
  await loginAndOpen(
    historyWith(async (token, vin, day) => {
      void token;
      void vin;
      return { ok: true, track: trackOf(day, 9, 4, 2) };
    }),
  );
  expect(await screen.findByText("Angezeigt: 2 von 4 Punkten")).toBeInTheDocument();
  cleanup();
  await loginAndOpen(
    historyWith(async (token, vin, day) => {
      void token;
      void vin;
      return { ok: true, track: trackOf(day, 9, 2, 2) };
    }),
  );
  expect(await screen.findByText("Spur:9")).toBeInTheDocument();
  expect(screen.queryByText(/Angezeigt:/)).not.toBeInTheDocument();
});
