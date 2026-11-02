import { useEffect, useMemo, useRef, useState } from "react";
import { DayToolbar } from "./DayToolbar";
import { DetailHeading } from "./DetailHeading";
import { formatMetric, lastSoc, meanMovingSpeed, movingSpeeds, socSeries, trackSpan } from "./daySeries";
import type { HistoryApi, Track, VehicleDay } from "./historyApi";
import { Icon } from "./icons";
import { KpiGrid } from "./KpiGrid";
import { PointReadout } from "./PointReadout";
import { downsampleNote } from "./pointText";
import { StatusBanner } from "./StatusBanner";
import { TrackAnalytics } from "./TrackAnalytics";
import type { TrackMap } from "./trackMap";

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

  function applyTrack(loaded: Awaited<ReturnType<HistoryApi["track"]>>, id: number) {
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

  const mapPoints = useMemo(
    () =>
      (track?.points ?? []).map((point, index) => ({
        longitude: point.longitude,
        latitude: point.latitude,
        selected: index === selected,
      })),
    [track, selected],
  );
  const speeds = track === null ? [] : movingSpeeds(track.points);
  const charges = track === null ? [] : socSeries(track.points);
  const soc = track === null ? null : lastSoc(track.points);
  const mean = track === null ? null : meanMovingSpeed(track.points);
  const span = track === null ? null : trackSpan(track.points);
  const note = track === null ? null : downsampleNote(track.meta.totalPoints, track.meta.returnedPoints);
  const chosen = selected !== null && track !== null ? track.points[selected] : null;
  const speedText = mean === null ? "—" : formatMetric(mean, 1);
  const socText = soc === null ? "—" : formatMetric(soc, Number.isInteger(soc) ? 0 : 1);

  return (
    <section className="detail-content">
      <button type="button" className="back-link" onClick={props.onBack}>
        <Icon name="arrow-left" size={16} /> Zurück zur Fahrzeugliste
      </button>
      <DetailHeading vin={props.vin} />
      {days.length === 0 ? null : <DayToolbar days={days} day={day} onSelect={selectDay} />}
      {note === null ? null : <p className="track-note">{note}</p>}
      {status !== "ready" ? (
        <StatusBanner status={status} />
      ) : track === null || day === null ? null : (
        <>
          <KpiGrid
            speed={speedText}
            soc={socText}
            socFoot={soc === null ? "Noch kein CAN-Test" : "Aktueller SOC"}
            distanceFoot={span === null ? "Heute" : `Heute · ${span}`}
          />
          <TrackAnalytics
            day={day}
            speeds={speeds}
            socs={charges}
            meanSpeed={speedText}
            map={props.map}
            points={mapPoints}
            onPointClick={setSelected}
          />
          {chosen === null || chosen === undefined ? null : <PointReadout point={chosen} />}
        </>
      )}
      <div className="detail-footnote">
        <span>Alle Zeitangaben in UTC</span>
      </div>
    </section>
  );
}
