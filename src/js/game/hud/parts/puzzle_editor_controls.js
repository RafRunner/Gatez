import { makeDiv } from "../../../core/utils";
import { T } from "../../../translations";
import { BaseHUDPart } from "../base_hud_part";
import { TruthTableView } from "../truth_table_view";

/**
 * Editor side panel: short instructions and the live truth table, with a button to edit it
 */
export class HUDPuzzleEditorControls extends BaseHUDPart {
    createElements(parent) {
        this.element = makeDiv(parent, "ingame_HUD_PuzzleEditorControls");

        this.element.innerHTML = `
            <div class="section instructions">
                <button class="sectionHeader">${T.ingame.puzzleEditorControls.howTo}</button>
                <ol class="content">
                    ${T.ingame.puzzleEditorControls.instructions.map(text => `<li>${text}</li>`).join("")}
                </ol>
            </div>

            <div class="section truth-table">
                <button class="sectionHeader">${T.ingame.puzzleEditorSettings.expectedOutputs}</button>
                <div class="content" id="editor-truth-table"></div>
            </div>

            <div class="buttons">
                <button class="styledButton editTruthTable">${
                    T.ingame.puzzleEditorControls.editTruthTable
                }</button>
            </div>
        `;

        for (const header of this.element.querySelectorAll(".sectionHeader")) {
            this.trackClicks(/** @type {HTMLElement} */ (header), () =>
                header.parentElement.classList.toggle("collapsed")
            );
        }

        this.trackClicks(this.element.querySelector("button.editTruthTable"), () =>
            this.root.hud.parts.truthTableEditor.open()
        );

        this.titleElement = makeDiv(parent, "ingame_HUD_PuzzleEditorTitle");
        this.titleElement.innerText = T.ingame.puzzleEditorControls.title;
    }

    initialize() {
        this.truthTable = new TruthTableView(this.root, this.element.querySelector("#editor-truth-table"), {
            live: true,
        });
        this.truthTable.render();
        this.root.signals.puzzleCompleteEdit.add(() => this.truthTable.showResults());
    }

    update() {
        this.truthTable.update();
    }
}
