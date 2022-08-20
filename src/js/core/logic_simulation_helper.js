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
 * @param {object} T
 * @param {Function} callback
 * @returns {string|void}
 */
export function validatePuzzle(root, T, callback) {
    const programmableSignals = root.entityMgr.getAllWithComponent(ProgrammableSignalComponent);
    const programmableAcceptors = root.entityMgr.getAllWithComponent(ProgrammableAcceptorComponent);

    if (programmableSignals.length === 0) {
        return root.hud.signals.notification.dispatch(
            T.puzzleMenu.validation.noProducers,
            enumNotificationType.error
        );
    }

    if (programmableAcceptors.length === 0) {
        return root.hud.signals.notification.dispatch(
            T.puzzleMenu.validation.noGoalAcceptors,
            enumNotificationType.error
        );
    }

    const signalComps = programmableSignals.map(ps => ps.components.ProgrammableSignal);
    const acceptorComps = programmableAcceptors.map(pa => pa.components.ProgrammableAcceptor);

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
