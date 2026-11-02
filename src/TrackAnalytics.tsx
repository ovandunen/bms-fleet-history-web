import { germanDay, type PlotPoint } from "./daySeries";
import { Icon } from "./icons";
import { SeriesChart } from "./SeriesChart";
import type { MapPoint, TrackMap } from "./trackMap";

function EmptyPanel(props: { children: string }) {
  return (
    <div className="empty-panel">
      <span className="empty-mark">
        <Icon name="activity" size={20} />
      </span>
      <strong>noch keine Daten</strong>
      <span>{props.children}</span>
    </div>
  );
}

export function TrackAnalytics(props: {
  day: string;
  speeds: PlotPoint[];
  socs: PlotPoint[];
  meanSpeed: string;
  map: TrackMap;
  points: MapPoint[];
  onPointClick: (index: number) => void;
}) {
  const MapView = props.map;
  return (
    <div className="analytics-grid">
      <article className="panel map-panel">
        <div className="panel-header">
          <div>
            <h2>Tagesroute</h2>
            <p>Fahrverlauf am {germanDay(props.day)} (UTC)</p>
          </div>
        </div>
        <div className="map-art">
          <MapView points={props.points} onPointClick={props.onPointClick} />
        </div>
      </article>
      <article className="panel speed-panel">
        <div className="panel-header">
          <div>
            <h2>Geschwindigkeitsverlauf</h2>
            <p>Nur Fahrzeit · Stillstand unter 1 km/h ausgeschlossen</p>
          </div>
          <span className="unit-badge">km/h</span>
        </div>
        {props.speeds.length === 0 ? (
          <EmptyPanel>In diesem Zeitraum wurde keine Fahrt über 1 km/h erfasst.</EmptyPanel>
        ) : (
          <>
            <SeriesChart points={props.speeds} kind="speed" />
            <div className="chart-legend">
              <span>
                <i /> Durchschnitt während der Fahrt
              </span>
              <span>{props.meanSpeed} km/h</span>
            </div>
          </>
        )}
      </article>
      <article className="panel soc-panel">
        <div className="panel-header">
          <div>
            <h2>Ladezustand (SOC)</h2>
            <p>Batteriestand im gewählten Zeitraum</p>
          </div>
          <span className="unit-badge">%</span>
        </div>
        {props.socs.length === 0 ? (
          <EmptyPanel>CAN-Daten werden nach dem Fahrzeugtest angezeigt.</EmptyPanel>
        ) : (
          <SeriesChart points={props.socs} kind="soc" />
        )}
      </article>
      <article className="panel co2-panel">
        <div className="panel-header">
          <div>
            <h2>CO₂-Reduktion</h2>
            <p>Gegenüber dem hinterlegten Referenzfahrzeug</p>
          </div>
          <span className="unit-badge">kg CO₂</span>
        </div>
        <EmptyPanel>Energieverbrauch oder Referenzfahrzeug fehlen.</EmptyPanel>
      </article>
    </div>
  );
}
