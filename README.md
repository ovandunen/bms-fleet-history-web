# bms-fleet-history-web

Login and vehicle list for the fleet history service. This app takes user input only. The service checks the login and owns roles and business logic. The web app does not decide who may see which vehicle.

## Node

Requires Node `^22.22.2`, `^24.15.0`, or `>=26`. Ola uses Node 26.3.0.

## Run

```
npm install
npm run dev
npm test
npm run build
```

`npm install` writes the lockfile. `npm run dev` starts the Vite dev server. Requests to `/api` are proxied to `http://localhost:8080`, and the `/api` prefix is kept. The service is expected to be running there. No CORS setting is used.

`@testing-library/dom` is not a direct dependency. npm installs it because `@testing-library/react` and `@testing-library/jest-dom` declare it as a peer.

## API

`POST /api/v1/auth/login` (public) with JSON `{ "username": string, "password": string }`.

Success `200`: `{ "token": string, "role": string }`. `role` is `USER`, `SUPER_USER`, or `ADMIN`.

Failure `401`: `{ "message": "Invalid credentials" }`. The view shows "Anmeldung fehlgeschlagen." and does not display that English body.

`GET /api/v1/me` with `Authorization: Bearer <token>` returns `{ "username": string, "role": string }`. The list view shows this user name and role.

`GET /api/v1/vehicles` with the same header returns a JSON array of `{ "vin": string, "fleet": string | null }`. A null `fleet` is shown as "nicht zugeordnet". An empty array is shown as "Keine Fahrzeuge".

A network error or an HTTP status of 500 or higher on login, `/me`, or `/vehicles` shows "Der Dienst ist nicht erreichbar." and leaves the token empty. Any other non-401 failure on those calls uses that same message. A 401 from `/me` or `/vehicles` drops the token and shows the login view with "Bitte erneut anmelden."

## Session

The token is kept in React state only. It is not written to `localStorage`, `sessionStorage`, IndexedDB, or a cookie. Reloading the page logs the user out. The service issues the token for 300 seconds (`smallrye.jwt.new-token.lifespan=300`). There is no refresh token.
