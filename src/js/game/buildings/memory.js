/**
 * Originally taken from https://github.com/SkimnerPhi/wires-plus
 * Thanks to SkimnerPhi for providing the original code and art associated with this file
 */

import { generateMatrixRotations } from "../../core/utils";
import { enumDirection, Vector } from "../../core/vector";
import { enumMemoryType, MemoryComponent } from "../components/memory";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { defaultBuildingVariant, MetaBuilding } from "../meta_building";
import { enumHubGoalRewards } from "../tutorial_goals";


const overlayMatrices = {
    [enumMemoryType.t]: generateMatrixRotations([0, 1, 0, 1, 0, 1, 1, 1, 1]),
};

export class MetaMemoryBuilding extends MetaBuilding {
    constructor() {
        super("memory");
    }

    static getAllVariantCombinations() {
        return [
            {
                internalId: 431,
                variant: defaultBuildingVariant,
            },
            {
                internalId: 432,
                variant: enumMemoryType.d,
            },
            {
                internalId: 433,
                variant: enumMemoryType.jk,
            },
            {
                internalId: 434,
                variant: enumMemoryType.t,
            },
        ];
    }

    getSilhouetteColor() {
        return "#80B3FF";
    }

    getAvailableVariants(root) {
        return [
            defaultBuildingVariant,
            enumMemoryType.d,
            enumMemoryType.jk,
            enumMemoryType.t,
        ];
    }

    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant) {
        return overlayMatrices[variant] ? overlayMatrices[variant][rotation] : null;
    }

    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_logic_gates);
    }

    /** @returns {"wires"} **/
    getLayer() {
        return "wires";
    }

    getDimensions(variant) {
        switch (variant) {
            case defaultBuildingVariant:
                case enumMemoryType.d:
            case enumMemoryType.jk:
                return new Vector(2, 1);
            case enumMemoryType.t:
                return new Vector(1, 1);
        }
    }

    getRenderPins() {
        return false;
    }

    updateVariants(entity, rotationVariant, variant) {
        const memoryType = enumMemoryType[variant];
        entity.components.Memory.type = memoryType;
        entity.components.Memory.clear();

        const pinComp = entity.components.WiredPins;

        switch (variant) {
            case defaultBuildingVariant:
                pinComp.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                ]);
                break;

            case enumMemoryType.jk:
                pinComp.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    // Clock input
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.right,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                ]);
                break;

            case enumMemoryType.t:
                pinComp.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                ]);
                break;

            case enumMemoryType.d:
                pinComp.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.right,
                        type: enumPinSlotType.logicalEjector,
                    },
                ]);
                break;
        }
    }

    setupEntityComponents(entity) {
        entity.addComponent(
            new WiredPinsComponent({
                slots: [],
            })
        );

        entity.addComponent(new MemoryComponent({}));
    }
}
