/* typehints:start */
import { GameRoot } from "../root";
/* typehints:end */

import {
    buildTruthTableHTML,
    getAllProgrammableAcceptorComponents,
    getAllProgrammableSignalComponents,
    getCurrentSimulationStep,
} from "../../core/logic_simulation_helper";
import { T } from "../../translations";

/**
 * Renders the puzzle's truth table into a container and keeps it in sync with the simulation:
 * highlights the row being tested and marks rows as passed/failed when a test ends.
 * Used by the play side panel and by the editor side panel.
 */
export class TruthTableView {
    /**
     * @param {GameRoot} root
     * @param {HTMLElement} container
     * @param {object} [options]
     * @param {boolean} [options.live] Re-render automatically when signals/acceptors change (editor)
     */
    constructor(root, container, { live = false } = {}) {
        this.root = root;
        this.container = container;
        this.live = live;

        /** Signature of the last rendered table, to detect changes in live mode */
        this.renderedSignature = null;
        this.highlightedStep = -1;
    }

    /**
     * Builds a string that changes whenever the truth table (or its column order) changes
     * @returns {string}
     */
    computeSignature() {
        const keys = list => list.map(it => (it ? it.getAsCopyableKey() : "x")).join("");
        return (
            getAllProgrammableSignalComponents(this.root)
                .map(it => keys(it.signalList))
                .join("|") +
            "/" +
            getAllProgrammableAcceptorComponents(this.root)
                .map(it => keys(it.expectedSignals))
                .join("|")
        );
    }

    render() {
        const signalComps = getAllProgrammableSignalComponents(this.root);
        const acceptorComps = getAllProgrammableAcceptorComponents(this.root);
        this.container.innerHTML =
            signalComps.length + acceptorComps.length === 0
                ? `<span class="empty">${T.dialogs.editTruthTable.empty}</span>`
                : buildTruthTableHTML(signalComps, acceptorComps);
        this.renderedSignature = this.computeSignature();
        this.highlightedStep = -1;
    }

    /**
     * Marks each row as passed or failed, based on the last simulation
     */
    showResults() {
        const acceptorComps = getAllProgrammableAcceptorComponents(this.root);
        this.container.querySelectorAll("tbody tr").forEach((row, i) => {
            const failed = acceptorComps.some(it => it.simulationResults[i] === false);
            row.classList.remove("running");
            row.classList.toggle("failed", failed);
            row.classList.toggle("passed", !failed);
        });
    }

    /**
     * Call every frame
     */
    update() {
        if (
            this.live &&
            !this.root.inSimulation &&
            this.root.time.realtimeNow() - (this.lastLiveCheck || 0) > 0.25
        ) {
            this.lastLiveCheck = this.root.time.realtimeNow();
            if (this.computeSignature() !== this.renderedSignature) {
                this.render();
            }
        }

        const step = this.root.inSimulation ? getCurrentSimulationStep(this.root) : -1;
        if (step === this.highlightedStep) {
            return;
        }

        if (this.highlightedStep === -1 && step >= 0) {
            // A new test started, clear the previous results
            this.container
                .querySelectorAll("tbody tr")
                .forEach(row => row.classList.remove("passed", "failed"));
        }

        const previous = this.container.querySelector("tr.running");
        if (previous) {
            previous.classList.remove("running");
        }

        const current = step >= 0 ? this.container.querySelector(`tbody tr.row${step}`) : null;
        if (current) {
            current.classList.add("running");
            current.scrollIntoView({ block: "nearest" });
        }

        this.highlightedStep = step;
    }
}
