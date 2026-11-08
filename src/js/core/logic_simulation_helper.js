import { AdderComponent } from "../game/components/adder";
import { EdgeDetectorComponent } from "../game/components/edge_detector";
import { LogicGateComponent } from "../game/components/logic_gate";
import { MemoryComponent } from "../game/components/memory";
import { MultiplexerComponent } from "../game/components/multiplexer";
import { ProgrammableAcceptorComponent } from "../game/components/programmable_acceptor";
import { ProgrammableSignalComponent } from "../game/components/programmable_signal";
import { Entity } from "../game/entity";
import { enumNotificationType } from "../game/hud/parts/notifications";
import { GameRoot } from "../game/root";
import { globalConfig } from "./config";

// Indicates how many frames each step of the simulation will last. Needed because components take time to calculate outputs.
/** @type {Number} */
const FRAMES_PER_STEP = 100;

/**
 * Returns the current simulation step
 * @param {GameRoot} root
 * @returns {Number}
 */
export function getCurrentSimulationStep(root) {
    return Math.floor(root.currentSimulationFrame / FRAMES_PER_STEP);
}

/**
 * Returns if the current frame is the one to collect samples for the simulation
 * @param {GameRoot} root
 * @returns {boolean}
 */
export function isSamplingFrame(root) {
    return (root.currentSimulationFrame + 1) % FRAMES_PER_STEP === 0;
}

/**
 * @param {Entity} a
 * @param {Entity} b
 * @returns {Number}
 */
function sortByPosition(a, b) {
    const positionA = a.components.StaticMapEntity.getTileSpaceBounds();
    const positionB = b.components.StaticMapEntity.getTileSpaceBounds();

    if (positionA.y === positionB.y) {
        return positionA.x - positionB.x;
    }
    return positionA.y - positionB.y;
}

/**
 * Programmable signal entities in truth table column order (top to bottom, left to right)
 * @param {GameRoot} root
 * @returns {Array<Entity>}
 */
export function getSortedSignalEntities(root) {
    return root.entityMgr.getAllWithComponent(ProgrammableSignalComponent).slice().sort(sortByPosition);
}

/**
 * Programmable acceptor entities in truth table column order (top to bottom, left to right)
 * @param {GameRoot} root
 * @returns {Array<Entity>}
 */
export function getSortedAcceptorEntities(root) {
    return root.entityMgr.getAllWithComponent(ProgrammableAcceptorComponent).slice().sort(sortByPosition);
}

/**
 * Returns all ProgrammableSignalComponents
 * @param {GameRoot} root
 * @returns {Array<ProgrammableSignalComponent>}
 */
export function getAllProgrammableSignalComponents(root) {
    return getSortedSignalEntities(root).map(ps => ps.components.ProgrammableSignal);
}

/**
 * Returns all ProgrammableAcceptorComponent
 * @param {GameRoot} root
 * @returns {Array<ProgrammableAcceptorComponent>}
 */
export function getAllProgrammableAcceptorComponents(root) {
    return getSortedAcceptorEntities(root).map(ps => ps.components.ProgrammableAcceptor);
}

/**
 * Validates if the current puzzle is ready for testing and calls the callback if all succeeds
 * @param {GameRoot} root
 * @param {object} T
 * @param {Function} callback
 * @returns {string|void}
 */
export function validatePuzzle(root, T, callback) {
    const signalComps = getAllProgrammableSignalComponents(root);
    const acceptorComps = getAllProgrammableAcceptorComponents(root);

    if (signalComps.length === 0) {
        return root.hud.signals.notification.dispatch(
            T.puzzleMenu.validation.noProducers,
            enumNotificationType.error
        );
    }

    if (acceptorComps.length === 0) {
        return root.hud.signals.notification.dispatch(
            T.puzzleMenu.validation.noGoalAcceptors,
            enumNotificationType.error
        );
    }

    const expectedLength = signalComps[0].signalList.length;

    if (
        expectedLength === 0 ||
        signalComps.some(sc => sc.signalList.length != expectedLength) ||
        acceptorComps.some(ac => ac.expectedSignals.length != expectedLength)
    ) {
        return root.hud.signals.notification.dispatch(
            T.puzzleMenu.validation.signalsMustHaveSameLength,
            enumNotificationType.error
        );
    }

    callback();
}

/**
 * Label shown for the n-th programmable signal (input): A, B, ..., Z, AA, AB, ...
 * @param {number} index
 * @returns {string}
 */
export function getSignalLabel(index) {
    let label = "";
    let n = index;
    do {
        label = String.fromCharCode(65 + (n % 26)) + label;
        n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return label;
}

/**
 * Label shown for the n-th programmable acceptor (output): Y if there's only one, otherwise Y1, Y2, ...
 * @param {number} index
 * @param {number} count
 * @returns {string}
 */
export function getAcceptorLabel(index, count) {
    return count === 1 ? "Y" : "Y" + (index + 1);
}

/**
 * @param {import("../game/base_item").BaseItem|null} item
 * @param {string} [extraClass]
 * @returns {string}
 */
function signalCell(item, extraClass = "") {
    if (!item) {
        return `<td class="value dontCare ${extraClass}">–</td>`;
    }
    const value = item.getAsCopyableKey();
    return `<td class="value v${value} ${extraClass}">${value}</td>`;
}

/**
 * Draws a small badge with a label (e.g. "A" or "Y1") on the top left corner of an entity,
 * so players can match programmable signals and acceptors with the truth table columns
 * @param {import("./draw_utils").DrawParameters} parameters
 * @param {Entity} entity
 * @param {string} label
 * @param {string} color
 */
export function drawIOLabel(parameters, entity, label, color) {
    const origin = entity.components.StaticMapEntity.origin;
    const tileSize = globalConfig.tileSize;
    const radius = label.length > 1 ? 6 : 5;
    const x = origin.x * tileSize + radius + 1;
    const y = origin.y * tileSize + radius + 1;
    const context = parameters.context;

    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#fff";
    context.font = `bold ${label.length > 1 ? 5 : 7}px GameFont`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, x, y + 0.5);
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
}

/**
 * @param {Entity[]} sortedEntities
 * @param {(index: number, count: number) => string} labelFn
 * @returns {Map<Entity, string>}
 */
function labelEntities(sortedEntities, labelFn) {
    return new Map(sortedEntities.map((entity, i) => [entity, labelFn(i, sortedEntities.length)]));
}

/**
 * @param {GameRoot} root
 * @returns {Map<Entity, string>}
 */
export function getSignalLabels(root) {
    return labelEntities(getSortedSignalEntities(root), getSignalLabel);
}

/**
 * @param {GameRoot} root
 * @returns {Map<Entity, string>}
 */
export function getAcceptorLabels(root) {
    return labelEntities(getSortedAcceptorEntities(root), getAcceptorLabel);
}

/**
 * Builds an HTML truth table with the inputs and expected outputs of a puzzle.
 * Columns follow the order of getAllProgrammableSignalComponents/getAllProgrammableAcceptorComponents
 * (top to bottom, left to right), with the same labels drawn on the map.
 * @param {ProgrammableSignalComponent[]} signalComps
 * @param {ProgrammableAcceptorComponent[]} acceptorComps
 * @param {object} [options]
 * @param {number[]} [options.rows] Which rows to include (default: all)
 * @param {(row: number) => string} [options.rowClass] Extra CSS class for a row
 * @returns {string}
 */
export function buildTruthTableHTML(signalComps, acceptorComps, { rows = null, rowClass = () => "" } = {}) {
    const numberOfRows = signalComps.length > 0 ? signalComps[0].signalList.length : 0;
    const rowIndexes = rows || [...Array(numberOfRows).keys()];

    const header =
        `<th class="index">#</th>` +
        signalComps.map((_, i) => `<th>${getSignalLabel(i)}</th>`).join("") +
        acceptorComps
            .map(
                (_, i) =>
                    `<th class="output ${i === 0 ? "firstOutput" : ""}">${getAcceptorLabel(
                        i,
                        acceptorComps.length
                    )}</th>`
            )
            .join("");

    const body = rowIndexes
        .map(row => {
            const inputs = signalComps.map(it => signalCell(it.signalList[row])).join("");
            const outputs = acceptorComps
                .map((it, i) =>
                    signalCell(it.expectedSignals[row], i === 0 ? "output firstOutput" : "output")
                )
                .join("");
            return `<tr class="row${row} ${rowClass(row)}"><td class="index">${
                row + 1
            }</td>${inputs}${outputs}</tr>`;
        })
        .join("");

    return `<table class="truthTable"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}

/**
 * Builds an HTML truth table containing only the rows that failed in the last simulation
 * @param {GameRoot} root
 * @returns {string}
 */
export function buildFailedTestsString(root) {
    const signalComps = getAllProgrammableSignalComponents(root);
    const acceptorComps = getAllProgrammableAcceptorComponents(root);
    const numberOfRows = acceptorComps[0].expectedSignals.length;

    const failedRows = [];
    for (let row = 0; row < numberOfRows; row++) {
        if (acceptorComps.some(it => it.simulationResults[row] === false)) {
            failedRows.push(row);
        }
    }

    return `<div class="failedTests">${buildTruthTableHTML(signalComps, acceptorComps, {
        rows: failedRows,
        rowClass: () => "failed",
    })}</div>`;
}

/**
 * Counts the number of components used to solve a puzzle
 * @param {GameRoot} root
 * @returns {number}
 */
export function countComponentsUsed(root) {
    const countedComponents = [
        LogicGateComponent,
        MultiplexerComponent,
        AdderComponent,
        EdgeDetectorComponent,
        MemoryComponent,
    ];
    return countedComponents.reduce((count, componentType) => {
        return count + root.entityMgr.getAllWithComponent(componentType).length;
    }, 0);
}
