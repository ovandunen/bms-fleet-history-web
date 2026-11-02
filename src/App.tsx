import { useState } from "react";
import type { Failure, FleetApi, Vehicle } from "./api";
import "./fleet.css";
import { FleetTopbar } from "./FleetTopbar";
import type { HistoryApi } from "./historyApi";
import { LoginView } from "./LoginView";
import type { TrackMap } from "./trackMap";
import { VehicleDetailView } from "./VehicleDetailView";
import { VehicleListView } from "./VehicleListView";

const WRONG_CREDENTIALS = "Anmeldung fehlgeschlagen.";
const SESSION_ENDED = "Bitte erneut anmelden.";
const SERVICE_UNAVAILABLE = "Der Dienst ist nicht erreichbar.";

type Session = {
  token: string;
  username: string;
  role: string;
  vehicles: Vehicle[];
};

function messageFor(failure: Failure, duringLogin: boolean): string {
  if (failure === "unavailable") {
    return SERVICE_UNAVAILABLE;
  }
  return duringLogin ? WRONG_CREDENTIALS : SESSION_ENDED;
}

export function App(props: { api: FleetApi; history?: HistoryApi; map?: TrackMap }) {
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [openVin, setOpenVin] = useState<string | null>(null);

  async function onLogin(username: string, password: string) {
    setMessage(null);
    const loggedIn = await props.api.login(username, password);
    if (!loggedIn.ok) {
      setSession(null);
      setMessage(messageFor(loggedIn.failure, true));
      return;
    }
    const me = await props.api.me(loggedIn.token);
    if (!me.ok) {
      setSession(null);
      setMessage(messageFor(me.failure, false));
      return;
    }
    const listed = await props.api.vehicles(loggedIn.token);
    if (!listed.ok) {
      setSession(null);
      setMessage(messageFor(listed.failure, false));
      return;
    }
    setSession({
      token: loggedIn.token,
      username: me.username,
      role: me.role,
      vehicles: listed.vehicles,
    });
  }

  function onLogout() {
    setSession(null);
    setMessage(null);
    setOpenVin(null);
  }

  function onUnauthorized() {
    setSession(null);
    setOpenVin(null);
    setMessage(SESSION_ENDED);
  }

  function closeVehicle() {
    setOpenVin(null);
  }

  if (session === null) {
    return <LoginView message={message} onSubmit={onLogin} />;
  }
  return (
    <main className="volt-page">
      <FleetTopbar
        username={session.username}
        role={session.role}
        onLogout={onLogout}
        onFleet={closeVehicle}
      />
      {openVin !== null && props.history !== undefined && props.map !== undefined ? (
        <VehicleDetailView
          vin={openVin}
          token={session.token}
          history={props.history}
          map={props.map}
          onBack={closeVehicle}
          onUnauthorized={onUnauthorized}
        />
      ) : (
        <VehicleListView
          username={session.username}
          vehicles={session.vehicles}
          onOpen={props.history === undefined ? undefined : setOpenVin}
        />
      )}
    </main>
  );
}
