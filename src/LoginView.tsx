import { useState, type FormEvent } from "react";

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
    <form onSubmit={submit}>
      <label>
        Benutzername
        <input
          name="username"
          value={username}
          autoComplete="username"
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>
      <label>
        Passwort
        <input
          name="password"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button type="submit">Anmelden</button>
      {props.message === null ? null : <p role="alert">{props.message}</p>}
    </form>
  );
}
