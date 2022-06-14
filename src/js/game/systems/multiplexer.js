/**
 * Originally taken from https://github.com/SkimnerPhi/wires-plus
 * Thanks to SkimnerPhi for providing the original code and art associated with this file
 */

import { enumMultiplexerType, MultiplexerComponent } from "../components/multiplexer";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { isTruthyItem } from "../items/boolean_item";

export class MultiplexerSystem extends GameSystemWithFilter {

    constructor(root) {
        super(root, [MultiplexerComponent]);
    }

    update() {
        for (let idx = 0; idx < this.allEntities.length; idx++) {
            const entity = this.allEntities[idx];
            const muxerComp = entity.components.Multiplexer;
            const slotComp = entity.components.WiredPins;

            const addressNetwork = slotComp.slots[0].linkedNetwork;

            if (addressNetwork && addressNetwork.valueConflict) {
                slotComp.slots[3].value = null;

                if (muxerComp.type === enumMultiplexerType.demuxer) {
                    slotComp.slots[2].value = null;
                }

                continue;
            }

            const address = addressNetwork ? isTruthyItem(addressNetwork.currentValue) : false;

            switch (muxerComp.type) {
                case enumMultiplexerType.muxer: {
                    const inputPin = address ? slotComp.slots[1] : slotComp.slots[2];
                    const inputNetwork = inputPin.linkedNetwork;

                    if (inputNetwork && inputNetwork.valueConflict) {
                        slotComp.slots[3].value = null;
                    } else {
                        slotComp.slots[3].value = inputNetwork ? inputNetwork.currentValue : null;
                    }

                    break;
                }
                case enumMultiplexerType.demuxer: {
                    const inputNetwork = slotComp.slots[1].linkedNetwork;
                    const outputValue = inputNetwork ? (inputNetwork.valueConflict ? null : inputNetwork.currentValue) : null;

                    if (address) {
                        slotComp.slots[2].value = outputValue;
                        slotComp.slots[3].value = null;
                    } else {
                        slotComp.slots[2].value = null;
                        slotComp.slots[3].value = outputValue;
                    }

                    break;
                }
            }
        }
    }
}
