import { useState } from "react";
import type { Vehicle } from "./api";
import { Icon } from "./icons";

export function VehicleListView(props: {
  username: string;
  vehicles: Vehicle[];
  onOpen?: (vin: string) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.toLowerCase();
  const shown = props.vehicles.filter((vehicle) => {
    const fleet = vehicle.fleet === null ? "Nicht zugeordnet" : vehicle.fleet;
    return `${vehicle.vin} ${fleet}`.toLowerCase().includes(needle);
  });

  return (
    <section className="fleet-content" id="fleet">
      <div className="page-heading">
        <div>
          <div className="page-kicker">FLOTTENÜBERSICHT</div>
          <h1>
            Guten Morgen, {props.username} <span>↗</span>
          </h1>
          <p>Hier ist der aktuelle Überblick Ihrer Elektroflotte.</p>
        </div>
      </div>
      <div className="overview-strip">
        <div>
          <span className="overview-icon teal">
            <Icon name="bus" size={18} />
          </span>
          <span>
            <b>{props.vehicles.length}</b>
            <small>Fahrzeuge gesamt</small>
          </span>
        </div>
        <div>
          <span className="overview-icon green">
            <Icon name="plug" size={18} />
          </span>
          <span>
            <b>—</b>
            <small>Aktiv unterwegs</small>
          </span>
        </div>
        <div>
          <span className="overview-icon amber">
            <Icon name="bolt" size={18} />
          </span>
          <span>
            <b>—</b>
            <small>Am Laden</small>
          </span>
        </div>
      </div>
      <div className="fleet-section-head">
        <div>
          <h2>Fahrzeuge</h2>
          <span className="result-count">{shown.length} Fahrzeuge angezeigt</span>
        </div>
        <div className="fleet-tools">
          <label className="fleet-search">
            <Icon name="search" size={16} />
            <input
              aria-label="Fahrzeuge suchen"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Fahrzeug suchen…"
            />
          </label>
        </div>
      </div>
      {props.vehicles.length === 0 ? (
        <div className="no-vehicles">
          <b>Keine Fahrzeuge</b>
        </div>
      ) : (
        <div className="table-shell">
          <div className="vehicle-table-head">
            <span>FAHRZEUG</span>
            <span>STATUS</span>
            <span>STANDORT</span>
            <span>BATTERIE</span>
            <span>LETZTES SIGNAL</span>
            <span />
          </div>
          {shown.length === 0 ? (
            <div className="no-vehicles">
              <Icon name="search" size={22} />
              <b>Kein Fahrzeug gefunden</b>
              <span>Ändern Sie Ihren Suchbegriff.</span>
            </div>
          ) : (
            shown.map((vehicle) => {
              const unassigned = vehicle.fleet === null;
              const className = unassigned ? "vehicle-row unassigned-row" : "vehicle-row";
              const body = (
                <>
                  <span className="vehicle-identity">
                    <span className={unassigned ? "vehicle-icon unassigned-icon" : "vehicle-icon car"}>
                      <Icon name={unassigned ? "truck" : "bolt"} size={unassigned ? 19 : 18} />
                    </span>
                    <span>
                      <b>{vehicle.vin}</b>
                      {unassigned ? null : <small>{vehicle.fleet}</small>}
                    </span>
                  </span>
                  <span>
                    {unassigned ? (
                      <i className="status-tag unassigned-tag">
                        <span />
                        Nicht zugeordnet
                      </i>
                    ) : (
                      "—"
                    )}
                  </span>
                  <span className="location-cell">
                    <Icon name="pin" size={14} />—
                  </span>
                  <span className="battery-cell">—</span>
                  <span className="updated-cell">
                    <Icon name="clock" size={14} />—
                  </span>
                  <span className="row-arrow">
                    <Icon name="arrow-right" size={17} />
                  </span>
                </>
              );
              if (props.onOpen === undefined) {
                return (
                  <div className={className} key={vehicle.vin}>
                    {body}
                  </div>
                );
              }
              return (
                <button
                  type="button"
                  className={className}
                  key={vehicle.vin}
                  aria-label={vehicle.vin}
                  onClick={() => props.onOpen?.(vehicle.vin)}
                >
                  {body}
                </button>
              );
            })
          )}
        </div>
      )}
      <div className="list-footer">
        <span>
          <span className="legend-dot green-dot" />
          Unterwegs <span className="legend-dot amber-dot" />
          Lädt <span className="legend-dot gray-dot" />
          Geparkt
        </span>
        <span>Zeitzone: UTC</span>
      </div>
    </section>
  );
}
