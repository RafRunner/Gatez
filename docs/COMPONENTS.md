# Components (buildings)

Everything the player can place in a Gatez puzzle. In shapez terms each one is a **building** (`src/js/game/buildings/`), made of **components** (`src/js/game/components/`) that a **system** (`src/js/game/systems/`) updates every tick.

Signals are shapez `BooleanItem`s (`BOOL_TRUE_SINGLETON` / `BOOL_FALSE_SINGLETON`) travelling through wire networks. A network that has two different values driven onto it is in **conflict**; most Gatez systems output `null` when one of their inputs is in conflict.

> Unlike upstream shapez, Gatez has **no separate wires layer**: every building, wires included, lives on the `regular` layer (commit `f80bffde`).

## Summary

| Building                | Key | Variants (id)                                                     | Size | System                         | Art status |
| ----------------------- | --- | ----------------------------------------------------------------- | ---- | ------------------------------ | ---------- |
| Programmable signal     | H   | — (435)                                                           | 1×1  | `programmable_signal.js`       | ⚠️ lever sprites reused |
| Programmable acceptor   | N   | — (436)                                                           | 1×1  | `programmable_acceptor.js`     | ⚠️ display sprites reused |
| Wire                    | 1   | upstream                                                          | 1×1  | `wire.js`                      | upstream |
| Wire tunnel             | 2   | upstream                                                          | 1×1  | `wire.js`                      | upstream |
| Logic gate              | 3   | AND (32), NAND (420), OR (36), NOR (421), NOT (34), XOR (35)      | 1×1  | `logic_gate.js`                | NAND/NOR new; NOR tutorial reuses the 4-input OR image |
| 4-input logic gate      | 4   | AND (422), OR (423)                                               | 4×1  | `logic_gate.js`                | ⚠️ placeholder: both variants share one sprite, blueprint is upstream's `painter-quad` |
| Adder                   | 6   | half (424), full (425)                                            | 2×1  | `adder.js`                     | own art |
| Multiplexer             | 5   | mux (426), demux (427)                                            | 2×1  | `multiplexer.js`               | own art |
| Edge detector           | 7   | rising (428), falling (429), change (430)                         | 1×1  | `edge_detector.js`             | own art |
| Memory                  | 8   | SR latch (431), D latch (432), JK flip-flop (433), T flip-flop (434) | 2×1 (T: 1×1) | `memory.js`         | ⚠️ SR sprite is identical to JK |
| Block                   | 0   | upstream                                                          | 1×1  | —                              | upstream |
| Lever / Display         | —   | upstream (secondary toolbar)                                      | 1×1  | `lever.js` / `display.js`      | upstream |

Adder, multiplexer, edge detector and memory were originally adapted from [SkimnerPhi/wires-plus](https://github.com/SkimnerPhi/wires-plus) (credited in each file header).

Pin positions below use the building's local tile `(x, y)` with the building facing **up** (rotation 0). "Bottom" pins are inputs coming from below, "top" pins are outputs going up.

## Puzzle I/O

### Programmable signal — the puzzle's inputs

-   One output pin, top.
-   Holds `signalList: BooleanItem[]` (one value per truth-table row) and `toggled: boolean`.
-   **Outside a simulation** it outputs `toggled`, so the player can flip it by clicking and test the circuit by hand.
-   **During a simulation** it outputs `signalList[step]` (see [PUZZLES.md](PUZZLES.md#how-a-solution-is-checked)).
-   It can only be placed or removed in the **editor**. Left-click there opens a dialog that takes a comma-separated list (`1,0,1,1` or `true,false,...`). See `hud/parts/programmable_signal_edit.js`.
-   Clicks (`hud/parts/programmable_signal_click.js`): while playing, left-click toggles. In the editor, **middle-click** toggles. Clicks are ignored while a simulation runs.

### Programmable acceptor — the expected outputs

-   One input pin, bottom.
-   Holds `expectedSignals: (BooleanItem | null)[]`. `null`, typed `x` in the editor, means "don't care".
-   Lights up (white display sprite) while its input is truthy.
-   It can only be placed or removed in the editor.

## Logic

### Logic gate (`logic_gate`)

-   Two-input variants (AND, NAND, OR, NOR, XOR): inputs left and right, output top.
-   NOT: input bottom, output top.
-   NAND and NOR are Gatez additions (`compute_NAND`, `compute_NOR` in `systems/logic_gate.js`).

### 4-input logic gate (`four_input_logic_gate`)

-   4×1. Inputs at the bottom of all four tiles, output at the top of tile `(0,0)`.
-   Reuses `LogicGateComponent` with types `four_input_and` / `four_input_or`.

## Arithmetic and routing

### Adder (`adder`)

-   **Half adder:** inputs at the bottom of `(0,0)` and `(1,0)`. Outputs: **sum** on top of `(1,0)`, **carry** on the left of `(0,0)`.
-   **Full adder:** adds a **carry-in** on the right of `(1,0)`.
-   The system counts the truthy inputs and writes bit 0 to the sum and bit 1 to the carry. A conflict on any input nulls all outputs.

### Multiplexer (`multiplexer`)

-   **Mux:** select on the right of `(1,0)`; data inputs at the bottom of `(0,0)` (chosen when select = 1) and `(1,0)` (chosen when select = 0); output on top of `(1,0)`.
-   **Demux:** select on the right of `(1,0)`; data input at the bottom of `(1,0)`; outputs on top of `(0,0)` (select = 1) and `(1,0)` (select = 0).

## Sequential

### Edge detector (`edge_detector`)

-   Input bottom, output top. Outputs 1 for one update when the input goes 0→1 (rising), 1→0 (falling) or either (change).
-   ⚠️ Contains a timing hack (`systems/edge_detector.js:35`) that only updates every other tick. It was added to make flip-flops easier to build and has side effects with several detectors; see [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

### Memory (`memory`)

The state (`outSignal`, `lastFrameClockSignal`) is saved with the game and cleared when the variant changes.

| Variant | Pins | Behaviour |
| ------- | ---- | --------- |
| SR latch | S bottom `(0,0)`, R bottom `(1,0)`; Q top `(0,0)`, Q̅ top `(1,0)` | Set/reset. S = R = 1 **toggles** (a design choice, not the textbook "forbidden" state). |
| D latch | D left `(0,0)`, enable bottom `(0,0)`; Q right `(1,0)` | Level-triggered: Q follows D while enable = 1. |
| JK flip-flop | J, K bottom; clock right `(1,0)`; Q, Q̅ top | Rising-edge triggered. |
| T flip-flop | T bottom, Q top (1×1) | Toggles on each rising edge of T. |

## Counting components

`LogicSimulationHelper.countComponentsUsed` counts entities that have a `LogicGate`, `Multiplexer`, `Adder`, `EdgeDetector` or `Memory` component. **Wires and tunnels are free.** This number is compared against the puzzle's `minimumComponents` (the author's own solution) and the optional `maximumComponents`.

## Adding a new component

Follow the upstream checklist in the README ("Adding a new building"). For Gatez, also:

1. Register the meta building in `meta_building_registry.js`, the component in `component_registry.js` and `entity_components.js`, and the system in `game_system_manager.js`. **System order matters**: it is the order signals propagate within one tick.
2. Add it to `hud/parts/buildings_toolbar.js` and a key in `key_action_mapper.js` (`KEYMAPPINGS.buildings`).
3. If it should count as a component, add its component class to `countComponentsUsed` in `src/js/core/logic_simulation_helper.js`.
4. Add sprites under `res_raw/sprites/buildings/` and `res_raw/sprites/blueprints/`, an icon in `res/ui/building_icons/`, a tutorial image in `res/ui/building_tutorials/`, and the entries in `src/css/resources.scss`.
5. Add text to `translations/base-en.yaml` and `translations/base-pt-BR.yaml` (`buildings.<id>.<variant>` and `keybindings.mappings.<id>`).
6. If a puzzle author should be able to forbid it, nothing else is needed: the editor toolbar lock and per-variant locks work for any building that isn't in `inRequiredBuildings` (`hud/parts/base_toolbar.js`).
