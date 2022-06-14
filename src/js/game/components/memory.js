/**
 * Originally taken from https://github.com/SkimnerPhi/wires-plus
 * Thanks to SkimnerPhi for providing the original code and art associated with this file
 */

import { Component } from "../component";
import { BOOL_FALSE_SINGLETON } from "../items/boolean_item";
import { typeItemSingleton } from "../item_resolver";
import { defaultBuildingVariant } from "../meta_building";

export const enumMemoryType = {
    [defaultBuildingVariant]: "sr",
    sr: "sr", // Set Reset Latch
    d: "d", // Delay latch, Data latch, Write enable
    jk: "jk", // The only one with a explicit clock
    t: "t", // Togle Flip-Flop
};

export class MemoryComponent extends Component {
    static getId() {
        return "Memory";
    }

    static getSchema() {
        return {
            outSignal: shapez.types.nullable(typeItemSingleton),
            lastFrameClockSignal: shapez.types.bool,
        };
    }

    constructor({ type = enumMemoryType.sr }) {
        super();
        this.type = type;
        this.outSignal = null;
        this.lastFrameClockSignal = false;
    }

    clear() {
        switch(this.type) {
            case enumMemoryType.sr: {
                this.outSignal = BOOL_FALSE_SINGLETON;
                break;
            }
            case enumMemoryType.d: {
                this.outSignal = null;
                break;
            }
            case enumMemoryType.t:
            case enumMemoryType.jk: {
                this.outSignal = BOOL_FALSE_SINGLETON;
                this.lastFrameClockSignal = false;
            }
        }
    }
}
