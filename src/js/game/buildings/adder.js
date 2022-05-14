/**
 * Originally taken from https://github.com/SkimnerPhi/wires-plus
 * Thanks to SkimnerPhi for providing the original code and art associated with this file
 */

import { enumDirection, Vector } from "../../core/vector";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { Entity } from "../entity";
import { MetaBuilding, defaultBuildingVariant } from "../meta_building";
import { GameRoot } from "../root";
import { enumHubGoalRewards } from "../tutorial_goals";
import { AdderComponent, enumAdderType } from "../components/adder";

/** @enum {string} */
export const enumAdderVariants = {
    half: "half",
    full: "full",
};

/** @enum {string} */
const enumVariantToAdder = {
    [defaultBuildingVariant]: enumAdderType.half,
    [enumAdderVariants.full]: enumAdderType.full,
};

export class MetaAdderBuilding extends MetaBuilding {

    constructor() {
        super("adder");
    }

    static getAllVariantCombinations() {
        return [
            {
                internalId: 424,
                variant: defaultBuildingVariant,
            },
            {
                internalId: 425,
                variant: enumAdderVariants.full,
            },
        ];
    }

    getAvailableVariants() {
        return [
            defaultBuildingVariant,
            enumAdderVariants.full,
        ];
    }

    getSilhouetteColor() {
        return "#A251FF";
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_logic_gates);
    }

    /** @returns {"wires"} **/
    getLayer() {
        return "wires";
    }

    getDimensions() {
        return new Vector(2, 1);
    }

    getRenderPins() {
        return false;
    }

    /**
     * @param {Entity} entity
     * @param {number} rotationVariant
     */
     updateVariants(entity, rotationVariant, variant) {
        const adderType = enumVariantToAdder[variant];
        entity.components.Adder.type = adderType;

        const pinComp = entity.components.WiredPins;

        switch (adderType) {
            case enumAdderType.half: {
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
                        pos: new Vector(1, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                        type: enumPinSlotType.logicalEjector,
                    },
                ]);
                break;
            }

            case enumAdderType.full: {
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
                        pos: new Vector(1, 0),
                        direction: enumDirection.right,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                        type: enumPinSlotType.logicalEjector,
                    },
                ]);
                break;
            }

            default:
                assertAlways("unknown adder type: " + adderType);
        }
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(
            new WiredPinsComponent({
                slots: [],
            })
        );

        entity.addComponent(new AdderComponent({}));
    }
}
