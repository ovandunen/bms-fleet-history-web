import { Icon } from "./icons";

function initials(username: string): string {
  const trimmed = username.trim();
  if (trimmed.length === 0) {
    return "–";
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function VoltBrand(props: { onActivate?: () => void }) {
  const mark = (
    <>
      <span className="volt-symbol">
        <Icon name="bolt" size={20} />
      </span>
      <span>
        Flottenhistorie
      </span>
    </>
  );
  if (props.onActivate === undefined) {
    return <div className="volt-brand">{mark}</div>;
  }
  return (
    <button type="button" className="volt-brand" onClick={props.onActivate}>
      {mark}
    </button>
  );
}

export function FleetTopbar(props: {
  username: string;
  role: string;
  onLogout: () => void;
  onFleet: () => void;
}) {
  return (
    <header className="topbar">
      <VoltBrand onActivate={props.onFleet} />
      <nav className="main-nav" aria-label="Hauptnavigation">
        <button type="button" className="nav-link active" onClick={props.onFleet}>
          <Icon name="bus" size={17} /> Fahrzeuge
        </button>
      </nav>
      <div className="topbar-right">
        <span className="server-status">
          <i /> Alle Systeme aktiv
        </span>
        <span className="topbar-separator" />
        <div className="user-chip">
          <span className="user-avatar">{initials(props.username)}</span>
          <span>
            <b>{props.username}</b>
            <small>{props.role}</small>
          </span>
        </div>
        <button type="button" className="logout-button" onClick={props.onLogout}>
          Abmelden <Icon name="arrow-right" size={15} />
        </button>
      </div>
    </header>
  );
}
