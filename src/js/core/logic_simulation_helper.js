import { AdderComponent } from "../game/components/adder";
import { EdgeDetectorComponent } from "../game/components/edge_detector";
import { LogicGateComponent } from "../game/components/logic_gate";
import { MemoryComponent } from "../game/components/memory";
import { MultiplexerComponent } from "../game/components/multiplexer";
import { ProgrammableAcceptorComponent } from "../game/components/programmable_acceptor";
import { ProgrammableSignalComponent } from "../game/components/programmable_signal";
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
 * Validates the current puzzle and calls the callback if all succeeds
 * @param {GameRoot} root
 * @returns {Array<ProgrammableSignalComponent>}
 */
export function getAllProgrammableSignalComponents(root) {
    return root.entityMgr
        .getAllWithComponent(ProgrammableSignalComponent)
        .map(ps => ps.components.ProgrammableSignal);
}

/**
 * Validates the current puzzle and calls the callback if all succeeds
 * @param {GameRoot} root
 * @returns {Array<ProgrammableAcceptorComponent>}
 */
export function getAllProgrammableAcceptorComponents(root) {
    return root.entityMgr
        .getAllWithComponent(ProgrammableAcceptorComponent)
        .map(ps => ps.components.ProgrammableAcceptor);
}

/**
 * Validates the current puzzle and calls the callback if all succeeds
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
        signalComps.some(sc => sc.signalList.length != expectedLength || sc.signalList.length === 0) ||
        acceptorComps.some(
            ac => ac.expectedSignals.length != expectedLength || ac.expectedSignals.length === 0
        )
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
 * @returns {string}
 */
export function buildInputToExpectedOutputString(signalComps, acceptorComps, i) {
    return (
        i +
        ") " +
        signalComps.map(it => it.signalList[i].getAsCopyableKey()).join(",") +
        " -> " +
        acceptorComps
            .map(it => (it.expectedSignals[i] ? it.expectedSignals[i].getAsCopyableKey() : "x"))
            .join(",")
    );
}

/**
 * Builds a string that represents a series of expected outputs for a set of inputs. It's a line of a truth table
 * @param {GameRoot} root
 * @returns {string}
 */
export function buildFailedTestsString(root) {
    const signalComps = getAllProgrammableSignalComponents(root);
    const acceptorComps = getAllProgrammableAcceptorComponents(root);

    let failedTests = `<div style="font-family: DK Canoodle, sans-serif, monospace !important;"><br>`;

    for (let i = 0; i < acceptorComps[0].expectedSignals.length && i < 16; i++) {
        // At least one output was worng
        if (acceptorComps.some(it => it.simulationResults[i] === false)) {
            const expected = buildInputToExpectedOutputString(signalComps, acceptorComps, i);

            failedTests += expected + "<br>";
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
