/**
 * Originally taken from https://github.com/SkimnerPhi/wires-plus
 * Thanks to SkimnerPhi for providing the original code and art associated with this file
 */

 import { EdgeDetectorComponent, enumEdgeDetectorType } from "../components/edge_detector";
 import { GameSystemWithFilter } from "../game_system_with_filter";
 import { BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON, isTruthyItem } from "../items/boolean_item";

export class EdgeDetectorSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [EdgeDetectorComponent]);
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
            slotComp.slots[1].value = output ? BOOL_TRUE_SINGLETON : BOOL_FALSE_SINGLETON;
        }
    }
}
