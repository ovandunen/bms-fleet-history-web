import { useState } from "react";
import type { Failure, FleetApi, Vehicle } from "./api";
import { LoginView } from "./LoginView";
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

export function App(props: { api: FleetApi }) {
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
  }

  if (session === null) {
    return <LoginView message={message} onSubmit={onLogin} />;
  }
  return (
    <VehicleListView
      username={session.username}
      role={session.role}
      vehicles={session.vehicles}
      onLogout={onLogout}
    />
  );
}
