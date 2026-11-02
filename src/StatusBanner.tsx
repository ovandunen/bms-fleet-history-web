export function StatusBanner(props: { status: "loading" | "empty" | "missing" | "error" }) {
  if (props.status === "loading") {
    return (
      <div className="state-panel loading-panel status-banner">
        <span className="loading-spinner" />
        <strong>Daten werden geladen</strong>
        <span>Die Fahrzeugdaten werden aktualisiert.</span>
      </div>
    );
  }
  const text =
    props.status === "empty"
      ? "Keine Tagesdaten vorhanden."
      : props.status === "missing"
        ? "Fahrzeug oder Tag nicht gefunden."
        : "Der Dienst ist nicht erreichbar.";
  const kind = props.status === "empty" ? "empty-panel" : "state-panel error-panel";
  return (
    <div className={`${kind} status-banner`}>
      <strong>{text}</strong>
    </div>
  );
}
