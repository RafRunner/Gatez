/**
 * Originally taken from https://github.com/SkimnerPhi/wires-plus
 * Thanks to SkimnerPhi for providing the original code and art associated with this file
 */

import { AdderComponent } from "../components/adder";
import { enumPinSlotType } from "../components/wired_pins";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { castBool, isTruthyItem } from "../items/boolean_item";

export class AdderSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [AdderComponent]);
    }

    update() {
        for (let idx = 0; idx < this.allEntities.length; idx++) {
            const entity = this.allEntities[idx];
            const slotComp = entity.components.WiredPins;

            let sum = 0;
            let anyConflict = false;

            for (let pin = 0; pin < slotComp.slots.length; pin++) {
                const slot = slotComp.slots[pin];
                if (slot.type !== enumPinSlotType.logicalAcceptor) {
                    continue;
                }
                const network = slot.linkedNetwork;
                if (network) {
                    if (network.valueConflict) {
                        anyConflict = true;
                        break;
                    }
                    if (isTruthyItem(network.currentValue)) {
                        sum++;
                    }
                }
            }

            if (anyConflict) {
                for (let pin = 0; pin < slotComp.slots.length; pin++) {
                    const slot = slotComp.slots[pin];
                    if (slot.type !== enumPinSlotType.logicalEjector) {
                        continue;
                    }
                    slot.value = null;
                }
                continue;
            }

            let mask = 0x1;
            for (let pin = 0; pin < slotComp.slots.length; pin++) {
                const slot = slotComp.slots[pin];
                if (slot.type !== enumPinSlotType.logicalEjector) {
                    continue;
                }
                slot.value = castBool(sum & mask);
                mask <<= 1;
            }
        }
    }
}
