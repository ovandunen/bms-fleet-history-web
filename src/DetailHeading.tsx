import { Icon } from "./icons";

export function DetailHeading(props: { vin: string }) {
  return (
    <div className="detail-heading">
      <div className="detail-vehicle-mark">
        <Icon name="bolt" size={22} />
      </div>
      <div>
        <div className="detail-plate">{props.vin}</div>
        <h1>Fahrzeug {props.vin}</h1>
        <p>Fahrzeug-ID {props.vin}</p>
      </div>
    </div>
  );
}
