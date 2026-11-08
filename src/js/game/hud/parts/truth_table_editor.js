import { ClickDetector } from "../../../core/click_detector";
import {
    getAcceptorLabel,
    getSignalLabel,
    getSortedAcceptorEntities,
    getSortedSignalEntities,
} from "../../../core/logic_simulation_helper";
import { DialogWithForm } from "../../../core/modal_dialog_elements";
import { FormElement } from "../../../core/modal_dialog_forms";
import { STOP_PROPAGATION } from "../../../core/signal";
import { Vector } from "../../../core/vector";
import { T } from "../../../translations";
import { enumMouseButton } from "../../camera";
import { Entity } from "../../entity";
import { BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON } from "../../items/boolean_item";
import { BaseHUDPart } from "../base_hud_part";

// Keep in sync with the backend (maxTruthTableRows in src/utils/puzzleValidation.ts)
const MAX_ROWS = 256;
// 2^8 = 256 rows
const MAX_INPUTS_FOR_ALL_COMBINATIONS = 8;

/**
 * @typedef {"0"|"1"|"x"} CellValue
 *
 * @typedef {object} TruthTableModel
 * @property {CellValue[][]} inputs One column (list of rows) per programmable signal
 * @property {CellValue[][]} outputs One column (list of rows) per programmable acceptor
 */

/**
 * @param {import("../../base_item").BaseItem|null} item
 * @returns {CellValue}
 */
function itemToCell(item) {
    if (!item) {
        return "x";
    }
    return /** @type {CellValue} */ (item.getAsCopyableKey());
}

/**
 * @param {CellValue} cell
 */
function cellToItem(cell) {
    if (cell === "1") {
        return BOOL_TRUE_SINGLETON;
    }
    if (cell === "0") {
        return BOOL_FALSE_SINGLETON;
    }
    return null;
}

/**
 * A form element to edit every input and expected output of a puzzle as one table.
 * Click a cell to change it: inputs toggle 0/1, outputs cycle 0 → 1 → x (don't care).
 */
export class FormElementTruthTable extends FormElement {
    /**
     * @param {object} param0
     * @param {string} param0.id
     * @param {TruthTableModel} param0.model
     */
    constructor({ id, model }) {
        super(id, null);
        this.model = model;
        /** @type {HTMLElement} */
        this.element = null;
    }

    get rowCount() {
        const column = this.model.inputs[0] || this.model.outputs[0];
        return column ? column.length : 0;
    }

    getHtml() {
        return `<div class="formElement truthTableEditor" data-formId="${this.id}"></div>`;
    }

    /**
     * @param {HTMLElement} parent
     * @param {Array<ClickDetector>} clickTrackers
     */
    bindEvents(parent, clickTrackers) {
        this.element = this.getFormElement(parent);

        // One detector for the whole editor; the clicked element tells what to do
        const detector = new ClickDetector(this.element, { consumeEvents: false, preventDefault: false });
        clickTrackers.push(detector);
        detector.click.add((_, event) => this.handleClick(/** @type {HTMLElement} */ (event.target)));

        this.render();
    }

    /**
     * @param {HTMLElement} target
     */
    handleClick(target) {
        const actionElement = /** @type {HTMLElement} */ (target.closest("[data-action]"));
        if (!actionElement) {
            return;
        }

        const action = actionElement.dataset.action;
        const row = Number(actionElement.dataset.row);
        const column = Number(actionElement.dataset.column);

        switch (action) {
            case "toggleInput": {
                const values = this.model.inputs[column];
                values[row] = values[row] === "1" ? "0" : "1";
                break;
            }
            case "toggleOutput": {
                const values = this.model.outputs[column];
                values[row] = values[row] === "0" ? "1" : values[row] === "1" ? "x" : "0";
                break;
            }
            case "addRow":
                this.addRow();
                break;
            case "removeRow":
                this.removeRow(row);
                break;
            case "allCombinations":
                this.fillAllCombinations();
                break;
        }

        this.render();
    }

    addRow() {
        if (this.rowCount >= MAX_ROWS) {
            return;
        }
        this.model.inputs.forEach(column => column.push("0"));
        this.model.outputs.forEach(column => column.push("0"));
    }

    /**
     * @param {number} row
     */
    removeRow(row) {
        if (this.rowCount <= 1) {
            return;
        }
        this.model.inputs.forEach(column => column.splice(row, 1));
        this.model.outputs.forEach(column => column.splice(row, 1));
    }

    /**
     * Replaces the inputs with every combination, counting in binary (A is the most significant bit).
     * Expected outputs of existing rows are kept, new rows get 0.
     */
    fillAllCombinations() {
        const inputCount = this.model.inputs.length;
        if (inputCount === 0 || inputCount > MAX_INPUTS_FOR_ALL_COMBINATIONS) {
            return;
        }

        const rows = 1 << inputCount;
        this.model.inputs = this.model.inputs.map((_, i) => {
            const column = [];
            for (let row = 0; row < rows; row++) {
                column.push((row >> (inputCount - 1 - i)) & 1 ? "1" : "0");
            }
            return /** @type {CellValue[]} */ (column);
        });
        this.model.outputs = this.model.outputs.map(column => {
            const resized = column.slice(0, rows);
            while (resized.length < rows) {
                resized.push("0");
            }
            return resized;
        });
    }

    render() {
        const { inputs, outputs } = this.model;
        const rows = this.rowCount;

        const header =
            `<th class="index">#</th>` +
            inputs.map((_, i) => `<th>${getSignalLabel(i)}</th>`).join("") +
            outputs
                .map(
                    (_, i) =>
                        `<th class="output ${i === 0 ? "firstOutput" : ""}">${getAcceptorLabel(
                            i,
                            outputs.length
                        )}</th>`
                )
                .join("") +
            `<th></th>`;

        let body = "";
        for (let row = 0; row < rows; row++) {
            const inputCells = inputs
                .map(
                    (column, i) =>
                        `<td class="value editable v${column[row]}" data-action="toggleInput" data-row="${row}" data-column="${i}">${column[row]}</td>`
                )
                .join("");
            const outputCells = outputs
                .map((column, i) => {
                    const value = column[row];
                    const classes = `value editable output ${i === 0 ? "firstOutput" : ""} ${
                        value === "x" ? "dontCare" : "v" + value
                    }`;
                    return `<td class="${classes}" data-action="toggleOutput" data-row="${row}" data-column="${i}">${
                        value === "x" ? "–" : value
                    }</td>`;
                })
                .join("");
            const remove =
                rows > 1
                    ? `<td><button class="removeRow" data-action="removeRow" data-row="${row}" title="${T.dialogs.editTruthTable.removeRow}">×</button></td>`
                    : "<td></td>";

            body += `<tr><td class="index">${row + 1}</td>${inputCells}${outputCells}${remove}</tr>`;
        }

        const canGenerate = inputs.length > 0 && inputs.length <= MAX_INPUTS_FOR_ALL_COMBINATIONS;

        this.element.innerHTML = `
            <div class="tableWrapper">
                <table class="truthTable"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>
            </div>
            <div class="actions">
                <button class="styledButton" data-action="addRow" ${rows >= MAX_ROWS ? "disabled" : ""}>
                    ${T.dialogs.editTruthTable.addRow}
                </button>
                ${
                    canGenerate
                        ? `<button class="styledButton" data-action="allCombinations">${T.dialogs.editTruthTable.allCombinations.replace(
                              "<rows>",
                              String(1 << inputs.length)
                          )}</button>`
                        : ""
                }
            </div>`;
    }

    isValid() {
        return this.rowCount > 0;
    }

    /** @returns {TruthTableModel} */
    getValue() {
        return this.model;
    }

    focus() {}
}

/**
 * Edits the truth table of the puzzle being created: opens the table editor when an output
 * is clicked or from the editor side panel (inputs toggle on click instead, see programmable_signal_click.js),
 * and gives newly placed inputs/outputs one value per row.
 */
export class HUDTruthTableEditor extends BaseHUDPart {
    initialize() {
        this.root.camera.downPreHandler.add(this.downPreHandler, this);
    }

    /**
     * @param {Vector} pos
     * @param {enumMouseButton} button
     */
    downPreHandler(pos, button) {
        if (this.root.currentLayer !== "regular" || button !== enumMouseButton.left) {
            return;
        }

        const tile = this.root.camera.screenToWorld(pos).toTileSpace();
        const contents = this.root.map.getLayerContentXY(tile.x, tile.y, "regular");
        if (contents && contents.components.ProgrammableAcceptor) {
            this.open();
            return STOP_PROPAGATION;
        }
    }

    /**
     * Number of rows of the current truth table
     * @returns {number}
     */
    getRowCount() {
        const lengths = [
            ...getSortedSignalEntities(this.root).map(
                it => it.components.ProgrammableSignal.signalList.length
            ),
            ...getSortedAcceptorEntities(this.root).map(
                it => it.components.ProgrammableAcceptor.expectedSignals.length
            ),
        ];
        return Math.max(0, ...lengths);
    }

    /**
     * Gives a newly placed input/output one value (0) per existing row, so the table stays consistent
     * @param {Entity} entity
     */
    initializeNewEntity(entity) {
        const rows = Math.max(1, this.getRowCount());
        const zeros = new Array(rows).fill(BOOL_FALSE_SINGLETON);

        if (
            entity.components.ProgrammableSignal &&
            entity.components.ProgrammableSignal.signalList.length === 0
        ) {
            entity.components.ProgrammableSignal.signalList = zeros;
        }
        if (
            entity.components.ProgrammableAcceptor &&
            entity.components.ProgrammableAcceptor.expectedSignals.length === 0
        ) {
            entity.components.ProgrammableAcceptor.expectedSignals = zeros;
        }
    }

    open() {
        const signalEntities = getSortedSignalEntities(this.root);
        const acceptorEntities = getSortedAcceptorEntities(this.root);

        if (signalEntities.length === 0 && acceptorEntities.length === 0) {
            this.root.hud.parts.dialogs.showInfo(
                T.dialogs.editTruthTable.title,
                T.dialogs.editTruthTable.noInputsOrOutputs
            );
            return;
        }

        // Pad lists of different lengths (older puzzles), so every column has the same rows
        const rows = Math.max(1, this.getRowCount());
        const pad = (/** @type {CellValue[]} */ column) => {
            while (column.length < rows) {
                column.push("0");
            }
            return column;
        };

        /** @type {TruthTableModel} */
        const model = {
            inputs: signalEntities.map(it =>
                pad(it.components.ProgrammableSignal.signalList.map(itemToCell))
            ),
            outputs: acceptorEntities.map(it =>
                pad(it.components.ProgrammableAcceptor.expectedSignals.map(itemToCell))
            ),
        };
        // Inputs can't be "don't care"
        model.inputs = model.inputs.map(column => column.map(value => (value === "x" ? "0" : value)));

        const tableInput = new FormElementTruthTable({ id: "truthTable", model });
        const uids = {
            inputs: signalEntities.map(it => it.uid),
            outputs: acceptorEntities.map(it => it.uid),
        };

        const dialog = new DialogWithForm({
            app: this.root.app,
            title: T.dialogs.editTruthTable.title,
            desc: T.dialogs.editTruthTable.desc,
            formElements: [tableInput],
            buttons: ["cancel:bad:escape", "ok:good:enter"],
            closeButton: false,
        });
        this.root.hud.parts.dialogs.internalShowDialog(dialog);

        dialog.buttonSignals.ok.add(() => this.apply(uids, tableInput.getValue()));
    }

    /**
     * @param {{ inputs: number[], outputs: number[] }} uids
     * @param {TruthTableModel} model
     */
    apply(uids, model) {
        if (!this.root || !this.root.entityMgr) {
            // Game got stopped
            return;
        }

        uids.inputs.forEach((uid, i) => {
            const entity = this.root.entityMgr.findByUid(uid, false);
            if (entity && entity.components.ProgrammableSignal) {
                entity.components.ProgrammableSignal.signalList = model.inputs[i].map(cellToItem);
            }
        });
        uids.outputs.forEach((uid, i) => {
            const entity = this.root.entityMgr.findByUid(uid, false);
            if (entity && entity.components.ProgrammableAcceptor) {
                entity.components.ProgrammableAcceptor.expectedSignals = model.outputs[i].map(cellToItem);
            }
        });
    }
}
