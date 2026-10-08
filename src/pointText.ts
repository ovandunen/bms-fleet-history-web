import type { TrackPoint } from "./historyApi";

export const POINT_FIELDS: { key: keyof TrackPoint; label: string }[] = [
  { key: "time", label: "Zeit (UTC)" },
  { key: "altitude_m", label: "Höhe (m)" },
  { key: "battery_id", label: "Batterie-ID" },
  { key: "speed_kmh", label: "Geschwindigkeit (km/h)" },
  { key: "gps_distance_km", label: "GPS-Strecke (km)" },
  { key: "odometer_km", label: "Kilometerstand (km)" },
  { key: "soc_percent", label: "Ladezustand (%)" },
  { key: "pack_voltage_v", label: "Packspannung (V)" },
  { key: "pack_current_a", label: "Packstrom (A)" },
  { key: "consumption_kwh_per_100km", label: "Verbrauch (kWh/100 km)" },
  { key: "outside_temp_c", label: "Außentemperatur (°C)" },
  { key: "humidity_percent", label: "Luftfeuchtigkeit (%)" },
  { key: "pm25", label: "Feinstaub PM2.5" },
  { key: "pm10", label: "Feinstaub PM10" },
  { key: "fix_quality", label: "GPS-Fixqualität" },
  { key: "satellites", label: "Satelliten" },
];

export function formatPointValue(value: string | number | null): string {
  if (value === null) {
    return "–";
  }
  return String(value);
}

export function downsampleNote(totalPoints: number, returnedPoints: number): string | null {
  if (totalPoints > returnedPoints) {
    return `Angezeigt: ${returnedPoints} von ${totalPoints} Punkten`;
  }
  return null;
}
