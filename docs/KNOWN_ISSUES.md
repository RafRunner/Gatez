# Known issues

Found while reviewing the code (November 2026). Backend issues are in the backend's [docs/KNOWN_ISSUES.md](https://github.com/armandosneto/gatez-backend/blob/main/docs/KNOWN_ISSUES.md).

## Open bugs

| # | Where | Problem |
| - | ----- | ------- |
| 6 | `game/hud/parts/puzzle_complete_notification.js:~169` | `<component-count>` is replaced inside the already-rendered `innerHTML`, so a second completion in the same session shows the old number. There is also a leftover `console.log` at `:46`. |
| 8 | `states/main_menu.js` (log off) | Removes the token but not `localStorage["trophies"]`, so the next account briefly shows the previous user's trophies. |
| 9 | `states/main_menu.js:~399` | After creating an account, it waits 500 ms with `setTimeout` before logging in, and uses `alert()`. |
| 10 | `src/css/resources.scss` | The edge detector override uses `url("../building_tutorials/...")` instead of `uiResource(...)`, which may break outside dev builds. |
| 11 | `gulp/html.js:235-262` | The staging, prod and standalone HTML tasks return nothing, so production builds are broken. |

## Fixed (November 2026)

-   Puzzles with "don't care" (`x`) outputs couldn't be submitted: the serializer crashed on `null` (`puzzle_serializer.js`).
-   The play screen crashed when a puzzle had no description.
-   Puzzle descriptions were inserted into `innerHTML` unescaped (XSS). They now go through `formatUserTextAsHTML` (`core/utils.js`), which escapes everything and keeps only line breaks (`\n` and `<br>`).
-   Edge detector timing hack: the shared counter advanced once per entity and used `return`, so with several detectors some were skipped. The counter now advances once per tick, and all detectors update together every `outputFrames` ticks. A single detector behaves exactly as before.
-   The variant-lock guard counted locked variants of **all** buildings. It now counts only the clicked building's, and no longer switches the selected variant when a lock is refused.
-   The offline levels file had 22 outdated levels. It now has all 26, regenerated from the backend's default database with `officialSnapshot`, which also brings the newer variant locks (e.g. XOR is locked in the XOR level).

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
