# Last Race — Technical Documentation

A complete reference for the **Last Race** web application: a single-player metro
route-planning game set on a schematic Milano network. The player is given a
random start and destination, plans a route under a 90-second timer, submits it,
and the server runs a randomized "journey" of weighted events that add or remove
coins. The final coin total is the score; the best score per user appears on a
global ranking.

This document describes **everything**: the full backend (database, data-access
layer, business logic, authentication, routes, DTOs) and the full frontend
(entry point, routing, state machines, API client, every component and its
props/state). It also explains the in-memory data structures used on both sides.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository Layout](#3-repository-layout)
4. [Backend](#4-backend)
   - 4.1 [Database Schema](#41-database-schema)
   - 4.2 [Seed Data](#42-seed-data)
   - 4.3 [Database Access Layer (`db/db.js`)](#43-database-access-layer-dbdbjs)
   - 4.4 [Data Access Objects (DAO)](#44-data-access-objects-dao)
   - 4.5 [Business Logic Library (`lib/`)](#45-business-logic-library-lib)
   - 4.6 [Authentication](#46-authentication)
   - 4.7 [HTTP API — Routes & DTOs](#47-http-api--routes--dtos)
   - 4.8 [Server Bootstrap (`index.js`)](#48-server-bootstrap-indexjs)
   - 4.9 [Game Lifecycle & Anti-Cheat](#49-game-lifecycle--anti-cheat)
5. [Frontend](#5-frontend)
   - 5.1 [Entry Point & Providers](#51-entry-point--providers)
   - 5.2 [Routing & Route Guard](#52-routing--route-guard)
   - 5.3 [Authentication Context](#53-authentication-context)
   - 5.4 [API Client (`api/API.js`)](#54-api-client-apiapijs)
   - 5.5 [Pages](#55-pages)
   - 5.6 [Components](#56-components)
   - 5.7 [Game Phase State Machine](#57-game-phase-state-machine)
   - 5.8 [Client-Side Data Structures](#58-client-side-data-structures)
6. [End-to-End Data Flow](#6-end-to-end-data-flow)
7. [DTO Reference (Quick Table)](#7-dto-reference-quick-table)

---

## 1. Architecture Overview

The project is a classic **two-tier client/server** application with a clean
separation of concerns:

```
┌──────────────────────────┐         HTTP + JSON          ┌──────────────────────────┐
│   React SPA (client)     │   (cookies, credentials)     │   Express API (server)   │
│                          │ ───────────────────────────► │                          │
│  Vite dev server :5173   │ ◄─────────────────────────── │   Node/Express :3001     │
└──────────────────────────┘                              └────────────┬─────────────┘
                                                                        │
                                                              ┌─────────▼─────────┐
                                                              │  SQLite database  │
                                                              │  db/lastrace.db   │
                                                              └───────────────────┘
```

The backend is **authoritative** for every game-critical decision: it assigns the
start/destination, hides line information during planning, applies the random
events, enforces the planning deadline server-side, and validates the route.
The client is a presentation/interaction layer — it can never change the score by
itself.

The backend itself is **layered**:

```
routes/        HTTP endpoints, validation, DTO shaping   (depends on ↓)
   │
lib/           pure business logic (graph, validation, events, auth)
   │
dao/           data-access objects (SQL queries → JS objects)
   │
db/db.js       promisified SQLite driver (singleton connection)
   │
SQLite file    db/lastrace.db
```

Each layer only depends on the layer below it. The `lib/` logic modules
(`graph.js`, `routeValidation.js`, `events.js`) are **pure functions** with an
injectable random-number generator (`rng`), which makes them deterministic and
unit-testable.

---

## 2. Technology Stack

### Backend (`server/package.json`)

| Package | Version | Purpose |
| --- | --- | --- |
| `express` | ^5.2.1 | HTTP server & routing |
| `express-session` | ^1.19.0 | Server-side session store (cookie-based) |
| `express-validator` | ^7.3.2 | Request body/param validation |
| `passport` | ^0.7.0 | Authentication framework |
| `passport-local` | ^1.0.0 | Username/password strategy |
| `sqlite3` | ^6.0.1 | SQLite driver (callback-based, wrapped in Promises) |
| `cors` | ^2.8.6 | Cross-origin requests from the Vite dev server |
| `morgan` | ^1.10.1 | HTTP request logging (`dev` format) |

- Module system: **ESM** (`"type": "module"`).
- Entry point: `server/index.js`. Run with `node index.js` (listens on port `3001`).

### Frontend (`client/package.json`)

| Package | Version | Purpose |
| --- | --- | --- |
| `react` / `react-dom` | ^19.2.7 | UI library |
| `react-router-dom` | ^7.16.0 | Client-side routing |
| `react-bootstrap` | ^2.10.10 | UI components |
| `bootstrap` | ^5.3.8 | CSS framework |
| `vite` | ^8.0.12 | Dev server & bundler |
| `eslint` (+ plugins) | ^10.3.0 | Linting |

- Module system: **ESM**. Dev server: `npm run dev` (Vite, default port `5173`).
- Build: `npm run build` → static assets in `client/dist/`.

---

## 3. Repository Layout

```
exam-1-last-race-Giuseppeclv008/
├── README.md
├── DOCUMENTATION.md          ← this file
├── img/                      screenshots / assets
├── client/                   React single-page application
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx          app entry, providers, router
│       ├── App.jsx           top-level routes + RequireAuth guard
│       ├── api/API.js        fetch wrapper for every endpoint
│       ├── contexts/
│       │   ├── auth-context.js     React Context + useAuth hook
│       │   └── AuthContext.jsx     AuthProvider component
│       ├── pages/
│       │   ├── Instructions.jsx    home / rules
│       │   ├── LoginForm.jsx       login screen
│       │   ├── PlayPage.jsx        game host (phase state machine)
│       │   └── Ranking.jsx         global leaderboard
│       ├── components/
│       │   ├── NavBar.jsx
│       │   ├── SetupView.jsx       study network, start game
│       │   ├── PlanningView.jsx    pick segments under the timer
│       │   ├── SegmentList.jsx     pickable list of segments
│       │   ├── RouteBuilder.jsx    chosen route + submit/undo
│       │   ├── NetworkMap.jsx      SVG metro map
│       │   ├── CountdownTimer.jsx  90-second timer
│       │   ├── ExecutionView.jsx   animated event playback
│       │   └── ResultView.jsx      final score
│       └── styles/theme.css
└── server/                   Express API
    ├── index.js              bootstrap (middleware + listen)
    ├── package.json
    ├── db/
    │   ├── db.js             SQLite connection + promisified helpers
    │   └── lastrace.db       SQLite database file
    ├── dao/
    │   ├── userDao.js
    │   ├── networkDao.js
    │   ├── gameDao.js
    │   └── eventDao.js
    ├── lib/
    │   ├── auth.js           passport + session config
    │   ├── graph.js          shuffle, adjacency, BFS, start/dest picker
    │   ├── routeValidation.js route legality checker
    │   └── events.js         weighted random event engine
    └── routes/
        ├── sessionRoutes.js  login / logout / current user
        └── gameRoutes.js     network / game / route / ranking
```

---

## 4. Backend

### 4.1 Database Schema

The database is a single SQLite file (`server/db/lastrace.db`). `PRAGMA
foreign_keys = ON` is set on connection. Seven application tables plus SQLite's
internal `sqlite_sequence`.

#### `users`
Registered players and their hashed credentials.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `username` | TEXT | NOT NULL, UNIQUE | login name |
| `name` | TEXT | NOT NULL | display name |
| `hash` | TEXT | NOT NULL | scrypt hash, hex-encoded |
| `salt` | TEXT | NOT NULL | per-user salt passed to scrypt |

#### `stations`
Network nodes, positioned for the SVG map.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `name` | TEXT | NOT NULL, UNIQUE | e.g. "Duomo" |
| `x` | REAL | NOT NULL | SVG x coordinate |
| `y` | REAL | NOT NULL | SVG y coordinate |

#### `lines`
Metro lines (M1–M4).

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `name` | TEXT | NOT NULL, UNIQUE | "M1".."M4" |
| `color` | TEXT | NOT NULL | hex colour for the map |

#### `line_stations`
Ordered membership of stations on lines (junction table with ordering).

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `line_id` | INTEGER | NOT NULL, FK → `lines(id)` | |
| `station_id` | INTEGER | NOT NULL, FK → `stations(id)` | |
| `position` | INTEGER | NOT NULL | order along the line |
| | | PRIMARY KEY (`line_id`, `position`) | one station per slot per line |

Consecutive `position` values on the same line define the **physical segments**
(edges) of the network. Two stations adjacent on a line are connected.

#### `events`
The pool of random journey events.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `description` | TEXT | NOT NULL | shown to the player |
| `effect` | INTEGER | NOT NULL, CHECK (`-4 ≤ effect ≤ 4`) | coin delta |
| `weight` | INTEGER | NOT NULL, CHECK (`weight > 0`) | relative probability |

#### `games`
One row per started game.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `user_id` | INTEGER | NOT NULL, FK → `users(id)` | owner |
| `start_station_id` | INTEGER | NOT NULL, FK → `stations(id)` | assigned start |
| `dest_station_id` | INTEGER | NOT NULL, FK → `stations(id)` | assigned destination |
| `score` | INTEGER | nullable | final coins, set on completion |
| `status` | TEXT | NOT NULL, DEFAULT `'pending'` | `pending` / `completed` / `invalid` |
| `created_at` | TEXT | NOT NULL | ISO timestamp; basis for the deadline |

**Status lifecycle:** a game is created `pending`. It becomes `completed` (with a
`score`) when a valid route is submitted in time, or `invalid` when the route is
illegal or arrives after the deadline.

#### `game_segments`
The per-hop breakdown of a completed game (audit trail of the journey).

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `game_id` | INTEGER | NOT NULL, FK → `games(id)` | |
| `ord` | INTEGER | NOT NULL | hop index (0-based) |
| `from_station_id` | INTEGER | NOT NULL, FK → `stations(id)` | |
| `to_station_id` | INTEGER | NOT NULL, FK → `stations(id)` | |
| `event_id` | INTEGER | NOT NULL, FK → `events(id)` | event that fired on this hop |
| `coins_after` | INTEGER | NOT NULL | running coin total after this hop |

**Entity relationships:**

```
users 1───∞ games 1───∞ game_segments ∞───1 events
                  │                  │
                  └─ start/dest ─────┴─ from/to ──► stations
lines 1───∞ line_stations ∞───1 stations
```

### 4.2 Seed Data

**Users** (password is the same hashing scheme for all; not shown):

| id | username | name |
| --- | --- | --- |
| 1 | alice | Alice |
| 2 | bob | Bob |
| 3 | carol | Carol |

**Lines:**

| id | name | color |
| --- | --- | --- |
| 1 | M1 | #D7282F (red) |
| 2 | M2 | #007E3A (green) |
| 3 | M3 | #F1A719 (yellow) |
| 4 | M4 | #0073BB (blue) |

**Stations (13):** Linate Aeroporto, Centrale FS, Cadorna FN, Pagano, Duomo, San
Babila, Sant'Ambrogio, Dateo, Porta Garibaldi, Loreto, Lambrate FS, Piola, Porta
Romana — each with `(x, y)` SVG coordinates.

**Line composition (`line_stations`, by `position`):**

| Line | Stations (in order) |
| --- | --- |
| M1 | Centrale FS → Cadorna FN → Pagano → Duomo → San Babila |
| M2 | Sant'Ambrogio → Loreto → Lambrate FS → Piola |
| M3 | Duomo → Loreto → Porta Garibaldi → Lambrate FS → Porta Romana |
| M4 | Linate Aeroporto → Centrale FS → Sant'Ambrogio → Dateo → Porta Garibaldi |

*Implementation note:* M2's rows begin at `position = 1` (there is no `position 0`
row). This is harmless because `getLinesWithStations` orders by `position`, so the
stations still come out in the correct relative order; only consecutive pairs
matter for segment building.

**Stations shared by 2+ lines become interchanges** (degree of "line membership"
> 1): Duomo (M1, M3), Loreto (M2, M3), Lambrate FS (M2, M3), Centrale FS (M1, M4),
Sant'Ambrogio (M2, M4), Porta Garibaldi (M3, M4). A line change is only legal at
an interchange.

**Events (10)** — weighted; positive and negative effects sum across the journey:

| id | description | effect | weight |
| --- | --- | --- | --- |
| 1 | Quiet journey, nothing happens | 0 | 6 |
| 2 | A kind passenger gives you a coin | +1 | 5 |
| 3 | Free upgrade to the front carriage | +1 | 4 |
| 4 | You find coins on the seat | +2 | 3 |
| 5 | A busker tips you for cheering them on | +3 | 2 |
| 6 | Lucky day! Conductor rewards you | +4 | 1 |
| 7 | Crowded train, you drop a coin | −1 | 4 |
| 8 | Wrong platform, you waste a token | −2 | 4 |
| 9 | Ticket inspector fines you | −3 | 2 |
| 10 | You lose your wallet on the train | −4 | 1 |

Total weight = 32. Each event's probability per hop = `weight / 32`.

### 4.3 Database Access Layer (`db/db.js`)

A thin wrapper that turns the callback-based `sqlite3` API into Promises and keeps
a single shared connection.

```js
export const DB_PATH = "db/lastrace.db";
```

> **Important:** `DB_PATH` is **relative to the process working directory**, so the
> server must be started from inside `server/` (i.e. `cd server && node index.js`).

| Function | Signature | Returns | Description |
| --- | --- | --- | --- |
| `getDb()` | `() → sqlite3.Database` | the shared connection | **Singleton.** Opens the database the first time it is called, enables `PRAGMA foreign_keys = ON`, caches the handle in a module-level `db` variable, and returns the same handle on every later call. |
| `dbAll(sql, params=[])` | `(string, any[]) → Promise<object[]>` | array of rows | Promisified `db.all`. Use for `SELECT` returning many rows. Rejects on error. |
| `dbGet(sql, params=[])` | `(string, any[]) → Promise<object\|undefined>` | one row or `undefined` | Promisified `db.get`. Use for single-row lookups. Rejects on error. |
| `dbRun(sql, params=[])` | `(string, any[]) → Promise<{lastID, changes}>` | run metadata | Promisified `db.run` for `INSERT`/`UPDATE`/`DELETE`. Resolves with `lastID` (auto-increment id of an insert) and `changes` (rows affected). Uses a `function(){}` callback so `this.lastID` / `this.changes` are accessible. |

All queries are **parameterized** (`?` placeholders) — no string concatenation,
so SQL injection is not possible.

### 4.4 Data Access Objects (DAO)

The DAO layer translates SQL rows into the JavaScript objects the rest of the
backend consumes. No DAO contains business logic; they only query and re-shape.

#### `dao/userDao.js`

| Function | Signature | Returns | Description |
| --- | --- | --- | --- |
| `getUserByUsername(username)` | `(string) → Promise<row\|undefined>` | full user row including `hash` and `salt` | Looks a user up by username for the login strategy. `SELECT * FROM users WHERE username = ?`. |
| `getUserById(id)` | `(number) → Promise<{id,username,name}\|null>` | safe user (no secrets) | Used when deserializing the session. Selects only `id, username, name` so the hash/salt never leave the DAO. Returns `null` when not found. |
| `verifyPassword(user, password)` | `(row, string) → Promise<boolean>` | match result | Re-derives the scrypt hash of the candidate password with the user's stored `salt` (key length 32), then compares it to the stored `hash` using `crypto.timingSafeEqual` (constant-time, prevents timing attacks). Length is checked first to satisfy `timingSafeEqual`'s equal-length requirement. |

#### `dao/networkDao.js`

| Function | Signature | Returns | Description |
| --- | --- | --- | --- |
| `getStations()` | `() → Promise<{id,name,x,y}[]>` | all stations, ordered by name | Raw node list for the map and for id→name lookups. |
| `getLinesWithStations()` | `() → Promise<{id,name,color,stations:number[]}[]>` | lines, each with its ordered `stations` array | For each line, runs a second query against `line_stations` ordered by `position` and attaches the station-id list. This is the canonical "line shape" used to derive segments and interchanges. |
| `getSegments()` | `() → Promise<{from,to}[]>` | unique undirected edges | Walks every line's consecutive station pairs, normalizes each pair to a canonical key (`min-max`) in a `seen` `Set` to drop duplicates (an edge shared by two lines appears once), and returns the deduplicated `{from, to}` list. |
| `getLineSetsAndInterchanges()` | `() → Promise<{lineSets, interchanges}>` | route-validation inputs | Builds two structures in one pass (see below). |

`getLineSetsAndInterchanges()` returns:
- **`lineSets`**: `Map<"a-b", Set<lineId>>` — for each undirected segment key, the
  set of line ids that run along it. Lets the validator know which lines a hop can
  be taken on.
- **`interchanges`**: `Set<stationId>` — stations served by **more than one line**.
  Built by counting, per station, how many distinct lines stop there
  (`stationLineCount`), then keeping ids with count > 1. A line change is only
  legal at one of these.

#### `dao/gameDao.js`

| Function | Signature | Returns | Description |
| --- | --- | --- | --- |
| `createGame(userId, startId, destId)` | `(number,number,number) → Promise<number>` | new `gameId` | Inserts a `pending` game with `created_at = new Date().toISOString()` and returns the auto-increment id (`lastID`). The timestamp is the anchor for the server-side deadline. |
| `getPendingGame(gameId)` | `(number) → Promise<row\|undefined>` | the game row | `SELECT * FROM games WHERE id = ? AND status = 'pending'`. Returns `undefined` if the game does not exist or was already completed/invalidated — this both finds the game and guarantees it can only be played once. |
| `invalidateGame(gameId)` | `(number) → Promise<void>` | — | Sets `status = 'invalid'`. Called when a route is illegal or late. |
| `completeGame(gameId, finalScore, steps)` | `(number, number, step[]) → Promise<void>` | — | Sets `status = 'completed'` and `score = finalScore`, then inserts one `game_segments` row per hop (`ord, from, to, eventId, coinsAfter`). |
| `getRanking()` | `() → Promise<{name, bestScore}[]>` | leaderboard | Aggregates each user's **best** completed score: `MAX(g.score)` grouped by user, only `status = 'completed'`, ordered by score descending then name ascending. |

The `steps` argument to `completeGame` is an array of
`{ ord, from, to, eventId, coinsAfter }` — see the route handler for how it is
built.

#### `dao/eventDao.js`

| Function | Signature | Returns | Description |
| --- | --- | --- | --- |
| `getEvents()` | `() → Promise<{id,description,effect,weight}[]>` | the full event pool | Feeds the weighted random engine. (Called as `getEvents(gameId)` in the route, but the argument is ignored — events are global, not per-game.) |

### 4.5 Business Logic Library (`lib/`)

Pure, side-effect-free functions (except `auth.js`). Each accepts an optional
`rng` so tests can inject a deterministic generator.

#### `lib/graph.js`

| Function | Signature | Returns | Description |
| --- | --- | --- | --- |
| `shuffle(arr, rng=Math.random)` | `(T[], fn) → T[]` | shuffled **copy** | Fisher–Yates shuffle on a shallow copy (does not mutate the input). Used to randomize the start search order and the segment list sent to the client. |
| `buildAdjacency(edges)` | `(edges) → Map<id, Set<id>>` | adjacency list | Builds an **undirected** adjacency map. Accepts edges either as `[from, to]` arrays or `{from, to}` objects (dual format eases testing). Adds both directions. |
| `bfsDistances(adj, startId)` | `(Map, id) → Map<id, number>` | hop distances | Breadth-first search from `startId`, returning the minimum number of hops to every reachable station (distance to itself = 0). BFS is optimal here because every segment is one unweighted hop. |
| `pickStartAndDest(stationsId, edges, rng=Math.random)` | `(id[], edges, fn) → {startId, destId}` | a valid pair | Randomly chooses a start, runs BFS, and picks a random destination at **distance ≥ 3** (the game spec's minimum trip length). Iterates shuffled starts until one has an eligible destination; throws `"No station pair found with distance >= 3"` if none exists. |

**Data structures used here:**
- *Adjacency list* — `Map<stationId, Set<neighborId>>`.
- *Distance map* — `Map<stationId, number>` produced by BFS.
- *BFS queue* — plain array used as FIFO (`push` / `shift`).

#### `lib/routeValidation.js`

```js
export function isValidRoute(route, startId, destId, lineSets, interchanges)
  → { valid: true } | { valid: false, reason: string }
```

Decides whether a submitted **station route** (an ordered array of station ids) is
legal. It never throws — it returns a result object. Validity rules, checked in
order:

1. **Shape:** `route` is an array with at least 2 entries → else `"rout too short"`.
2. **Start:** `route[0] === startId` → else `"wrong start"`.
3. **End:** last element `=== destId` → else `"route does not end at the correct station"`.
4. **Edges & no reuse:** for every consecutive pair, compute the canonical
   undirected key (`segKey`). If a key repeats → `"segment <key> used more than
   once"` (a segment may be travelled at most once). If the key is not in
   `lineSets` (no physical connection) → `"no connection a-b"`. Otherwise record
   the set of lines available on that hop.
5. **Line continuity / interchanges:** walk the per-hop line sets carrying the set
   of lines you could still be "on". If consecutive hops share a line, you stay on
   it. If they don't, that station must be in `interchanges`, otherwise
   `"line change at non interchange station <id>"`; at an interchange you switch to
   the new hop's line set.

**Local data structures:**
- `usedSegments`: `Set<"a-b">` — enforces the no-reuse rule.
- `segLines`: `Array<Set<lineId>>` — lines available per hop.
- `carried`: `Set<lineId>` — lines you could currently be riding; intersected hop
  by hop to detect forced line changes.
- `segKey(a, b)`: helper producing the order-independent key `min-max`.

#### `lib/events.js`

| Function | Signature | Returns | Description |
| --- | --- | --- | --- |
| `pickWeightedEvent(events, rng=Math.random)` | `(event[], fn) → event` | one event | Weighted random selection. Sums all `weight`s, draws `r ∈ [0, total)`, and walks the list subtracting weights until `r < weight`. Falls back to the last event for floating-point safety. |
| `applyRoute(segmentCount, events, startCoins, rng=Math.random)` | `(number, event[], number, fn) → {steps, finalScore}` | journey result | Simulates the journey: for each of `segmentCount` hops, picks a weighted event, adds its `effect` to the running coin total, and records a step `{ event, effect, coinsAfter }`. `finalScore = max(coins, 0)` so the score can never go negative. |

`steps` shape from `applyRoute`:
```js
[{ event: {id, description, effect, weight}, effect: number, coinsAfter: number }, ...]
```

### 4.6 Authentication

Implemented with **Passport** (local strategy) over **express-session**
(`lib/auth.js`).

**Local strategy** — given `(username, password)`:
1. `getUserByUsername(username)`; if no user **or** `verifyPassword` fails →
   `done(null, false, { message: "Incorrect username or password." })`.
2. On success → `done(null, { id, username, name })` (no secrets).

**Session (de)serialization:**
- `serializeUser` stores **only `user.id`** in the session — the cookie/session
  payload stays tiny.
- `deserializeUser(id)` re-queries `getUserById(id)` on every request, so
  `req.user` is always fresh `{id, username, name}`. If the user no longer exists →
  `done(new Error("User not found"))`.

**Session middleware:**
```js
session({ secret: "...", resave: false, saveUninitialized: false })
```
`resave: false` and `saveUninitialized: false` avoid writing unchanged/empty
sessions. *(Note: the secret is hard-coded; in production it should come from an
environment variable.)*

**Guard middleware:**
```js
isLoggedIn(req, res, next)  // next() if req.isAuthenticated(), else 401 {error:"Unauthorized"}
```
Applied to every game endpoint.

**Cookie/CORS coupling:** the server enables
`cors({ origin: "http://localhost:5173", credentials: true })` and the client sends
`credentials: "include"`, so the session cookie flows on cross-origin XHR during
development.

### 4.7 HTTP API — Routes & DTOs

Two routers are mounted at the root: `sessionRoutes` and `gameRoutes`. All bodies
are JSON. "DTO" below means the JSON shape sent (request) or returned (response).

#### Session routes (`routes/sessionRoutes.js`)

---

**`POST /api/sessions`** — log in.

- **Auth:** none.
- **Validation:** `username` is a non-empty string, `password` is a non-empty
  string (express-validator). On failure → **422** `{ error: "Invalid input" }`.
- **Request DTO:**
  ```json
  { "username": "alice", "password": "secret" }
  ```
- **Flow:** runs `passport.authenticate("local")`; on success establishes the
  session via `req.login`.
- **Responses:**
  - **200** `{ "id": 1, "username": "alice", "name": "Alice" }`
  - **401** `{ "error": "Incorrect username or password." }` (bad credentials)
  - **422** `{ "error": "Invalid input" }` (missing fields)
  - **500** via the error handler on unexpected errors.

---

**`GET /api/sessions/current`** — who am I?

- **Auth:** session cookie.
- **Request DTO:** none.
- **Responses:**
  - **200** `{ "id": 1, "username": "alice", "name": "Alice" }` (the current
    `req.user`)
  - **401** `{ "error": "Not authenticated" }`

---

**`DELETE /api/sessions/current`** — log out.

- **Auth:** session cookie.
- **Request DTO:** none.
- **Response:** **200** with an **empty body** (`req.logout` then `res.end()`).

---

#### Game routes (`routes/gameRoutes.js`)

Constants: `PLANNING_TIME = 90_000 ms` (90 s), `GRACE_MS = 5_000 ms` (5 s slack for
clock skew / network latency). Deadline = `PLANNING_TIME + GRACE_MS` = 95 s.

---

**`GET /api/network`** — full network for the study/setup phase.

- **Auth:** `isLoggedIn`.
- **Request DTO:** none.
- **Response DTO (200):**
  ```json
  {
    "stations": [ { "id": 5, "name": "Duomo", "x": 120, "y": 420 }, ... ],
    "lines": [
      { "id": 1, "name": "M1", "color": "#D7282F", "stations": [2,3,4,5,6] }, ...
    ],
    "segments": [ { "from": 2, "to": 3 }, ... ]
  }
  ```
  This **includes line information** because the setup phase is allowed to show the
  whole map (`stations`, `lines` with colours and ordered station ids, and unique
  `segments`).

---

**`POST /api/games`** — start a new game.

- **Auth:** `isLoggedIn`.
- **Request DTO:** none (the server decides everything).
- **Flow:** loads stations + segments, calls `pickStartAndDest` (distance ≥ 3),
  creates a `pending` game owned by `req.user.id`, then returns a planning payload.
- **Response DTO (200):**
  ```json
  {
    "gameId": 42,
    "coins": 20,
    "start": { "id": 2, "name": "Centrale FS" },
    "dest":  { "id": 6, "name": "San Babila" },
    "stations": [ { "id": 2, "name": "Centrale FS", "x": 500, "y": 200 }, ... ],
    "segments": [ { "from": 9, "to": 4 }, ... ]   // SHUFFLED
  }
  ```
  **Critical:** this payload **omits all line information** — no `lines`, no colours,
  no per-segment line ids. During planning the player only sees *which stations are
  directly connected* (the shuffled `segments`), not which line serves them. They
  must deduce interchanges/line changes themselves; the server is the sole judge of
  whether the final route is legal.

---

**`POST /api/games/:id/route`** — submit a planned route.

- **Auth:** `isLoggedIn`.
- **Validation:** path `id` is an integer; `route` is an array; every
  `route.*` is an integer. On failure → **422** `{ error: "Invalid input" }`.
- **Request DTO:**
  ```json
  { "route": [2, 3, 4, 5, 6] }   // ordered station ids, start → ... → dest
  ```
- **Flow & guards:**
  1. `getPendingGame(id)`; if missing → **404** `{ error: "Game not found or
     already completed" }`.
  2. Ownership: `game.user_id !== req.user.id` → **403** `{ error: "Not your
     game" }`.
  3. **Deadline:** `elapsed = now − created_at`; if `elapsed > 95 s` the game is
     invalidated and scored 0 (see below). This is enforced **server-side** so a
     client cannot cheat the timer.
  4. **Validity:** `isValidRoute(...)`; if invalid, the game is invalidated and
     scored 0.
  5. **Valid path:** `applyRoute(route.length − 1, events, 20)` simulates one event
     per hop starting from 20 coins, the result is persisted via `completeGame`
     (game → `completed`, plus one `game_segments` row per hop), and a detailed,
     name-enriched journey is returned.
- **Responses (all 200 unless guard fails):**
  - **Expired:**
    ```json
    { "valid": false, "expired": true, "steps": [], "finalScore": 0 }
    ```
  - **Invalid route (in time):**
    ```json
    { "valid": false, "expired": false, "steps": [], "finalScore": 0 }
    ```
  - **Valid route:**
    ```json
    {
      "valid": true,
      "expired": false,
      "finalScore": 23,
      "steps": [
        {
          "from": { "id": 2, "name": "Centrale FS" },
          "to":   { "id": 3, "name": "Cadorna FN" },
          "event": { "description": "You find coins on the seat", "effect": 2 },
          "coinsAfter": 22
        }, ...
      ]
    }
    ```
  - **404 / 403 / 422** as described above.

  **Two step shapes exist intentionally:** the array persisted to the DB is
  `{ ord, from, to, eventId, coinsAfter }` (ids only); the array returned to the
  client is enriched with station **names** and the event **description/effect** so
  the UI can render the journey without another round-trip.

---

**`GET /api/ranking`** — global leaderboard.

- **Auth:** `isLoggedIn`.
- **Request DTO:** none.
- **Response DTO (200):**
  ```json
  [ { "name": "Alice", "bestScore": 28 }, { "name": "Bob", "bestScore": 21 }, ... ]
  ```
  One row per user with at least one completed game, best score first.

---

**Global error handling:** any `next(e)` reaches the terminal handler in
`index.js`, which logs the error and responds **500** `{ error: "Internal Server
Error" }`.

### 4.8 Server Bootstrap (`index.js`)

Middleware order (order matters):

1. `morgan("dev")` — request logging.
2. `express.json()` — parse JSON bodies.
3. `cors({ origin: "http://localhost:5173", credentials: true })` — allow the Vite
   dev origin with cookies.
4. `sessionMiddleware` — express-session.
5. `passport.initialize()` + `passport.session()` — auth.
6. `sessionRoutes`, then `gameRoutes`.
7. Terminal error handler (4-arg) → 500 JSON.

Then `app.listen(3001)`.

### 4.9 Game Lifecycle & Anti-Cheat

```
        POST /api/games                 POST /api/games/:id/route
client ─────────────────► [pending] ──────────────────────────────► outcome
                              │
              created_at set  │           ┌─ late (>95s)  → status=invalid, score 0
                              │           ├─ illegal route→ status=invalid, score 0
                              └──────────►├─ valid route  → status=completed, score=Σ events
                                          └─ (one game_segments row per hop persisted)
```

The design assumes the **client cannot be trusted**. The server enforces:

| Threat | Mitigation |
| --- | --- |
| Faking the start/destination | Assigned by the server in `POST /api/games`. |
| Seeing line info during planning | Planning payload omits `lines`; only shuffled `segments` are sent. |
| Holding the request to beat the timer | Deadline computed from `created_at` server-side (95 s incl. grace). |
| Replaying / re-submitting a game | `getPendingGame` only returns `pending` games; completion flips status. |
| Submitting someone else's game | Ownership check `game.user_id === req.user.id`. |
| Forging the score | Events drawn and summed server-side via `applyRoute`. |
| Reusing a segment / illegal line change | `isValidRoute` rejects reuse and non-interchange line changes. |
| SQL injection | All queries parameterized. |
| Negative score | `finalScore = max(coins, 0)`. |

---

## 5. Frontend

A React 19 single-page app built with Vite and React-Bootstrap. State is local
(`useState`) plus one auth Context; there is no global store.

### 5.1 Entry Point & Providers

**`src/main.jsx`** mounts the app and wires the provider tree (outer → inner):

```
<StrictMode>
  <BrowserRouter>          ← client-side routing
    <AuthProvider>         ← current-user context
      <App />
```

It also imports the global stylesheets: `bootstrap/dist/css/bootstrap.min.css` and
`./styles/theme.css` (custom Milano-metro-styled theme).

### 5.2 Routing & Route Guard

**`src/App.jsx`** renders the `NavBar` and the route table inside a Bootstrap
`Container`:

| Path | Element | Protected? |
| --- | --- | --- |
| `/` | `Instructions` | no |
| `/login` | `LoginForm` | no |
| `/play` | `RequireAuth → PlayPage` | **yes** |
| `/ranking` | `RequireAuth → Ranking` | **yes** |
| `*` | redirect to `/` | — |

**`RequireAuth({ children })`** (exported from `App.jsx`): reads `{ user, loading }`
from `useAuth`. While `loading` it shows a spinner; if there is no `user` it
`<Navigate>`s to `/login`; otherwise it renders `children`. This prevents a flash
of protected content before the session check resolves.

### 5.3 Authentication Context

Split into two files so the provider component can satisfy React Fast Refresh
(a module that exports a component should not also export hooks/context):

**`src/contexts/auth-context.js`** (non-component module):
- `AuthContext` — `createContext(null)`.
- `useAuth()` — `useContext` wrapper that throws `"useAuth must be used within
  AuthProvider"` if used outside the provider. Returns `{ user, loading, login,
  logout }`.

**`src/contexts/AuthContext.jsx`** — `AuthProvider({ children })`:
- State: `user` (object or `null`), `loading` (bool, starts `true`).
- On mount: calls `API.getCurrentUser()` to restore an existing session; sets
  `user` on success, `null` on failure, and `loading=false` in `finally`.
- `login(username, password)`: calls `API.login`, stores the returned user, returns
  it (so the caller can navigate).
- `logout()`: calls `API.logout`, clears `user`.
- Provides `{ user, loading, login, logout }`.

### 5.4 API Client (`api/API.js`)

A small fetch wrapper. `BASE = "http://localhost:3001"`. Every call sends
`credentials: "include"` so the session cookie is attached.

**`handle(res)`** — shared response parser:
- If `!res.ok`, try to read `{ error }` from the JSON body and `throw new
  Error(message)` (falls back to `"Request failed"`).
- `204 No Content` → `null`.
- Otherwise parse the text as JSON (empty body → `null`).

**`opts(method, body)`** — builds the fetch init: sets `method`, `credentials:
"include"`, and (only when there is a body) the `Content-Type: application/json`
header and a `JSON.stringify`-ed body.

**Methods (each returns a Promise that resolves to the parsed DTO or throws):**

| Method | HTTP call | Request | Resolves to |
| --- | --- | --- | --- |
| `login(username, password)` | `POST /api/sessions` | `{username, password}` | `{id, username, name}` |
| `logout()` | `DELETE /api/sessions/current` | — | `null` |
| `getCurrentUser()` | `GET /api/sessions/current` | — | `{id, username, name}` (or throws 401) |
| `getNetwork()` | `GET /api/network` | — | `{stations, lines, segments}` |
| `startGame()` | `POST /api/games` | — | planning payload (see 4.7) |
| `submitRoute(gameId, route)` | `POST /api/games/:id/route` | `{route:[ids]}` | result DTO (see 4.7) |
| `getRanking()` | `GET /api/ranking` | — | `[{name, bestScore}]` |

### 5.5 Pages

#### `pages/Instructions.jsx`
Static rules/home screen explaining the game. No data fetching.

#### `pages/LoginForm.jsx`
Controlled form (`username`, `password`, `error` state). On submit: prevents
default, trims/validates locally (both fields required), calls `login()` from the
auth context, and on success `navigate("/play")`. Errors thrown by the API are
shown in a Bootstrap `Alert`. Inputs use proper `autoComplete` attributes.

#### `pages/PlayPage.jsx` — the game host
Owns the **phase state machine** and the game/result data:
- State: `phase` (`"setup" | "planning" | "execution" | "result"`), `game`,
  `result`, `error`.
- `startPlanning()`: `API.startGame()` → store `game`, go to `planning`.
- `submitRoute(route)`: `API.submitRoute(game.gameId, route)` → store `result`, go
  to `execution`.
- `restart()`: clear everything, back to `setup`.
- Renders exactly one child per phase (guarding on the presence of `game`/`result`):
  `SetupView` → `PlanningView` → `ExecutionView` → `ResultView`. Any error replaces
  the view with a dismissible `Alert`.

#### `pages/Ranking.jsx`
Fetches `API.getRanking()` in an effect keyed by `location.key` (re-fetches each
time the user navigates to the page). Uses an `active` flag in the effect cleanup
to ignore late responses after unmount. Shows a spinner while loading, an alert on
error, and a table otherwise; positions 1–3 get `gold`/`silver`/`bronze` styling
via the `MEDAL` lookup.

### 5.6 Components

#### `components/NavBar.jsx`
Top navigation. Shows links and a login/logout control driven by the auth context.

#### `components/SetupView.jsx`
Props: `{ onReady }`. Fetches the full network (`API.getNetwork`) on mount
(`active`-flag guarded), shows a colour-coded line legend (`PILL` maps line name →
CSS class) and a `NetworkMap` **with lines visible** (`showLines`). The
"I'm ready — start planning" button calls `onReady(network)` to begin the game.

#### `components/PlanningView.jsx`
Props: `{ game, onSubmit }`. The heart of the planning phase.
- `stationsById` — `{id → station}` lookup built from `game.stations`.
- State `picks` — the **ordered list of chosen segment objects** (`{from, to}`).
- Derived `route` (`useMemo` over `picks`): converts the chosen segments into an
  ordered **station-id array**. It orients the first segment so the start station
  leads (when the start is part of it) and then chains each subsequent segment onto
  the last station — forward (`seg.from === last`), reversed (`seg.to === last`),
  or, if it connects to neither, appends both ids as a "disconnected jump" (allowed
  on the client; the server will mark such a route invalid). This deliberately lets
  the player build *any* route so the server remains the sole judge.
- Derived `usedKeys` (`useMemo`) — `Set` of canonical segment keys already picked,
  so the list can disable them (each segment usable once).
- `pickSegment(seg)` appends; `undo()` removes the last; `submit()` (memoized) calls
  `onSubmit(route)`.
- Layout: header with `CountdownTimer seconds={90}` whose `onExpire` is `submit`
  (auto-submits whatever exists when time runs out), a start→arrival/coins banner,
  the `NetworkMap` (start/dest highlighted, **no lines** — matches the server hiding
  line info), and two columns: `SegmentList` (pick) and `RouteBuilder` (review).

#### `components/SegmentList.jsx`
Props: `{ segments, stationsById, usedKeys, onPick }`. Scrollable Bootstrap
`ListGroup` of `"<from> — <to>"` rows. A row whose canonical key is in `usedKeys`
is `disabled`; clicking an enabled row calls `onPick(seg)`.

#### `components/RouteBuilder.jsx`
Props: `{ route, stationsById, startId, destId, onUndo, onSubmit }`. Shows the
current route as a numbered list (start row styled success, dest row styled danger)
or a hint to pick a starting segment when empty. Computes `complete = route.length
≥ 2 && route[0]===startId && last===destId` to append a "✓" to the Submit button
(purely cosmetic; the server still validates). Buttons: **Undo** (disabled when
empty) and **Submit route**.

#### `components/NetworkMap.jsx`
Props: `{ stations, lines=[], showLines=false, highlight={} }`. Pure SVG
(`viewBox 0 0 1000 700`) Beck/Noorda-style schematic map.
- `byId` lookup; `stationColors` maps each station id → array of its lines' colours
  (length > 1 ⇒ interchange, drawn as a larger ringed circle).
- When `showLines`, draws each line's consecutive segments twice: a thick white
  "casing" underneath and the coloured line on top (so crossings read cleanly).
- Stations render as circles whose radius/fill/stroke depend on role: normal,
  interchange (bigger, dark ring), **start** (green, "START" tag) and **dest** (red,
  "ARRIVAL" tag) from `highlight`. Labels are uppercased station names.
- Used two ways: in `SetupView` with `showLines` (study the map) and in
  `PlanningView` with only `highlight` (lines hidden).

#### `components/CountdownTimer.jsx`
Props: `{ seconds, onExpire }`. Counts down once per second from `seconds`.
- Keeps the **latest `onExpire` in a ref** (`onExpireRef`) updated by an effect, so
  the interval effect can mount once (`deps []`) and is *not* torn down/recreated
  every time the parent passes a new `onExpire` identity (which happens on every
  pick). This prevents the 1-second tick from resetting mid-countdown.
- `expiredRef` guarantees `onExpire` fires exactly once. At `remaining ≤ 1` it
  clears the interval, fires `onExpire`, and shows `0`.
- Badge colour shifts info → warning (≤30s) → danger (≤15s).

#### `components/ExecutionView.jsx`
Props: `{ result, onDone }`. Animated playback of the journey.
- If `!result.valid`, shows a red "invalid/incomplete (time ran out?)" alert and a
  "See result" button → `onDone`.
- Otherwise reveals steps one at a time: a `setTimeout` (1150 ms) increments
  `shown` until all steps are visible; each visible step shows
  `from → to`, the event description, and a coloured `effect → coinsAfter` badge.
  The coin counter shows the running total (`coinsAfter` of the last shown step, or
  20 before any). When all steps are shown, a "See final result" button → `onDone`.

#### `components/ResultView.jsx`
Props: `{ result, onPlayAgain }`. A "ticket"-styled card showing `finalScore`
("coins remaining"), a note if the route was invalid (scored 0), and two buttons:
**Play again** (→ `onPlayAgain`, resets `PlayPage`) and **View ranking** (link to
`/ranking`).

### 5.7 Game Phase State Machine

`PlayPage` drives the whole game with a single `phase` variable:

```
 setup ──onReady──► planning ──onSubmit/timer──► execution ──onDone──► result
   ▲                                                                     │
   └──────────────────────── onPlayAgain (restart) ─────────────────────┘
```

| Phase | Component | Server call on entry | Transitions out |
| --- | --- | --- | --- |
| `setup` | `SetupView` | `GET /api/network` | `onReady` → `planning` |
| `planning` | `PlanningView` | `POST /api/games` already done on `startPlanning` | `onSubmit` (or timer expiry) → `execution` |
| `execution` | `ExecutionView` | `POST /api/games/:id/route` already done on `submitRoute` | `onDone` → `result` |
| `result` | `ResultView` | — | `onPlayAgain` → `setup` |

(`POST /api/games` is actually fired by `startPlanning` *as* the app moves into
`planning`, and `POST .../route` by `submitRoute` *as* it moves into `execution`.)

### 5.8 Client-Side Data Structures

| Structure | Where | Shape | Purpose |
| --- | --- | --- | --- |
| `picks` | `PlanningView` | `Array<{from, to}>` | ordered chosen segments |
| `route` | `PlanningView` (derived) | `Array<stationId>` | station path sent to the server |
| `usedKeys` | `PlanningView` (derived) | `Set<"a-b">` | disable already-picked segments |
| `stationsById` / `byId` | several | `{ [id]: station }` | O(1) id → station lookup |
| `stationColors` | `NetworkMap` | `{ [id]: color[] }` | detect interchanges, colour nodes |
| `MEDAL` / `PILL` | Ranking / SetupView | lookup arrays/maps | rank medals, line CSS classes |

---

## 6. End-to-End Data Flow

A full play-through, tying both tiers together:

1. **Login.** `LoginForm` → `API.login` → `POST /api/sessions` → passport verifies
   with scrypt → session cookie set → `AuthProvider.user` populated → navigate to
   `/play`.
2. **Setup.** `SetupView` mounts → `API.getNetwork` → `GET /api/network` →
   `{stations, lines, segments}` → SVG map with lines drawn. Player clicks "ready".
3. **Start.** `PlayPage.startPlanning` → `API.startGame` → `POST /api/games` →
   server picks start/dest (distance ≥ 3), creates a `pending` game, returns
   `{gameId, coins:20, start, dest, stations, segments(shuffled)}` — **no lines**.
4. **Plan.** `PlanningView` shows the map (lines hidden) and a shuffled segment
   list. Each pick updates `picks`; `route` is re-derived. The 90 s `CountdownTimer`
   ticks; on submit or expiry, `route` (station-id array) is sent.
5. **Submit.** `API.submitRoute(gameId, route)` → `POST /api/games/:id/route`.
   Server checks existence/ownership/deadline, runs `isValidRoute`, and on success
   draws one weighted event per hop (`applyRoute` from 20 coins), persists the game
   + per-hop `game_segments`, and returns the name-enriched journey + `finalScore`.
6. **Execution.** `ExecutionView` reveals each hop's event and running coin total in
   sequence (or an "invalid/expired" message).
7. **Result.** `ResultView` shows `finalScore`. "Play again" restarts; "View
   ranking" → `Ranking` → `API.getRanking` → `GET /api/ranking` →
   `[{name, bestScore}]` leaderboard.

---

## 7. DTO Reference (Quick Table)

| Endpoint | Method | Auth | Request body | Success body |
| --- | --- | --- | --- | --- |
| `/api/sessions` | POST | — | `{username, password}` | `{id, username, name}` |
| `/api/sessions/current` | GET | cookie | — | `{id, username, name}` |
| `/api/sessions/current` | DELETE | cookie | — | *(empty)* |
| `/api/network` | GET | cookie | — | `{stations[], lines[], segments[]}` |
| `/api/games` | POST | cookie | — | `{gameId, coins, start, dest, stations[], segments[]}` |
| `/api/games/:id/route` | POST | cookie | `{route:[ids]}` | `{valid, expired, finalScore, steps[]}` |
| `/api/ranking` | GET | cookie | — | `[{name, bestScore}]` |

**Common error bodies:** `422 {error:"Invalid input"}`, `401 {error:"..."}`,
`403 {error:"Not your game"}`, `404 {error:"Game not found or already completed"}`,
`500 {error:"Internal Server Error"}`.

**Nested DTO shapes:**

```
station        := { id, name, x, y }
line           := { id, name, color, stations:[stationId] }
segment        := { from:stationId, to:stationId }
start / dest   := { id, name }
result.step    := { from:{id,name}, to:{id,name},
                    event:{description, effect}, coinsAfter }
ranking.row    := { name, bestScore }
```

---

*Generated as project documentation. Nothing in the repository was modified or
committed to produce this file.*