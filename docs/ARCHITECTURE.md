# Architecture

Gatez is a fork of [shapez.io](https://github.com/tobspr/shapez.io) 1.5.x. It keeps the engine (canvas renderer, entity–component–system, savegames, HUD framework, translations, build pipeline) and replaces the gameplay of the **puzzle mode** with logic circuits. This document describes what Gatez changed. For the engine itself, the upstream code and the "Code" section of the original README still apply.

```
┌──────────────────────── Game (this repo, browser) ────────────────────────┐
│ states/        main_menu → login → puzzle_menu → ingame                   │
│ game/modes/    puzzle_play.js / puzzle_edit.js  (regular.js = "Sandbox")  │
│ game/buildings + components + systems   ← logic gates, adder, memory, ... │
│ core/logic_simulation_helper.js         ← truth-table verification        │
│ savegame/puzzle_serializer.js           ← puzzle <-> JSON                 │
│ platform/api.js  ──── HTTP/JSON, JWT ────┐                                │
│ platform/offlineFallback/*.json (offline official levels)                 │
└──────────────────────────────────────────┼────────────────────────────────┘
                                           ▼
                    gatez-backend (Express + Prisma + SQLite, :15001)
```

## Layers of the code

| Path | What it is |
| ---- | ---------- |
| `src/js/application.js`, `main.js` | Bootstrap. `app.isLoggedIn` holds the current user (or `null`). |
| `src/js/states/` | Screens. `preload.js` validates the saved token, `main_menu.js` handles login/sign-up/offline, `puzzle_menu.js` lists puzzles, `ingame.js` runs a game. |
| `src/js/game/modes/` | Game modes. `puzzle.js` is the shared base, `puzzle_edit.js` the editor, `puzzle_play.js` playing. `regular.js` is upstream's main game, exposed as **Sandbox**. |
| `src/js/game/buildings/`, `components/`, `systems/` | ECS. See [COMPONENTS.md](COMPONENTS.md). |
| `src/js/game/game_system_manager.js` | System list and **update order** (wire → logic gate → adder → multiplexer → edge detector → memory → … → programmable signal → … → programmable acceptor). |
| `src/js/game/hud/parts/` | UI widgets. Gatez added or changed `programmable_*_edit.js`, `programmable_signal_click.js`, `puzzle_editor_*`, `puzzle_play_*`, `puzzle_complete_notification.js`, `building_placer.js` (variant locks). |
| `src/js/core/logic_simulation_helper.js` | Validation, simulation timing, truth-table strings, component counting. See [PUZZLES.md](PUZZLES.md). |
| `src/js/savegame/` | `puzzle_serializer.js` and typedefs for the puzzle format. |
| `src/js/platform/api.js` | Backend client. |
| `translations/` | YAML per language. `base-en.yaml` is the source; only `base-pt-BR.yaml` has the Gatez strings. |
| `res/`, `res_raw/` | UI images and building sprites (packed into an atlas by the gulp build). |

## Main changes from upstream

-   **No wires layer.** Every building is on the `regular` layer, so circuits are built directly on the map.
-   **Puzzle mode rebuilt around truth tables.** Constant producers and goal acceptors were replaced by programmable signals and acceptors, and the goal acceptor's update logic is commented out.
-   **New buildings:** NAND, NOR, 4-input AND/OR, half/full adder, mux/demux, edge detectors, SR/D/JK/T memory.
-   **Per-variant locks** in the editor (`excludedBuildingsVariations`).
-   **Own backend:** accounts, linear campaign, ratings, trophies, translations. Upstream's puzzle API and key-based download are gone; "Load puzzle" takes a numeric id.
-   **Removed:** ads, analytics (Google, GameAnalytics), watermark, "standalone advantages", Discord/Steam promotions, the demo restrictions (`restriction_manager.isLimitedVersion` is always `false`).
-   The main menu has **Puzzle mode** and **Sandbox** (upstream's regular game).

## Backend client (`src/js/platform/api.js`)

-   **Base URL:** `getEndpoint()` returns `http://localhost:15001` in both dev and prod. There is a TODO to make this configurable. `G_API_ENDPOINT` in `gulp/webpack.config.js` is an unused upstream leftover.
-   Every request gets `?locale=<game language>`, `Content-Type: application/json`, and `authorization: Bearer <token>` when logged in. Requests time out after 15 seconds.
-   Errors: the backend returns `{ status, message, error }`. The client shows `T.backendErrors[error]`, falling back to `message`.
-   The token is stored in `localStorage["dev_api_auth_token"]` and the trophy total in `localStorage["trophies"]`. On boot, `preload.js` calls `GET /v1/login`; if that fails, the token is discarded.
-   **Offline:** without a token, `apiListPuzzles("official")` and `apiDownloadPuzzle` read from `offlineFallback/officialLevelsDownload.json`. Every other call rejects with `"not-logged-in"`.

| Client method | Endpoint |
| ------------- | -------- |
| `tryLogin` | `POST /v1/login` |
| `verifyToken` | `GET /v1/login` |
| `createUser` | `POST /v1/user` |
| `apiListPuzzles(category)` | `GET /v1/puzzles/list/:category` |
| `apiSearchPuzzles` | `POST /v1/puzzles/search` |
| `apiDownloadPuzzle(id)` | `GET /v1/puzzles/download/:id` |
| `apiDeletePuzzle(id)` | `DELETE /v1/puzzles/delete/:id` |
| `apiReportPuzzle(id, reason)` | `POST /v1/puzzles/report/:id` |
| `apiCompletePuzzle(id, ...)` | `POST /v1/puzzles/complete/:id` |
| `apiSubmitPuzzle(...)` | `POST /v1/puzzles/submit` |
| `apiSuggestTranslation(id, ...)` | `POST /v1/puzzles/translate/:id` |

## Translations

-   Building text: `buildings.<id>.<variant>.{name, description}`. Keybindings: `keybindings.mappings.<id>`.
-   About 83 keys exist only in Gatez (login, signals/acceptors, submit and translation dialogs, completion dialog, new buildings). `base-pt-BR.yaml` has almost all of them. The other 31 languages have none, so they fall back to English (`src/js/translations.js`).
-   Backend error messages are translated under `backendErrors.<ErrorType>` (several entries still describe upstream errors).

## Upstream code still present

Kept but unused by the puzzle mode, so it can be removed or simplified:

-   the shape gameplay used only by Sandbox: belts, miners, cutters, painters, stackers, hub goals, upgrades, statistics, shop, waypoints, pinned shapes;
-   `wires_toolbar.js`, `wires_overlay.js`, transistor, constant signal, virtual processor, analyzer, comparator;
-   Electron, WeGame and China builds: `electron/`, `electron_wegame/`, `states/wegame_splash.js`, `G_WEGAME_VERSION`/`G_CHINA_VERSION` branches, Steam achievements, `gulp/steampipe*`, itch/steam publish scripts;
-   telemetry remnants: the `window.Sentry` call in `core/error_handler.js`, analytics config keys, and the `logrocket` dependency;
-   `mod_examples/` and the mod loader still work, but the examples are written for shapez.
