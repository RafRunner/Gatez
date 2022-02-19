import { Component } from "../component";

/** @enum {string} */
export const enumLogicGateType = {
    and: "and",
    nand: "nand",
    not: "not",
    xor: "xor",
    or: "or",
    nor: "nor",
    transistor: "transistor",

    analyzer: "analyzer",
    rotater: "rotater",
    unstacker: "unstacker",
    cutter: "cutter",
    compare: "compare",
    stacker: "stacker",
    painter: "painter",
};

export class LogicGateComponent extends Component {
    static getId() {
        return "LogicGate";
    }

    /**
     *
     * @param {object} param0
     * @param {enumLogicGateType=} param0.type
     */
    constructor({ type = enumLogicGateType.and }) {
        super();
        this.type = type;
    }
}
