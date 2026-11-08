/* typehints:start */
import { PuzzlePlayGameMode } from "../../modes/puzzle_play";
/* typehints:end */

import { formatBigNumberFull, formatSeconds, formatUserTextAsHTML, makeDiv } from "../../../core/utils";
import { T } from "../../../translations";
import { BaseHUDPart } from "../base_hud_part";
import { TruthTableView } from "../truth_table_view";
import { SidePanelFade } from "../side_panel_fade";

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
     * Called once the puzzle is loaded (the signals and acceptors exist)
     */
    populateTruthTable() {
        this.truthTable = new TruthTableView(this.root, document.getElementById("truth-table-list"));
        this.truthTable.render();
    }

    showSimulationResults() {
        if (this.truthTable) {
            this.truthTable.showResults();
        }
    }

    update() {
        if (this.truthTable) {
            this.truthTable.update();
        }
        if (!this.fade) {
            this.fade = new SidePanelFade(this.root, this.element);
        }
        this.fade.update();
    }
}
