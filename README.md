# bms-fleet-history-web

Web front end of the EcoCarSolaire fleet history. A user logs in and sees the vehicles that user may see.

This app only collects the login and shows what the backend returns. Who may see what is decided by the backend, `bms-fleet-history-service`. The app never decides that itself.

Status: 2026-10-08 · first version D2b, commit `554b0f9` · Owner: Ola van Dunen

Markers used below: SEEN means it was read in code or command output. INFERRED means it is a conclusion that was not checked.

## Where this fits

```
Tablet (BMS app, bms-monitoring-app)
   |  once a day: POST /api/v1/history/{vin}/{day}   header X-Fleet-Key
   v
bms-fleet-history-service   (Quarkus, port 8080)  ->  PostGIS  ->  Grafana
   ^
   |  POST /api/v1/auth/login, GET /api/v1/me, GET /api/v1/vehicles   header Authorization: Bearer <token>
   |
bms-fleet-history-web       (this repo, React app)
```

Related repositories, all under `~/project/`:

| Repo | What it is |
|---|---|
| `bms-fleet-history-service` | Backend. Stores the uploaded history, owns login, roles and fleet scoping. |
| `bms-fleet-history-web` | This repo. The web app for users. |
| `bms-vehicle-history-log` | NOT this repo. A Kotlin library on the tablet that writes the GeoJSON day files. It has no web part. |
| `bms-monitoring-app` | The tablet app that uses that library and uploads the day files. |

Decisions behind this split are in `Handover.md`, section 6 (EcoCarSolaire project).

## What is the Vite server?

Vite is the development tool for this React app. `npm run dev` starts a Node process on the developer's computer. That process is a small web server with two jobs:

1. It serves this app to the browser and reloads the page when the code changes.
2. It forwards every request whose path starts with `/api` to the backend on `http://localhost:8080` (the proxy in `vite.config.ts`). The browser therefore talks to one address, and no CORS setting is needed.

It is a development tool only. It is not the backend, and it is not used in production. The page it serves has the title "Flottenhistorie" (SEEN with `curl` on 2026-10-08).

`npm run build` writes the finished files into `dist/`. How `dist/` will be served in production (nginx, Docker, something else) is not decided yet.

### Which process is which

| Process | Port | What it is | Started by |
|---|---|---|---|
| `node` (Vite) | the port in the `Local:` line of the `npm run dev` output. Default 5173 | this web app, development server | `npm run dev` in this repo |
| `java` (Quarkus) | 8080 | the backend `bms-fleet-history-service` in dev mode | `./mvnw quarkus:dev` in the service repo |
| Docker `postgis` | 5432 | database of the Docker stack. Quarkus dev mode uses its own database (INFERRED) | `docker compose` in the service repo |
| `com.docker...` | 5173 to 5190 on 2026-10-08 | NOT ours. Docker Desktop was listening on all of these ports (SEEN with `lsof`) | Docker Desktop |

Because Docker Desktop held 5173 to 5190, Vite printed "Port 5173 is in use, trying another one" nine times and ended on 5190. Do not open Docker's ports in the browser. Open only the address from the `Local:` line.

To see which process holds which port:

```
lsof -nP -iTCP:5173-5200 -sTCP:LISTEN
lsof -nP -iTCP:8080 -sTCP:LISTEN
for p in $(lsof -tiTCP:5173-5200 -sTCP:LISTEN); do echo "$p $(lsof -a -d cwd -p $p -Fn | sed -n 's/^n//p')"; done
```

The last command prints each PID with its working directory. The Vite server of this app is the one whose directory ends in `bms-fleet-history-web`.

## Credentials: which one is used for what

| What | Used for | Where the value is stored | Notes |
|---|---|---|---|
| Web login, dev | the login form of this app | Username `dev-admin` (SEEN in `bms-fleet-history-service/src/main/java/db/dev/V9000__DevSeed.java`). Password: property `identity.seed.password` in the `%dev` block of `bms-fleet-history-service/src/main/resources/application.properties` | Exists only in dev and test. The seed is a Flyway migration in the location `db/dev`, which only the `%dev` and `%test` profiles load. The prod profile never loads it. |
| Web login, production | the login form | not defined yet | Real users live in the table `app_user` (bcrypt hashes). There is no process to create a user yet. |
| Token | `Authorization: Bearer` header | in browser memory only | Lifetime 300 seconds. No refresh token. |
| Token signing keys | backend signs and verifies tokens | dev and test: a key pair inline in `application.properties` (`%dev`, `%test`). Default and prod: environment variables `JWT_SIGN_KEY` (private) and `JWT_VERIFY_KEY` (public) | `docker-compose.yml` does not define them yet. Never commit a production key. |
| Tablet upload key | tablets upload day files | property `fleet.upload.key` in the service. On the tablet: `history_upload_key` in `config_override.yml` | Not related to the web login. Checked by `FleetKeyFilter` on `/api/v1/history/**` only. |
| Grafana admin | Grafana login | `GF_SECURITY_ADMIN_USER` and `GF_SECURITY_ADMIN_PASSWORD` in the service's `docker-compose.yml` | Grafana is not part of this app yet (D2c). |

Copy the dev password to the clipboard without printing it:

```
sed -n 's/^%dev\.identity\.seed\.password=//p' ~/project/bms-fleet-history-service/src/main/resources/application.properties | tr -d '\n' | pbcopy
```

Never put a password or key into this repo, a ticket or a chat.

## Run it from scratch

Needed: Node `^22.22.2`, `^24.15.0` or `>=26` (the developer's machine runs 26.3.0), JDK 21, and Docker Desktop running (the backend starts a PostGIS container for its database in dev mode, INFERRED).

1. Make sure the old Docker service is not holding port 8080. It was built before D2a and answers every login with a 404 page ("Resource not found"). Only `fleet-history` is stopped. `postgis` stays up.

```
docker compose -f ~/project/bms-fleet-history-service/docker-compose.yml stop fleet-history
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

The `lsof` prints nothing at this point.

2. Start the backend in dev mode. Leave it running.

```
cd ~/project/bms-fleet-history-service
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw quarkus:dev
```

3. Check the backend.

```
curl -i -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{"username":"x","password":"y"}'
```

Expected: `401` and `{"message":"Invalid credentials"}`. A `404` with an HTML page means an old server holds port 8080.

4. Start this app. Leave it running.

```
cd ~/project/bms-fleet-history-web
npm install
npm run dev
```

If the default port is taken, choose a free one. `--port` and `--strictPort` are standard Vite options and were not tested here:

```
npm run dev -- --port 5200 --strictPort
```

5. Open the address from the `Local:` line and log in as `dev-admin` (see the credentials table). After the login the page shows the user name, the role and a table of vehicles. The dev database holds the seed data and none of the tablet uploads (INFERRED). By the D2a design the seed contains one vehicle, `VF6SG2000AD000001`, in the fleet `dev-fleet`.

Check the same thing from the terminal, with the token masked:

```
PW=$(sed -n 's/^%dev\.identity\.seed\.password=//p' ~/project/bms-fleet-history-service/src/main/resources/application.properties)
T=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d "{\"username\":\"dev-admin\",\"password\":\"$PW\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
unset PW
curl -s -H "Authorization: Bearer $T" http://localhost:8080/api/v1/me
curl -s -H "Authorization: Bearer $T" http://localhost:8080/api/v1/vehicles
unset T
```

## Backend API used by this app

SEEN in the backend code at commit `7aa63e0` (D2a). JSON names equal the Java record names.

| Call | Request | Response |
|---|---|---|
| `POST /api/v1/auth/login` | `{ "username": string, "password": string }` | 200: `{ "token": string, "role": string }`. 401: `{ "message": "Invalid credentials" }` |
| `GET /api/v1/me` | header `Authorization: Bearer <token>` | `{ "username": string, "role": string }` |
| `GET /api/v1/vehicles` | header `Authorization: Bearer <token>` | array of `{ "vin": string, "fleet": string or null }` |

Roles: `USER` sees the vehicles of its fleets. A user without a fleet sees none. `SUPER_USER` and `ADMIN` see every vehicle, including VINs that have uploads but no fleet (`fleet` is `null`). A 401 from `/vehicles` has no body when the account is missing or disabled.

## What the app does

- Two views, chosen by state: login when there is no token, otherwise the vehicle list. No router.
- The token lives in React state only. It is not in `localStorage`, `sessionStorage` or a cookie. A page reload logs the user out. This is intended.
- The token lasts 300 seconds (`smallrye.jwt.new-token.lifespan=300` in the service). There is no refresh. After that the next call returns 401 and the user sees the login again.
- UI texts are German. Code, comments and this README are English.

| Message shown | Meaning |
|---|---|
| Anmeldung fehlgeschlagen. | login returned 401: wrong user or password |
| Bitte erneut anmelden. | `/me` or `/vehicles` returned 401: token expired or invalid, token dropped |
| Der Dienst ist nicht erreichbar. | network error or any other status than 401 |
| nicht zugeordnet | the vehicle has `fleet: null` |
| Keine Fahrzeuge | the list is empty |

## Tests and build

```
npm test
npm run build
```

- `npm test` runs Vitest (v5.0.3) with jsdom and React Testing Library. 14 tests: 4 in `src/api.test.ts` (real adapter, stubbed `fetch`), 10 in `src/App.test.tsx` (fake adapter). No network is used.
- `npm run build` runs `tsc --noEmit` and `vite build` (Vite 8.3.3) and writes `dist/`.
- All other versions are in `package.json`.

## Troubleshooting

| Symptom | Likely cause | What to do |
|---|---|---|
| "Resource not found" HTML page, or HTTP 404 on login | An old server without the D2a endpoints holds port 8080, usually the Docker service `fleet-history` | Stop it as in step 1. Or you opened the wrong port. |
| "Port 5173 is in use" several times | Docker Desktop holds 5173 to 5190 (SEEN on 2026-10-08) | Start Vite on another port and use the printed address. |
| "Der Dienst ist nicht erreichbar." | The backend is not running, or the proxy cannot reach port 8080 | Run step 3. If it works but the app does not, test through the Vite port with the same `curl` and your Vite port. |
| Proxy error although step 3 works | Possible IPv4/IPv6 mismatch between `localhost` in `vite.config.ts` and the backend, which listens on `127.0.0.1` (SEEN). Not observed so far | Change the proxy target in `vite.config.ts` to `http://127.0.0.1:8080`. |
| "Anmeldung fehlgeschlagen." with the right password | The dev seed did not run, or the password was copied with extra characters | Use the `pbcopy` command above. Check that the backend runs in dev mode and not in prod mode. |
| "Keine Fahrzeuge" for an ADMIN | The dev database has no vehicles | Check the seed migration and the backend start log. |

## Open points

1. Whether a server error (5xx) on `/me` or `/vehicles` keeps the token is not verified. The decision was that only a 401 clears it. Check `src/App.tsx`.
2. Hosting of the built app (`dist/`) in production is undecided.
3. The 300 second token lifetime without refresh sends users back to the login every five minutes. Fine for a prototype only.
4. There is no way to create real users. The only user is the dev seed, which exists in dev and test only.
5. `JWT_SIGN_KEY` and `JWT_VERIFY_KEY` are not in `docker-compose.yml`. The packaged service does not start in prod mode until they are set.
6. The login answers faster for an unknown user than for a known one, because bcrypt only runs for known users. That reveals which user names exist.
7. Grafana embedding and per-fleet limits are D2c. The Grafana database user can read every VIN, and a VIN in a URL is not a security boundary. Do not embed Grafana in this app before that is solved.

## History

| Date | Step | Commit |
|---|---|---|
| 2026-10-07 | D2a backend: identity package, login, roles, fleet scoping, dev seed. 32 tests (17 existing, 15 new) | `7aa63e0` in `bms-fleet-history-service` |
| 2026-10-08 | D2b web app: login and vehicle list. 14 tests | `554b0f9` in this repo |
## Users, roles and secrets (added 2026-10-08)

Add this section to the README of `bms-fleet-history-service`. Merge it by hand with the section D2a already added, so nothing appears twice.

Markers: SEEN means read in code or command output. INFERRED means a conclusion that was not checked.

### Who calls what

| Caller | Paths | Authentication |
|---|---|---|
| Tablets (BMS app) | `POST /api/v1/history/{vin}/{day}` | header `X-Fleet-Key`, checked by `FleetKeyFilter` on every path under `api/v1/history` |
| Web app `bms-fleet-history-web` | `POST /api/v1/auth/login` (public), `GET /api/v1/me`, `GET /api/v1/vehicles` | header `Authorization: Bearer <token>` on the last two |
| Health check | `/q/health` | none |

The login paths are deliberately not under `/api/v1/history`, so `FleetKeyFilter` does not apply to them.

### Where each secret lives

| Secret | Used for | Stored in |
|---|---|---|
| Dev login password | the seed user `dev-admin` | property `identity.seed.password` in the `%dev` and `%test` blocks of `src/main/resources/application.properties`. Not in the default or `%prod` block |
| Token signing keys, dev and test | signing and verifying tokens | key pair inline in the `%dev` and `%test` blocks (base64 PKCS#8 private key, X.509 public key) |
| Token signing keys, default and prod | the same | environment variables `JWT_SIGN_KEY` and `JWT_VERIFY_KEY`, referenced as `${JWT_SIGN_KEY}` and `${JWT_VERIFY_KEY}`. `docker-compose.yml` does not define them, so the packaged service does not start in prod mode until they are set |
| Tablet upload key | `X-Fleet-Key` | property `fleet.upload.key`. On the tablet: `history_upload_key` in `config_override.yml` |
| Grafana admin | Grafana login | `GF_SECURITY_ADMIN_USER` and `GF_SECURITY_ADMIN_PASSWORD` in `docker-compose.yml` |
| Grafana database user | Grafana reads PostGIS | role `grafana_reader` (migration `V2__grafana_reader.sql`), password from the Flyway placeholder `grafana_db_password` |

Never print or commit a production key or password.

### Tables (migration `V3__identity.sql`)

| Table | Columns | Notes |
|---|---|---|
| `app_user` | `id`, `username` (unique), `password_hash`, `role`, `enabled` | `role` is one of `USER`, `SUPER_USER`, `ADMIN` (check constraint). Passwords are bcrypt hashes |
| `fleet` | `id`, `name` | |
| `vehicle` | `vin` (primary key), `fleet_id` | one fleet has many vehicles |
| `user_fleet` | `user_id`, `fleet_id` | links users to fleets |

There is no foreign key from `day_upload` or `history_point` to `vehicle`, so an upload for a VIN that is in no fleet is still accepted. `SUPER_USER` and `ADMIN` see such a VIN with `fleet` null. A `USER` does not.

### Dev seed

- It is the Java migration `db.dev.V9000__DevSeed` in the Flyway location `db/dev`.
- `%dev` and `%test` load `db/migration` and `db/dev`. `%prod` loads `db/migration` only (SEEN in `application.properties`).
- It creates the user `dev-admin` (role `ADMIN`) and the fleet `dev-fleet`, hashes the password from `identity.seed.password` with bcrypt, and links user and fleet. By the D2a design it also creates the vehicle `VF6SG2000AD000001`. Check the class if this matters.
- Version 9000 is chosen so that it can never collide with a future migration in `db/migration`.
- A production database must stay at Flyway version 3. Before a deploy, `SELECT version FROM flyway_schema_history ORDER BY installed_rank;` must not list 9000.

### Running locally with the web app

Step by step instructions, ports, the dev login and troubleshooting are in the README of `bms-fleet-history-web`. In short: stop the old `fleet-history` Docker service so port 8080 is free, run `./mvnw quarkus:dev` here, run `npm run dev` there.

### Tests

32 tests at commit `7aa63e0`: the 17 existing history tests and 15 new ones (`LoginTest` 4, `IdentityLoginTest` 4, `IdentityVehicleTest` 7). 16 of the history and identity tests are `@QuarkusTest` and need Docker running (INFERRED: Dev Services start a PostGIS container).

```
JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw test
```
