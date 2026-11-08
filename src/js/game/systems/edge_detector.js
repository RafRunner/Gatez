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

        // TODO Hack to make Flip-Flops easier to build: outputs are only recomputed every
        // `outputFrames` ticks, so every pulse lasts that many ticks. The counter is shared,
        // so all edge detectors update on the same tick. Improve in the future
        this.framesCount++;
        const shouldUpdateOutputs = this.framesCount >= this.outputFrames;
        if (shouldUpdateOutputs) {
            this.framesCount = 0;
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

            if (!shouldUpdateOutputs) {
                continue;
            }

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
