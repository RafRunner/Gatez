# Gatez

**Gatez** is a puzzle game for learning how a computer works at the lowest level. You build digital circuits out of logic gates to match a truth table, starting from a single NOT gate and working up through adders, multiplexers, latches and flip-flops. The long-term goal is a simple 4-bit CPU.

It is a fork of [shapez.io](https://github.com/tobspr/shapez.io) by tobspr Games. It reuses the engine and the puzzle DLC, but the puzzles are built with logic circuits instead of shapes. It started as an undergraduate thesis (TCC) project.

-   **Back-end:** [armandosneto/gatez-backend](https://github.com/armandosneto/gatez-backend) (accounts, community puzzles, progress, translations). It isn't hosted anywhere yet, so to play online you have to run your own instance.
-   **Languages:** English and Brazilian Portuguese are complete.

## How it plays

Each puzzle gives you **programmable signals** (inputs) and **programmable acceptors** (expected outputs), each with one value per row of a truth table. You wire gates between them, then press **Test**. The game feeds each row through your circuit and checks every output. Because the check runs the real simulation, sequential puzzles (latches, flip-flops) work too.

You score by solving with as few components as possible. You can like a puzzle, rate its difficulty, earn trophies, and make your own puzzles in the editor and share them.

**Available components:** wires and tunnels; AND, NAND, OR, NOR, NOT and XOR gates; 4-input AND/OR; half and full adders; multiplexer and demultiplexer; rising/falling/change edge detectors; SR latch, D latch, JK and T flip-flops. See [docs/COMPONENTS.md](docs/COMPONENTS.md).

**Campaign (26 levels):** Welcome → NOT → AND → OR → NAND → NOR → XOR → NOT/AND/OR from NANDs → NAND from NORs → 3-input AND/OR → Two or more → Odd detector → Zero detector → Binary encoder/decoder → Half adder → Full adder → Multi-bit adder → Multiplexer → Demultiplexer → SR latch → D latch → JK flip-flop.

## Quick start

Requirements: **Node.js 16**, Yarn 1, Java and ffmpeg.

```bash
yarn
cd gulp && yarn && yarn gulp     # opens http://localhost:3005
```

Choose **Play offline** to play the official levels without a server. To create an account and use the community features, run the [back-end](https://github.com/armandosneto/gatez-backend) on port 15001.

Full instructions: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Documentation

| Document | Contents |
| -------- | -------- |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Setup, running with the back-end, scripts, build status |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the code is organized, what changed from shapez, the back-end client |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | Every component: pins, behaviour, art status, how to add a new one |
| [docs/PUZZLES.md](docs/PUZZLES.md) | Puzzle format, how solutions are checked, editor and play flows |
| [docs/CAMPAIGN.md](docs/CAMPAIGN.md) | Plan for the official campaign: 30 levels, from NAND to counters |
| [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) | Known bugs, placeholder art, text issues |
| [docs/ENGINE.md](docs/ENGINE.md) | Upstream shapez engine guide (adding components/buildings/systems) |
| [translations/](translations/) | How translations work |

## Roadmap

Roughly in order of priority:

-   [ ] Fix the remaining bugs in [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md);
-   [ ] Update the build to a current Node.js LTS (currently requires Node 16);
-   [x] ~~Multi-language puzzle titles and descriptions~~ (the back-end and the "Suggest translation" dialog are done; a moderation UI is still missing);
-   [x] ~~Multi-line text box for puzzle descriptions~~;
-   [x] ~~Better input for programmable signal/acceptor values~~ (truth table editor);
-   [x] ~~Truth table as a real table, with input/output labels on the map and test results per row~~;
-   [x] ~~Show the truth table while creating a puzzle~~;
-   [ ] Build the new campaign ([docs/CAMPAIGN.md](docs/CAMPAIGN.md));
-   [ ] Final art for every component (signals, acceptors, 4-input gates and the SR latch are still placeholders);
-   [x] ~~A puzzle icon that fits the theme~~ (a chip with the puzzle's inputs/outputs);
-   [ ] More components (registers, ALU, RAM, ROM) and levels, up to a simple 4-bit CPU and RAM;
-   [ ] Polish the sandbox mode: remove unused mechanics, add a clock component;
-   [ ] Revise the settings menu;
-   [ ] More languages (only English and pt-BR have the Gatez texts);
-   [ ] New main menu background, loading tips (still about shapez), visual identity and logo;
-   [ ] Remove unused upstream code and remaining references to upstream analytics, platforms, e-mails and links;
-   [ ] Make the back-end URL configurable and fix the production build scripts (web and standalone);
-   [ ] Release the game (website or installers) and host the back-end.

Contributions are welcome. Open an issue or a pull request.

## Credits

-   **Gatez:** Rafael Santana, with Armando Soares e Silva Neto (back-end).
-   **shapez.io:** [tobspr Games](https://tobspr.io) and the [shapez.io contributors](https://github.com/tobspr/shapez.io/graphs/contributors). Gatez exists thanks to their open-source game. Please support the original on [Steam](https://get.shapez.io/ghr).
-   The adder, multiplexer, edge detector and memory components are adapted from [SkimnerPhi/wires-plus](https://github.com/SkimnerPhi/wires-plus).

## License

GPL-3.0, like upstream shapez.io. See [LICENSE](LICENSE).
