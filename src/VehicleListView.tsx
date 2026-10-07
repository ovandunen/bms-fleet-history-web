import type { Vehicle } from "./api";

export function VehicleListView(props: {
  username: string;
  role: string;
  vehicles: Vehicle[];
  onLogout: () => void;
}) {
  return (
    <section>
      <p>{props.username}</p>
      <p>{props.role}</p>
      <button type="button" onClick={props.onLogout}>
        Abmelden
      </button>
      {props.vehicles.length === 0 ? (
        <p>Keine Fahrzeuge</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>VIN</th>
              <th>Flotte</th>
            </tr>
          </thead>
          <tbody>
            {props.vehicles.map((vehicle) => (
              <tr key={vehicle.vin}>
                <td>{vehicle.vin}</td>
                <td>{vehicle.fleet === null ? "nicht zugeordnet" : vehicle.fleet}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
