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
 * Returns all ProgrammableSignalComponents
 * @param {GameRoot} root
 * @returns {Array<ProgrammableSignalComponent>}
 */
export function getAllProgrammableSignalComponents(root) {
    return root.entityMgr
        .getAllWithComponent(ProgrammableSignalComponent)
        .sort(sortByPosition)
        .map(ps => ps.components.ProgrammableSignal);
}

/**
 * Returns all ProgrammableAcceptorComponent
 * @param {GameRoot} root
 * @returns {Array<ProgrammableAcceptorComponent>}
 */
export function getAllProgrammableAcceptorComponents(root) {
    return root.entityMgr
        .getAllWithComponent(ProgrammableAcceptorComponent)
        .sort(sortByPosition)
        .map(ps => ps.components.ProgrammableAcceptor);
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
 * Builds a string that represents a series of expected outputs for a set of inputs. It's a line of a truth table
 * @param {ProgrammableSignalComponent[]} signalComps
 * @param {ProgrammableAcceptorComponent[]} acceptorComps
 * @param {Number} i
 * @param {Number} numberOfLines
 * @returns {string}
 */
export function buildInputToExpectedOutputString(signalComps, acceptorComps, i, numberOfLines) {
    const humanIndex = i + 1;
    const indexString = numberOfLines >= 10 && i < 9 ? "0" + humanIndex : humanIndex.toString();
    return (
        indexString +
        ") " +
        signalComps.map(it => it.signalList[i].getAsCopyableKey()).join(",") +
        " -> " +
        acceptorComps
            .map(it => (it.expectedSignals[i] ? it.expectedSignals[i].getAsCopyableKey() : "x"))
            .join(",")
    );
}

/**
 * Builds a string that is a div with all failed tests in a puzzle
 * @param {GameRoot} root
 * @returns {string}
 */
export function buildFailedTestsString(root) {
    const signalComps = getAllProgrammableSignalComponents(root);
    const acceptorComps = getAllProgrammableAcceptorComponents(root);

    let failedTests = `<div style="font-family: DK Canoodle, sans-serif, monospace !important;"><br>`;
    let numberOfFails = 0;
    const lines = acceptorComps[0].expectedSignals.length;

    for (let i = 0; i < lines && numberOfFails < 16; i++) {
        // At least one output was wrong
        if (acceptorComps.some(it => it.simulationResults[i] === false)) {
            const expected = buildInputToExpectedOutputString(signalComps, acceptorComps, i, lines);

            failedTests += expected + "<br>";
            numberOfFails++;
        }
    }

    return failedTests + "</div>";
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
