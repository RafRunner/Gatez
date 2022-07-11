import { types } from "../../savegame/serialization";
import { BaseItem } from "../base_item";
import { Component } from "../component";
import { typeItemSingleton } from "../item_resolver";

export class ProgrammableSignalComponent extends Component {
    static getId() {
        return "ProgrammableSignal";
    }

    static getSchema() {
        return {
            signalList: types.array(types.nullable(typeItemSingleton)),
            toggled: types.bool,
        };
    }

    /**
     * Copy the current state to another component
     * @param {ProgrammableSignalComponent} otherComponent
     */
    copyAdditionalStateTo(otherComponent) {
        otherComponent.signalList = this.signalList;
        otherComponent.toggled = this.toggled;
    }

    /**
     *
     * @param {object} param0
     * @param {BaseItem[]=} param0.signalList The signalList to store
     * @param {boolean=} param0.toggled
     */
    constructor({ signalList = null, toggled = false }) {
        super();
        this.signalList = signalList;
        this.toggled = toggled;
    }
}
