/**
 * Originally taken from https://github.com/SkimnerPhi/wires-plus
 * Thanks to SkimnerPhi for providing the original code and art associated with this file
 */

import { Component } from "../component";

/** @enum {string} */
export const enumAdderType = {
    half: "half",
    full: "full",
};

export class AdderComponent extends Component {
    static getId() {
        return "Adder";
    }

    /**
     * @param {object} param0
     * @param {enumAdderType=} param0.type
     */
    constructor({ type = enumAdderType.half }) {
        super();
        this.type = type;
    }
}
