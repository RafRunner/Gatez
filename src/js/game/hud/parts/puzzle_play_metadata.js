/* typehints:start */
import { PuzzlePlayGameMode } from "../../modes/puzzle_play";
/* typehints:end */

import { formatBigNumberFull, formatSeconds, makeDiv } from "../../../core/utils";
import { T } from "../../../translations";
import { BaseHUDPart } from "../base_hud_part";
import { buildInputToExpectedOutputString } from "../../../core/logic_simulation_helper";
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

        this.element = makeDiv(parent, "ingame_HUD_PuzzlePlayMetadata");
        this.element.innerHTML = `
            <div class="plays">
                <span class="downloads">${formatBigNumberFull(puzzle.meta.downloads)}</span>
                <span class="likes">${formatBigNumberFull(puzzle.meta.likes)}</span>
            </div>


            <div class="info author"><label>${T.ingame.puzzleMetadata.author}</label><span></span></div>
            <div class="info rating">
                <label>${T.ingame.puzzleMetadata.averageDuration}</label>
                <span>${puzzle.meta.averageTime ? formatSeconds(puzzle.meta.averageTime) : "-"}</span>
            </div>
            <div class="info rating">
                <label>${T.ingame.puzzleMetadata.completionRate}</label>
                <span>${
                    puzzle.meta.downloads > 0
                        ? ((puzzle.meta.completions / puzzle.meta.downloads) * 100.0).toFixed(1) + "%"
                        : "-"
                }</span>
            </div>
            <div class="info truth-table">
                <label>${T.ingame.puzzleEditorSettings.expectedOutputs}</label>
                <div id="truth-table-list">
                </div>
            </div>
            ${
                puzzle.meta.description.trim().length === 0
                    ? ""
                    : `<div class="info level-description">
                <label>${T.ingame.puzzleEditorSettings.description}</label>
                <span>${puzzle.meta.description}</span>
            </div>`
            }
            <div class="buttons">
                <button class="styledButton share">${
                    T.ingame.puzzleEditorSettings.share
                }</button>                ${
            notInPlayerLanguage
                ? `<button class="styledButton suggestTranslation">${T.ingame.puzzleEditorSettings.suggestTranslation}</button>`
                : ""
        }
                <button class="styledButton report">${T.ingame.puzzleEditorSettings.report}</button>
            </div>
            `;

        this.trackClicks(this.element.querySelector("button.share"), this.share);
        this.trackClicks(this.element.querySelector("button.report"), this.report);
        if (notInPlayerLanguage) {
            this.trackClicks(
                this.element.querySelector("button.suggestTranslation"),
                this.suggestTranslation
            );
        }

        /** @type {HTMLElement} */ (this.element.querySelector(".author span")).innerText =
            puzzle.meta.authorName;

        this.root.signals.populateTruthTableSignal.add(this.populateTruthTable, this);
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
        const truthTable = document.getElementById("truth-table-list");
        const numberOfLines = signalComps[0].signalList.length;

        for (let i = 0; i < numberOfLines && i < 16; i++) {
            const innerHTML = buildInputToExpectedOutputString(signalComps, acceptorComps, i, numberOfLines);

            const line = document.createElement("span");
            line.innerHTML = innerHTML;
            truthTable.appendChild(line);
        }
    }
}
