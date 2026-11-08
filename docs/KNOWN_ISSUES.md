# Known issues

Found while reviewing the code (November 2026). Most of them aren't fixed yet. Backend issues are in the backend's [docs/KNOWN_ISSUES.md](https://github.com/armandosneto/gatez-backend/blob/master/docs/KNOWN_ISSUES.md).

## Bugs

| # | Where | Problem |
| - | ----- | ------- |
| 1 | `savegame/puzzle_serializer.js:54` | `expectedSignals.map(it => it.getAsCopyableKey())` crashes on `null` ("don't care", `x`) entries. The acceptor editor accepts `x`, so a puzzle using don't-care outputs can't be submitted. |
| 2 | `game/hud/parts/puzzle_play_metadata.js:52` | `puzzle.meta.description.trim()` crashes when `description` is missing. |
| 3 | `game/hud/parts/puzzle_play_metadata.js:~56` | The description is inserted into `innerHTML` unescaped. For community puzzles this is an **XSS** vector. Escape the text, or allow only `<br>`. |
| 4 | `game/systems/edge_detector.js:35` | The "Flip-Flop hack" uses one `framesCount` for the whole system and `return`s instead of `continue`. With several edge detectors, the later ones are skipped on alternate ticks and the counter advances once per entity. |
| 5 | `game/hud/parts/building_placer.js:~249` | The variant-lock guard compares the **global** `lockedVariants.length` with one building's variant count. Once variants are locked on several buildings, it either refuses valid locks or lets you lock every variant of a building. |
| 6 | `game/hud/parts/puzzle_complete_notification.js:~169` | `<component-count>` is replaced inside the already-rendered `innerHTML`, so a second completion in the same session shows the old number. There is also a leftover `console.log` at `:46`. |
| 7 | `platform/offlineFallback/officialLevelsDownload.json` | Has 22 levels; the backend has 26. Missing: the four "using NANDs/NORs" levels. |
| 8 | `states/main_menu.js` (log off) | Removes the token but not `localStorage["trophies"]`, so the next account briefly shows the previous user's trophies. |
| 9 | `states/main_menu.js:~399` | After creating an account, it waits 500 ms with `setTimeout` before logging in, and uses `alert()`. |
| 10 | `src/css/resources.scss` | The edge detector override uses `url("../building_tutorials/...")` instead of `uiResource(...)`, which may break outside dev builds. |
| 11 | `gulp/html.js:235-262` | The staging, prod and standalone HTML tasks return nothing, so production builds are broken. |

## Art that is still a placeholder

| Building | Problem |
| -------- | ------- |
| Programmable signal | Sprite, blueprint and icon are the lever's; the tutorial image is the constant signal's. |
| Programmable acceptor | Every image is the display's. |
| 4-input AND/OR | Both variants use the same sprite; the blueprint is upstream's `painter-quad.png`. |
| Memory — SR latch | Identical to the JK flip-flop sprite. |
| Logic gate — NOR | The tutorial image is identical to the 4-input OR's. |
| Puzzle icon | A random shapez shape (`shortKey`). |

## Text

-   English typos in `translations/base-en.yaml`: "boleans", "leff", "list os signals", and the `mainMenu.crateAccount` key (used by `main_menu.js`).
-   `backendErrors` in `base-en.yaml` still describes upstream errors and points to support@shapez.io.
-   The `cant-pay` CSS class in `states/puzzle_menu.js` (should be `cant-play`).
-   `base-pt-BR.yaml` is missing `keybindings.mappings.four_input_logic_gate`, `programmable_signal` and `programmable_acceptor`.
