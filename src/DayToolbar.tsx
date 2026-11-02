import type { VehicleDay } from "./historyApi";
import { Icon } from "./icons";

export function DayToolbar(props: {
  days: VehicleDay[];
  day: string | null;
  onSelect: (day: string) => void;
}) {
  return (
    <div className="period-toolbar">
      <div className="period-tabs" role="tablist" aria-label="Zeitraum auswählen">
        <button type="button" role="tab" className="period-tab active" aria-selected={true}>
          Tag
        </button>
        <button type="button" role="tab" className="period-tab" aria-selected={false} disabled>
          Woche
        </button>
        <button type="button" role="tab" className="period-tab" aria-selected={false} disabled>
          Monat
        </button>
      </div>
      <div className="date-label">
        <Icon name="calendar" size={16} />
        <span>Datum</span>
        <select aria-label="Tag wählen" value={props.day ?? ""} onChange={(event) => props.onSelect(event.target.value)}>
          {props.days.map((item) => (
            <option key={item.day} value={item.day}>
              {item.day}
            </option>
          ))}
        </select>
        <small>UTC</small>
      </div>
    </div>
  );
}
