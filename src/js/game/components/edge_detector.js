/**
 * Originally taken from https://github.com/SkimnerPhi/wires-plus
 * Thanks to SkimnerPhi for providing the original code and art associated with this file
 */

import { Component } from "../component";
import { defaultBuildingVariant } from "../meta_building";

export const enumEdgeDetectorType = {
    [defaultBuildingVariant]: "rising",
    rising: "rising",
    falling: "falling",
    change: "change",
};
export class EdgeDetectorComponent extends Component {
    static getId() {
        return "EdgeDetector";
    }
    constructor({ type = enumEdgeDetectorType.rising }) {
        super();
        this.type = type;
        this.lastValue = null;
    }
}
