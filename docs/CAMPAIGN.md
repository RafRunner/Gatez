# Campaign plan (proposal)

> Status: **validated plan, levels not built yet** (November 2026). Nothing here is implemented yet; levels are built in the puzzle editor and placed with `PUT /v1/moderation/official/:id { position }`.

## Principles

1. **Start from NAND.** After a 3-level introduction, the player only has NAND. Every gate is built from it.
2. **Build it, then use it.** When a level asks you to build a component, that component (as a ready-made building) is unlocked from the next level on. Each level's locks (`excludedBuildings` / `excludedBuildingsVariations`) = everything not yet unlocked + the component being built in that level.
3. **One new idea per level.** The description explains the concept; the truth table is the spec.
4. **Short descriptions** (2–4 sentences, the side panel scrolls but shouldn't need to).
5. **Score = components used** against the author's solution. Optional later: count NANDs (`minimumNands` already exists in the database) for an optimization score.

Legend: **In/Out** = number of programmable signals / acceptors, **Rows** = truth table rows, **Min** = estimated components of a reference solution (to be confirmed when building the level), **Unlocks** = building available from the next level. "Existing #n" = adapt the current official level n instead of starting from scratch.

---

## Chapter 0 — First steps

| # | Title | In/Out | Rows | Min | Allowed | Unlocks | Source |
| - | ----- | ------ | ---- | --- | ------- | ------- | ------ |
| 1 | Welcome | 1/1 | 2 | 0 | wire | — | existing #1 |
| 2 | Crossing paths | 2/2 | 4 | 0 | wire, wire tunnel | wire tunnel | new |
| 3 | The NAND gate | 2/1 | 4 | 1 | wire, tunnel, NAND | NAND | new |

**1. Welcome** — *Every puzzle is a truth table: the inputs on the left, the outputs you must produce on the right. Connect input A to output Y with a wire (key 1) and press Test. Click an input to flip it and test by hand.*

**2. Crossing paths** — *Sometimes wires have to cross. A wire tunnel (key 2) lets a signal pass under another one. Send A to Y2 and B to Y1.*

**3. The NAND gate** — *A logic gate turns inputs into an output. NAND outputs 0 only when both inputs are 1. It doesn't look like much, but it's the only gate you'll get: every other circuit in this game, up to memory, can be built from NANDs.*

## Chapter 1 — Logic from NAND

| # | Title | In/Out | Rows | Min | Allowed (besides wires) | Unlocks | Source |
| - | ----- | ------ | ---- | --- | ----------------------- | ------- | ------ |
| 4 | NOT | 1/1 | 2 | 1 | NAND | NOT | existing #8 (NOT using a NAND) |
| 5 | AND | 2/1 | 4 | 2 | NAND, NOT | AND | existing #9 (AND with NANDs) |
| 6 | OR | 2/1 | 4 | 3 | NAND, NOT, AND | OR | existing #10 (OR using NANDs) |
| 7 | NOR | 2/1 | 4 | 2 | NAND, NOT, AND, OR | NOR | existing #6 |
| 8 | XOR | 2/1 | 4 | 4 | NAND, NOT, AND, OR, NOR | XOR | existing #7 |
| 9 | Are they equal? | 2/1 | 4 | 2 | all gates | — | new |
| 10 | Universal NOR (bonus) | 2/1 | 4 | 4 | NOR only | — | existing #11 (NAND using NORs) |

**4. NOT** — *An inverter outputs the opposite of its input. Build one using a single NAND: what happens when both of its inputs receive the same signal?*

**5. AND** — *AND outputs 1 only when both inputs are 1. That's exactly a NAND with its output inverted, and you just built an inverter.*

**6. OR** — *OR outputs 1 when at least one input is 1. Tip: an OR is a NAND whose inputs were inverted first (this is one of De Morgan's laws).*

**7. NOR** — *NOR is the opposite of OR: 1 only when both inputs are 0. Like NAND, it is universal: any circuit could be built from NORs alone.*

**8. XOR** — *XOR (exclusive or) outputs 1 when the inputs are different. It will be essential to add numbers. It can be done with 4 NANDs; can you find that solution?*

**9. Are they equal?** — *Output 1 when A and B are equal. Comparing bits is how a computer checks whether two numbers are the same.*

**10. Universal NOR (bonus)** — *NAND isn't the only universal gate. Using only NOR gates, build a NAND.*

## Chapter 2 — Bigger gates

| # | Title | In/Out | Rows | Min | Allowed | Unlocks | Source |
| - | ----- | ------ | ---- | --- | ------- | ------- | ------ |
| 11 | Wide gates | 4/2 | 16 | 6 | all 2-input gates | 4-input AND and OR | new (merges existing #12/#13) |
| 12 | Majority vote | 3/1 | 8 | 5 | + 4-input gates | — | existing #14 (Two or more) |
| 13 | Odd or even | 4/1 | 16 | 3 | all gates | — | existing #15 (Odd detector) |
| 14 | Same number? | 4/1 | 16 | 3 | all gates | — | new |

**11. Wide gates** — *Gates can have more than two inputs. Y1 must be 1 only when all four inputs are 1, and Y2 when at least one is. Chain 2-input gates to build them. After this level you get 4-input versions.*

**12. Majority vote** — *Three judges vote yes (1) or no (0). The output is 1 when at least two of them vote yes.*

**13. Odd or even** — *Output 1 when an odd number of inputs are 1. This is called a parity bit, and it's used to detect transmission errors.*

**14. Same number?** — *Inputs A B and C D are two 2-bit numbers. Output 1 when they are equal. Each bit must match its pair.*

## Chapter 3 — Choosing and routing

| # | Title | In/Out | Rows | Min | Allowed | Unlocks | Source |
| - | ----- | ------ | ---- | --- | ------- | ------- | ------ |
| 15 | Decoder | 2/4 | 4 | 6 | all gates | — | existing #18 (Binary decoder) |
| 16 | Encoder | 4/2 | 4 | 2 | all gates | — | existing #17 (Binary encoder), trimmed to the 4 valid one-hot rows |
| 17 | Selector | 3/1 | 8 | 4 | all gates | multiplexer | existing #22 (Multiplexer) |
| 18 | Router | 2/2 | 4 | 3 | all gates + multiplexer | demultiplexer | existing #23 (Demultiplexer) |

**15. Decoder** — *A 2-bit number can be 0, 1, 2 or 3. Turn on only the output matching the number formed by A and B. Decoders are how a computer picks which memory cell to use.*

**16. Encoder** — *The opposite of the decoder: exactly one input is on; output its position as a 2-bit number.*

**17. Selector** — *A multiplexer picks one of two inputs: when S is 1 the output follows A, otherwise it follows B. It's how computers choose between data sources.*

**18. Router** — *A demultiplexer sends one input to one of two outputs, chosen by S. The other output stays 0.*

## Chapter 4 — Arithmetic

| # | Title | In/Out | Rows | Min | Allowed | Unlocks | Source |
| - | ----- | ------ | ---- | --- | ------- | ------- | ------ |
| 19 | Half adder | 2/2 | 4 | 2 | all gates | half adder | existing #19 |
| 20 | Full adder | 3/2 | 8 | 3 | all gates + half adder | full adder | existing #20 (Complete adder) |
| 21 | Adding numbers | 6/4 | 7 | 3 | full adder only | — | existing #21 (Multi bit adder) |
| 22 | Plus one | 3/3 | 8 | 3 | gates + adders | — | new |
| 23 | Negative numbers | 4/3 | 16 | 4 | gates + adders | — | new |

**19. Half adder** — *In binary, 1 + 1 = 10. Add A and B: Y1 is the sum bit and Y2 the carry to the next column.*

**20. Full adder** — *To add numbers with many bits, each column must also add the carry from the previous one. Add A, B and the carry C. Two half adders and one gate are enough.*

**21. Adding numbers** — *Chain full adders to add two 3-bit numbers. The carry of each column goes into the next one: that's exactly how you add by hand.*

**22. Plus one** — *Add 1 to the 3-bit number A B C. Counting is just adding one, again and again.*

**23. Negative numbers** — *Computers subtract by adding: A − B = A + (NOT B) + 1. This is called two's complement. Subtract the 2-bit number C D from A B.*

## Chapter 5 — Memory

In these levels the rows are applied **in order**, and the circuit must remember the previous ones.

| # | Title | In/Out | Rows | Min | Allowed | Unlocks | Source |
| - | ----- | ------ | ---- | --- | ------- | ------- | ------ |
| 24 | Remembering a bit | 2/2 | 8 | 2 | gates | SR latch | existing #24 (SR Latch) |
| 25 | Writing on command | 2/1 | 8 | 4 | gates + SR latch | D latch | existing #25 (D Latch) |
| 26 | Catch the edge | 2/1 | 8 | 2 | gates + latches + edge detector | edge detector | new |
| 27 | JK flip-flop | 3/2 | 6 | 3 | gates + latches + edge detector | JK flip-flop | existing #26 (JK Flip Flop) |
| 28 | Toggle | 1/1 | 8 | 1 | gates + memory | T flip-flop | new |
| 29 | Register | 3/2 | 8 | 2 | gates + memory | — | new |
| 30 | Counter | 1/2 | 8 | 3 | gates + memory | — | new |

**24. Remembering a bit** — *Two NOR gates feeding each other can hold a value. S (set) stores a 1, R (reset) stores a 0, and with both off the circuit keeps what it had. This is the simplest memory there is.*

**25. Writing on command** — *A D latch copies D to the output only while E (enable) is 1; otherwise it keeps the stored value.*

**26. Catch the edge** — *Processors don't react to a signal being on, but to the instant it turns on: the rising edge. The edge detector produces a very short pulse at that moment, too short to see on its own. Turn Y on when A goes from 0 to 1 and keep it on until R resets it. Careful: holding A on is not a new edge.*

> Design note: the pulse lasts 2 ticks, so the truth table can't observe it directly; latching it (edge detector → SR latch) makes it checkable. Rows (A, R → Y): 0 0 → 0 · 1 0 → 1 · 1 1 → 0 · **1 0 → 0** (A held, no new edge; a plain SR latch with S = A fails here) · 0 0 → 0 · 1 0 → 1 · 0 0 → 1 · 0 1 → 0.

**27. JK flip-flop** — *A flip-flop changes only on the clock edge. J sets, K resets, and both together toggle the output, but only when the clock C goes from 0 to 1.*

**28. Toggle** — *A T flip-flop inverts its output on every rising edge of its input. Build one from what you have.*

**29. Register** — *A register stores several bits at once. Store D0 and D1 when W is 1, and keep them otherwise.*

**30. Counter** — *Each pulse on the input must add 1 to a 2-bit number. Tip: each bit toggles when the previous one goes from 1 back to 0.*

## Chapter 6 — Towards the CPU (needs new components)

Not buildable yet; listed to guide what the engine needs next.

| Idea | Needs |
| ---- | ----- |
| 1-bit ALU (choose AND / OR / ADD with 2 select bits) | nothing new (could be level 29) |
| 4-bit ALU | multi-bit wires or buses, larger zones |
| Register file / RAM | 4-bit register building, address decoding |
| ROM and program counter | ROM building (editable contents), clock component |
| 4-bit CPU | all of the above |

## Changes to current levels

| Current level | Fate |
| ------------- | ---- |
| #2 NOT gate, #3 AND gate, #4 OR gate, #5 NAND gate | removed (replaced by chapter 1, built from NAND) |
| #11 NAND using NORs | kept as level 10, "Universal NOR (bonus)" |
| #12 Three input AND, #13 Three input OR | merged into #11 Wide gates |
| #16 Zero detector | removed (trivial with 4-input gates) |
| others | reused, with new titles/descriptions and updated locks |

## Decisions

-   "Universal NOR" stays, as a bonus level after "Are they equal?" (level 10).
-   4-input gates count as 1 component (current behaviour).
-   The edge detector gets its own level ("Catch the edge") before the JK flip-flop.

## Open questions

1. Chapter 6 needs engine work (multi-bit buses, ROM/RAM, clock); decide its scope before building chapter 5's last levels.
