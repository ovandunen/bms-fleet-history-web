import type { TrackPoint } from "./historyApi";
import { formatPointValue, POINT_FIELDS } from "./pointText";

export function PointReadout(props: { point: TrackPoint }) {
  return (
    <article className="panel point-panel">
      <dl className="point-readout">
        {POINT_FIELDS.map((field) => (
          <div key={field.key}>
            <dt>{field.label}</dt>
            <dd>{formatPointValue(props.point[field.key])}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
