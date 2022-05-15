/**
 * Originally taken from https://github.com/SkimnerPhi/wires-plus
 * Thanks to SkimnerPhi for providing the original code and art associated with this file
 */

import { Component } from "../component";
import { defaultBuildingVariant } from "../meta_building";

/** @enum {string} */
export const enumMultiplexerType = {
    [defaultBuildingVariant]: "muxer",
    muxer: "muxer",
    demuxer: "demuxer",
};

export class MultiplexerComponent extends Component {

    static getId() {
        return "Multiplexer";
    }

    /**
     * @param {object} param0
     * @param {enumMultiplexerType=} param0.type
     */
    constructor({ type = enumMultiplexerType.muxer }) {
        super();
        this.type = type;
    }
}
