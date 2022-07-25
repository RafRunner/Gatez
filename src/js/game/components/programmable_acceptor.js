import { types } from "../../savegame/serialization";
import { BaseItem } from "../base_item";
import { Component } from "../component";
import { typeItemSingleton } from "../item_resolver";

export class ProgrammableAcceptorComponent extends Component {
    static getId() {
        return "ProgrammableAcceptor";
    }

    static getSchema() {
        return {
            expectedSignals: types.array(types.nullable(typeItemSingleton)),
        };
    }

    /**
     * Copy the current state to another component
     * @param {ProgrammableAcceptorComponent} otherComponent
     */
    copyAdditionalStateTo(otherComponent) {
        otherComponent.expectedSignals = this.expectedSignals;
    }

    /**
     *
     * @param {object} param0
     * @param {BaseItem[]=} param0.expectedSignals The expectedSignals to store
     */
    constructor({ expectedSignals = [] }) {
        super();
        this.expectedSignals = expectedSignals;
        // Stores the current simulation results. true = success false = failure
        /** @type {boolean[]} */
        this.simulationResults = [];
    }
}
