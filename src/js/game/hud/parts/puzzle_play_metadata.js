/* typehints:start */
import { PuzzlePlayGameMode } from "../../modes/puzzle_play";
/* typehints:end */

import { formatBigNumberFull, formatSeconds, formatUserTextAsHTML, makeDiv } from "../../../core/utils";
import { T } from "../../../translations";
import { BaseHUDPart } from "../base_hud_part";
import {
    buildTruthTableHTML,
    getAllProgrammableAcceptorComponents,
    getCurrentSimulationStep,
} from "../../../core/logic_simulation_helper";
import { ProgrammableSignalComponent } from "../../components/programmable_signal";
import { ProgrammableAcceptorComponent } from "../../components/programmable_acceptor";

export class HUDPuzzlePlayMetadata extends BaseHUDPart {
    createElements(parent) {
        this.titleElement = makeDiv(parent, "ingame_HUD_PuzzlePlayTitle");
        this.titleElement.innerText = "PUZZLE";

        const mode = /** @type {PuzzlePlayGameMode} */ (this.root.gameMode);
        const puzzle = mode.puzzle;

        this.puzzleNameElement = makeDiv(this.titleElement, null, ["name"]);
        this.puzzleNameElement.innerText = puzzle.meta.title;

        const notInPlayerLanguage = puzzle.meta.locale !== this.root.app.settings.getLanguage();

        const description = (puzzle.meta.description || "").trim();

        // Official puzzles have no author and can't be reported (the backend rejects it too)
        const canReport = Boolean(puzzle.meta.author);

        this.element = makeDiv(parent, "ingame_HUD_PuzzlePlayMetadata");
        this.element.innerHTML = `
            <div class="stats">
                <span class="author" title="${T.ingame.puzzleMetadata.author}"></span>
                <span class="downloads">${formatBigNumberFull(puzzle.meta.downloads)}</span>
                <span class="likes">${formatBigNumberFull(puzzle.meta.likes)}</span>
                <span class="duration" title="${T.ingame.puzzleMetadata.averageDuration}">${
            puzzle.meta.averageTime ? formatSeconds(puzzle.meta.averageTime) : "-"
        }</span>
                <span class="completionRate" title="${T.ingame.puzzleMetadata.completionRate}">${
            puzzle.meta.downloads > 0
                ? ((puzzle.meta.completions / puzzle.meta.downloads) * 100.0).toFixed(0) + "%"
                : "-"
        }</span>
            </div>

            ${
                description.length === 0
                    ? ""
                    : `<div class="section level-description">
                <button class="sectionHeader">${T.ingame.puzzleEditorSettings.description}</button>
                <div class="content">${formatUserTextAsHTML(description)}</div>
            </div>`
            }

            <div class="section truth-table">
                <button class="sectionHeader">${T.ingame.puzzleEditorSettings.expectedOutputs}</button>
                <div class="content" id="truth-table-list"></div>
            </div>

            <div class="buttons">
                <button class="styledButton share">${T.ingame.puzzleEditorSettings.share}</button>
                ${
                    notInPlayerLanguage
                        ? `<button class="styledButton suggestTranslation">${T.ingame.puzzleEditorSettings.suggestTranslation}</button>`
                        : ""
                }
                ${
                    canReport
                        ? `<button class="styledButton report">${T.ingame.puzzleEditorSettings.report}</button>`
                        : ""
                }
            </div>
            `;

        // Sections can be collapsed to free up space on small screens
        for (const header of this.element.querySelectorAll(".sectionHeader")) {
            this.trackClicks(/** @type {HTMLElement} */ (header), () =>
                header.parentElement.classList.toggle("collapsed")
            );
        }

        /** @type {number} */
        this.highlightedStep = -1;

        this.trackClicks(this.element.querySelector("button.share"), this.share);
        if (canReport) {
            this.trackClicks(this.element.querySelector("button.report"), this.report);
        }
        if (notInPlayerLanguage) {
            this.trackClicks(
                this.element.querySelector("button.suggestTranslation"),
                this.suggestTranslation
            );
        }

        /** @type {HTMLElement} */ (this.element.querySelector(".stats .author")).innerText =
            puzzle.meta.authorName;

        this.root.signals.populateTruthTableSignal.add(this.populateTruthTable, this);
        this.root.signals.puzzleComplete.add(this.showSimulationResults, this);
    }

    initialize() {}

    share() {
        const mode = /** @type {PuzzlePlayGameMode} */ (this.root.gameMode);
        mode.sharePuzzle();
    }

    report() {
        const mode = /** @type {PuzzlePlayGameMode} */ (this.root.gameMode);
        mode.reportPuzzle();
    }

    suggestTranslation() {
        const mode = /** @type {PuzzlePlayGameMode} */ (this.root.gameMode);
        mode.suggestPuzzleTranslation();
    }

    /**
     * @param {Array<ProgrammableSignalComponent>} signalComps
     * @param {Array<ProgrammableAcceptorComponent>} acceptorComps
     */
    populateTruthTable(signalComps, acceptorComps) {
        this.truthTable = document.getElementById("truth-table-list");
        this.truthTable.innerHTML = buildTruthTableHTML(signalComps, acceptorComps);
    }

    /**
     * Marks each row of the truth table as passed or failed after a test
     */
    showSimulationResults() {
        if (!this.truthTable) {
            return;
        }
        const acceptorComps = getAllProgrammableAcceptorComponents(this.root);
        const rows = this.truthTable.querySelectorAll("tbody tr");

        rows.forEach((row, i) => {
            const failed = acceptorComps.some(it => it.simulationResults[i] === false);
            row.classList.remove("running");
            row.classList.toggle("failed", failed);
            row.classList.toggle("passed", !failed);
        });
    }

    /**
     * Highlights the row being simulated while a test is running
     */
    update() {
        if (!this.truthTable) {
            return;
        }

        const step = this.root.inSimulation ? getCurrentSimulationStep(this.root) : -1;
        if (step === this.highlightedStep) {
            return;
        }

        if (this.highlightedStep === -1 && step >= 0) {
            // A new test started, clear the previous results
            this.truthTable
                .querySelectorAll("tbody tr")
                .forEach(row => row.classList.remove("passed", "failed"));
        }

        const previous = this.truthTable.querySelector("tr.running");
        if (previous) {
            previous.classList.remove("running");
        }

        const current = step >= 0 ? this.truthTable.querySelector(`tbody tr.row${step}`) : null;
        if (current) {
            current.classList.add("running");
            current.scrollIntoView({ block: "nearest" });
        }

        this.highlightedStep = step;
    }
}
