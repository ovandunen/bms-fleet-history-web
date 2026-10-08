import { useEffect, useMemo, useRef, useState } from "react";
import type { HistoryApi, Track, VehicleDay } from "./historyApi";
import { downsampleNote, formatPointValue, POINT_FIELDS } from "./pointText";
import type { TrackMap } from "./trackMap";

const LOADING = "Lade Daten…";
const NO_DAYS = "Keine Tagesdaten vorhanden.";
const NOT_FOUND = "Fahrzeug oder Tag nicht gefunden.";
const UNAVAILABLE = "Der Dienst ist nicht erreichbar.";

export function VehicleDetailView(props: {
  vin: string;
  token: string;
  history: HistoryApi;
  map: TrackMap;
  onBack: () => void;
  onUnauthorized: () => void;
}) {
  const [days, setDays] = useState<VehicleDay[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "missing" | "error">("loading");
  const generation = useRef(0);
  const historyRef = useRef(props.history);
  const onUnauthorizedRef = useRef(props.onUnauthorized);
  historyRef.current = props.history;
  onUnauthorizedRef.current = props.onUnauthorized;

  useEffect(() => {
    const id = ++generation.current;
    setDays([]);
    setDay(null);
    setTrack(null);
    setSelected(null);
    setStatus("loading");
    const token = props.token;
    const vin = props.vin;
    historyRef.current.days(token, vin).then((listed) => {
      if (id !== generation.current) {
        return;
      }
      if (!listed.ok) {
        applyFailure(listed.failure, id);
        return;
      }
      if (listed.days.length === 0) {
        setStatus("empty");
        return;
      }
      const newest = listed.days[0].day;
      setDays(listed.days);
      setDay(newest);
      historyRef.current.track(token, vin, newest).then((loaded) => {
        if (id !== generation.current) {
          return;
        }
        applyTrack(loaded, id);
      });
    });
    return () => {
      generation.current += 1;
    };
  }, [props.token, props.vin]);

  function applyFailure(failure: "unauthorized" | "unavailable" | "notFound", id: number) {
    if (id !== generation.current) {
      return;
    }
    setTrack(null);
    setSelected(null);
    if (failure === "unauthorized") {
      onUnauthorizedRef.current();
      return;
    }
    setStatus(failure === "notFound" ? "missing" : "error");
  }

  function applyTrack(
    loaded: Awaited<ReturnType<HistoryApi["track"]>>,
    id: number,
  ) {
    if (id !== generation.current) {
      return;
    }
    if (!loaded.ok) {
      applyFailure(loaded.failure, id);
      return;
    }
    setTrack(loaded.track);
    setSelected(null);
    setStatus("ready");
  }

  function selectDay(next: string) {
    const id = ++generation.current;
    setDay(next);
    setTrack(null);
    setSelected(null);
    setStatus("loading");
    historyRef.current.track(props.token, props.vin, next).then((loaded) => {
      applyTrack(loaded, id);
    });
  }

  const MapView = props.map;
  const mapPoints = useMemo(
    () =>
      (track?.points ?? []).map((point, index) => ({
        longitude: point.longitude,
        latitude: point.latitude,
        selected: index === selected,
      })),
    [track, selected],
  );
  const note = track === null ? null : downsampleNote(track.meta.totalPoints, track.meta.returnedPoints);
  const chosen = selected !== null && track !== null ? track.points[selected] : null;

  return (
    <section>
      <h1>Fahrzeug {props.vin}</h1>
      <button type="button" onClick={props.onBack}>
        Zurück
      </button>
      {status === "loading" ? <p>{LOADING}</p> : null}
      {status === "empty" ? <p>{NO_DAYS}</p> : null}
      {status === "missing" ? <p>{NOT_FOUND}</p> : null}
      {status === "error" ? <p>{UNAVAILABLE}</p> : null}
      {days.length === 0 ? null : (
        <label>
          Tag wählen
          <select value={day ?? ""} onChange={(event) => selectDay(event.target.value)}>
            {days.map((item) => (
              <option key={item.day} value={item.day}>
                {item.day}
              </option>
            ))}
          </select>
        </label>
      )}
      {note === null ? null : <p>{note}</p>}
      {day === null ? null : <MapView points={mapPoints} onPointClick={setSelected} />}
      {chosen === null ? null : (
        <dl>
          {POINT_FIELDS.map((field) => (
            <div key={field.key}>
              <dt>{field.label}</dt>
              <dd>{formatPointValue(chosen[field.key])}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
