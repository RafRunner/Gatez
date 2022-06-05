import { Component } from "../component";
import { defaultBuildingVariant } from "../meta_building";


export const enumWireInsulatorVariants = {
    [defaultBuildingVariant]: defaultBuildingVariant,
    forward: "forward",
    turn: "turn",
    double_turn: "double_turn",
    swap: "swap",
};

export class WireTunnelComponent extends Component {
    static getId() {
        return "WireTunnel";
    }

    constructor() {
        super();

        /**
         * Linked network, only if its not multiple directions
         * @type {Array<import("../systems/wire").WireNetwork>}
         */
        this.linkedNetworks = [];
        /**
         * All connections that this tunnel connects to and from
         * @type {Array<Object>}
         */
        this.connections = [];
    }
}
