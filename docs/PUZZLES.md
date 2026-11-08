# Puzzles

A Gatez puzzle is a **truth table**. The author places _programmable signals_ (inputs) and _programmable acceptors_ (expected outputs), each holding one value per row. The player has to build the circuit between them. The game then plays every row through the circuit and checks the outputs.

## Puzzle format

Typedefs in `src/js/savegame/savegame_typedefs.js`; (de)serialization in `src/js/savegame/puzzle_serializer.js`.

```jsonc
// PuzzleGameData — what is stored (compressed) in the backend "data" field
{
    "version": 1,
    "bounds": { "w": 12, "h": 8 },
    "buildings": [
        { "type": "programmableSignal",   "signalList": "0,0,1,1",     "pos": { "x": -3, "y": -1, "r": 0 } },
        { "type": "programmableSignal",   "signalList": "0,1,0,1",     "pos": { "x": -2, "y": -1, "r": 0 } },
        { "type": "programmableAcceptor", "expectedSignals": "0,0,0,1", "pos": { "x": 0,  "y": -4, "r": 0 } },
        { "type": "block", "pos": { "x": 2, "y": 2, "r": 0 } }
    ],
    "excludedBuildings": ["adder"],                  // buildings locked in the toolbar
    "excludedBuildingsVariations": ["logic_gate-xor"] // locked variants, "<id>-<variant>"
}
```

-   Only signals, acceptors and blocks are saved. The author's solution is **not** stored. Only its component count is, as `minimumComponents`.
-   Signal strings: `1`/`true` → 1, `0`/`false` → 0. In acceptors, `x`/`null` → don't care.
-   On the wire to the backend the JSON is compressed with `compressX64` (lz-string) and decompressed on download (`src/js/platform/api.js`).

Metadata (`PuzzleMetadata`) comes from the backend: title, description, author, `minimumComponents`, `maximumComponents`, `difficulty` (`easy`/`medium`/`hard`), likes, completions, `canPlay`, `locale`, and so on. See the backend's [docs/API.md](https://github.com/armandosneto/gatez-backend/blob/main/docs/API.md).

## How a solution is checked

Implemented by `src/js/core/logic_simulation_helper.js`, `ProgrammableSignalSystem` and `ProgrammableAcceptorSystem`. State is on `GameRoot`: `inSimulation`, `validatingSubmit`, `currentSimulationFrame`.

1. Clicking **Test** sets `root.inSimulation = true`.
2. Each truth-table row is a **step** of `FRAMES_PER_STEP = 100` game ticks. Each step gives the gates, adders and latches time to settle; `step = floor(frame / 100)`.
3. During a step every programmable signal outputs `signalList[step]`.
4. On the **last tick of each step** (the sampling frame), every acceptor compares its input with `expectedSignals[step]` and records pass/fail:
    - expected `null` (don't care) → pass;
    - value equals expected → pass;
    - no signal (unpowered wire) and expected 0 → pass;
    - network in conflict, or acceptor not connected → fail.
5. When `step` reaches the length of the lists, the simulation stops and `simulationComplete` fires. `computeSimulationResults` succeeds only if every acceptor passed every row. It then dispatches:
    - `puzzleComplete(ok)` when playing;
    - `puzzleCompleteEdit(ok)` when testing in the editor;
    - `puzzleCompleteSubmit(ok)` when validating before upload.
6. The side panel highlights the row being simulated, then marks each row as passed (green) or failed (red). The failure dialog shows a table with only the failed rows.

**Row and column order:** signals and acceptors are sorted by position, top-to-bottom then left-to-right. That order defines the columns of the truth table shown to the player. Inputs are labelled **A, B, C…** and outputs **Y** (or **Y1, Y2…**). The same labels are drawn as badges on the map (`drawIOLabel` in `logic_simulation_helper.js`), so players can match columns to buildings.

Because the checking runs the real simulation, **sequential puzzles work**: values carry over between rows, which is how the latch and flip-flop levels are built.

### Validation rules (`validatePuzzle`)

-   at least one signal and one acceptor;
-   all signals and acceptors have the **same, non-zero** number of values.

## Editor flow

`modes/puzzle_edit.js`, `hud/parts/puzzle_editor_controls.js` (side panel), `hud/parts/truth_table_editor.js`, `hud/parts/puzzle_editor_settings.js`, `hud/parts/puzzle_editor_review.js`.

1. Resize the zone; place signals (inputs, key H), acceptors (outputs, key N) and blocks. A newly placed input/output gets one `0` per existing row, so all lists always have the same length.
2. Edit the **truth table** from the side panel button, or by clicking any output (clicking an input toggles it, to test by hand). The dialog shows every column at once: click a cell to change it (inputs 0/1, outputs 0/1/– for "don't care"), add or remove rows, or fill the inputs with **all combinations** (up to 8 inputs = 256 rows, the backend limit). The side panel shows the table live.
3. Lock buildings in the toolbar or individual variants (the lock icon on each variant) to forbid them.
4. Build a reference solution and press **Test**. Middle-click an input to toggle it while testing by hand.
5. **Review & submit** re-validates, runs the simulation silently, then asks for:
    - title: 4–30 characters, no surrounding spaces (`puzzleTitleRegex` in `core/config.js`);
    - description: multi-line, up to 1000 characters (Enter adds a line break);
    - optional maximum component count: must be ≥ your solution's count.
6. The puzzle is uploaded with `minimumComponents` = your solution's component count.

### Puzzle icon

The icon in the puzzle list is a chip drawn on a canvas (`src/js/game/puzzle_icon.js`), with one pin per input (blue, left) and output (green, right) and the text `inputs→outputs`. Locked levels show a padlock. The counts are stored in the puzzle's `shortKey` as `io:<inputs>:<outputs>`. The backend derives it from the puzzle data on submit and converts older puzzles (which used a random shapez shape) on startup.

## Play flow

`modes/puzzle_play.js`, `hud/parts/puzzle_play_metadata.js`, `hud/parts/puzzle_complete_notification.js`.

-   Signals, acceptors, blocks, lever and display are hidden from the toolbar, along with anything the author locked.
-   The side panel (a scrollable card, with collapsible sections) shows the author and statistics, the description and the **Expected outputs** truth table.
-   On success the player sees their component count against the author's, can like the puzzle and rate its difficulty. Closing the dialog reports the completion (`POST /v1/puzzles/complete/:id`) and stores the new trophy total.
-   Exceeding `maximumComponents` counts as a failure.
-   When the puzzle's language differs from the game language, a **Suggest translation** button lets the player submit a translated title and description.

## Official levels

The campaign is the list of official puzzles on the backend, unlocked in order (`canPlay`). The backend's default database has **26** levels, from _Welcome_ to _JK Flip Flop_; see the backend's [docs/DATA_MODEL.md](https://github.com/armandosneto/gatez-backend/blob/main/docs/DATA_MODEL.md).

Without an account (the **Play offline** button), the game serves the official levels from `src/js/platform/offlineFallback/officialLevelsDownload.json`, and nothing is tracked. Regenerate it with the admin endpoint `GET /v1/puzzles/officialSnapshot` whenever official levels change. Remove `hiddenAt`/`hiddenById` from each `meta`.
