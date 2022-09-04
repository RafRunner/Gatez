/**
 * Originally taken from https://github.com/SkimnerPhi/wires-plus
 * Thanks to SkimnerPhi for providing the original code and art associated with this file
 */

import { EdgeDetectorComponent, enumEdgeDetectorType } from "../components/edge_detector";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { castBool, isTruthyItem } from "../items/boolean_item";

export class EdgeDetectorSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [EdgeDetectorComponent]);
        this.outputFrames = 2;
        this.framesCount = 0;
    }

    update() {
        if (!this.root.gameInitialized) {
            return;
        }

        for (let idx = 0; idx < this.allEntities.length; idx++) {
            const entity = this.allEntities[idx];
            const edgeComp = entity.components.EdgeDetector;
            const slotComp = entity.components.WiredPins;

            const inputNetwork = slotComp.slots[0].linkedNetwork;
            if (inputNetwork && inputNetwork.valueConflict) {
                edgeComp.lastValue = null;
                slotComp.slots[1].value = null;
                continue;
            }
            const inputValue = inputNetwork ? inputNetwork.currentValue : null;

            // TODO Hack to make Flip-Flops easier to build. Improve in the future
            this.framesCount++;
            if (this.framesCount < this.outputFrames) {
                return;
            }
            this.framesCount = 0;

            let output = false;
            switch (edgeComp.type) {
                case enumEdgeDetectorType.rising:
                    output = !isTruthyItem(edgeComp.lastValue) && isTruthyItem(inputValue);
                    break;
                case enumEdgeDetectorType.falling:
                    output = isTruthyItem(edgeComp.lastValue) && !isTruthyItem(inputValue);
                    break;
                case enumEdgeDetectorType.change:
                    output = edgeComp.lastValue !== inputValue;
                    break;
            }

            edgeComp.lastValue = inputValue;
            slotComp.slots[1].value = castBool(output);
        }
    }
}
