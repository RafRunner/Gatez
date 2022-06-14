import { enumMemoryType, MemoryComponent } from "../components/memory";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON, castBool, isTrueItem, isTruthyItem } from "../items/boolean_item";


export class MemorySystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [MemoryComponent]);
    }

    update() {
        if (!this.root.gameInitialized) {
            return;
        }

        for (let idx = 0; idx < this.allEntities.length; idx++) {
            const entity = this.allEntities[idx];
            const memComp = entity.components.Memory;
            const slotComp = entity.components.WiredPins;

            switch (memComp.type) {
                case enumMemoryType.sr: {
                    const sNetwork = slotComp.slots[0].linkedNetwork;
                    const rNetwork = slotComp.slots[1].linkedNetwork;

                    if (sNetwork && sNetwork.valueConflict || rNetwork && rNetwork.valueConflict) {
                        memComp.outSignal = BOOL_FALSE_SINGLETON;
                        slotComp.slots[2].value = null;
                        slotComp.slots[3].value = null;
                        continue;
                    }

                    const sValue = sNetwork ? isTruthyItem(sNetwork.currentValue) : false;
                    const rValue = rNetwork ? isTruthyItem(rNetwork.currentValue) : false;

                    if (sValue && !rValue) {
                        memComp.outSignal = BOOL_TRUE_SINGLETON;
                    }
                    else if (!sValue && rValue) {
                        memComp.outSignal = BOOL_FALSE_SINGLETON;
                    }
                    else if (sValue && rValue) {
                        memComp.outSignal = castBool(!isTruthyItem(memComp.outSignal));
                    }

                    slotComp.slots[2].value = memComp.outSignal;
                    slotComp.slots[3].value = castBool(!isTruthyItem(memComp.outSignal));

                    break;
                }

                case enumMemoryType.d: {
                    const iNetwork = slotComp.slots[0].linkedNetwork;
                    const weNetwork = slotComp.slots[1].linkedNetwork;

                    if (iNetwork && weNetwork) {
                        if (weNetwork.valueConflict) {
                            memComp.outSignal = null;
                        }
                        else {
                            const iValue = isTruthyItem(iNetwork.currentValue);
                            const weValue = isTruthyItem(weNetwork.currentValue);

                            if (weValue) {
                                if (iNetwork.valueConflict) {
                                    memComp.outSignal = null;
                                }
                                else {
                                    memComp.outSignal = castBool(iValue);
                                }
                            }
                        }
                    }
                    slotComp.slots[2].value = memComp.outSignal;

                    break;
                }

                case enumMemoryType.jk: {
                    const jNetwork = slotComp.slots[0].linkedNetwork;
                    const kNetwork = slotComp.slots[1].linkedNetwork;
                    const clockNetwork = slotComp.slots[2].linkedNetwork;

                    if (!clockNetwork || clockNetwork.valueConflict) {
                        break;
                    }

                    const clockValue = isTruthyItem(clockNetwork.currentValue);

                    if (clockValue == memComp.lastFrameClockSignal) {
                        break;
                    }
                    memComp.lastFrameClockSignal = clockValue;
                    if (clockValue == false) {
                        break;
                    }

                    if (jNetwork && jNetwork.valueConflict || kNetwork && kNetwork.valueConflict) {
                        memComp.outSignal = BOOL_FALSE_SINGLETON;
                        slotComp.slots[3].value = null;
                        slotComp.slots[4].value = null;
                        continue;
                    }

                    const jValue = jNetwork ? isTruthyItem(jNetwork.currentValue) : false;
                    const kValue = kNetwork ? isTruthyItem(kNetwork.currentValue) : false;

                    if (jValue && !kValue) {
                        memComp.outSignal = BOOL_TRUE_SINGLETON;
                    }
                    else if (!jValue && kValue) {
                        memComp.outSignal = BOOL_FALSE_SINGLETON;
                    }
                    else if (jValue && kValue) {
                        memComp.outSignal = castBool(!isTruthyItem(memComp.outSignal));
                    }

                    slotComp.slots[3].value = memComp.outSignal;
                    slotComp.slots[4].value = castBool(!isTruthyItem(memComp.outSignal));

                    break;
                }

                case enumMemoryType.t: {
                    const tNetwork = slotComp.slots[0].linkedNetwork;
                    if (tNetwork && tNetwork.valueConflict) {
                        memComp.outSignal = BOOL_FALSE_SINGLETON;
                        slotComp.slots[1].value = null;
                        continue;
                    }

                    const tValue = tNetwork ? isTruthyItem(tNetwork.currentValue) : false;

                    if (tValue == memComp.lastFrameClockSignal) {
                        break;
                    }
                    memComp.lastFrameClockSignal = tValue;
                    if (tValue) {
                        memComp.outSignal = castBool(!isTrueItem(memComp.outSignal));
                    }
                    slotComp.slots[1].value = memComp.outSignal;

                    break;
                }
            }
        }
    }
}
