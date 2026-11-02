import { Icon } from "./icons";

export function KpiGrid(props: { speed: string; soc: string; socFoot: string; distanceFoot: string }) {
  return (
    <div className="kpi-grid">
      <article className="kpi-card">
        <div className="kpi-label">
          <span className="kpi-icon blue">
            <Icon name="map" size={17} />
          </span>
          Gefahrene Strecke
        </div>
        <div className="kpi-value">—</div>
        <div className="kpi-foot">
          <span>{props.distanceFoot}</span>
          <span className="kpi-foot-tag">
            <Icon name="activity" size={13} /> Fahrdaten
          </span>
        </div>
      </article>
      <article className="kpi-card">
        <div className="kpi-label">
          <span className="kpi-icon purple">
            <Icon name="gauge" size={17} />
          </span>
          Ø Geschwindigkeit
        </div>
        <div className="kpi-value">
          {props.speed}
          {props.speed === "—" ? null : <small>km/h</small>}
        </div>
        <div className="kpi-foot">
          <span>{"Nur während der Fahrt (> 1 km/h)"}</span>
          <span className="kpi-foot-tag">Ø</span>
        </div>
      </article>
      <article className="kpi-card">
        <div className="kpi-label">
          <span className="kpi-icon green">
            <Icon name="bolt" size={17} />
          </span>
          Batterieladestand
        </div>
        <div className="kpi-value">
          {props.soc}
          {props.soc === "—" ? null : <small>%</small>}
        </div>
        <div className="kpi-foot">
          <span>{props.socFoot}</span>
        </div>
      </article>
      <article className="kpi-card">
        <div className="kpi-label">
          <span className="kpi-icon amber">
            <Icon name="leaf" size={17} />
          </span>
          CO₂-Reduktion
        </div>
        <div className="kpi-value">—</div>
        <div className="kpi-foot">
          <span>Keine Referenz hinterlegt</span>
          <span className="kpi-foot-tag">CO₂</span>
        </div>
      </article>
    </div>
  );
}
