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
    return root.currentSimulationFrame !== 0 && (root.currentSimulationFrame + 1) % FRAMES_PER_STEP === 0;
}
