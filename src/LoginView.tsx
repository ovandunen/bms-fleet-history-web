import { useState, type FormEvent } from "react";
import { VoltBrand } from "./FleetTopbar";
import { Icon } from "./icons";

const SESSION_ENDED = "Bitte erneut anmelden.";

export function LoginView(props: {
  message: string | null;
  onSubmit: (username: string, password: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    props.onSubmit(username, password);
  }

  return (
    <main className="volt-page login-page">
      <section className="login-card">
        <VoltBrand />
        <div className="login-eyebrow">FLOTTENPLATTFORM</div>
        <h1>Willkommen zurück.</h1>
        <p>Melden Sie sich an, um Ihre Flotte zu überwachen.</p>
        {props.message === null ? null : (
          <div role="alert" className={props.message === SESSION_ENDED ? "login-notice" : "login-error"}>
            {props.message === SESSION_ENDED ? <Icon name="clock" size={17} /> : null}
            {props.message}
          </div>
        )}
        <form onSubmit={submit}>
          <label className="login-label" htmlFor="login-username">
            Benutzername
          </label>
          <input
            id="login-username"
            className="login-input"
            name="username"
            value={username}
            autoComplete="username"
            onChange={(event) => setUsername(event.target.value)}
          />
          <label className="login-label" htmlFor="login-password">
            Passwort
          </label>
          <input
            id="login-password"
            className="login-input"
            name="password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
          <button type="submit" className="primary-button login-submit">
            Anmelden <Icon name="arrow-right" size={17} />
          </button>
        </form>
      </section>
      <div className="login-backdrop">
        <span>FLOTTE IM BLICK.</span>
        <b>Elektrisch. Klar. Vernetzt.</b>
        <div className="backdrop-map" />
      </div>
    </main>
  );
}
