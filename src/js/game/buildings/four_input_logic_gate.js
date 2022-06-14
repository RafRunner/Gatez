import { enumDirection, Vector } from "../../core/vector";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { Entity } from "../entity";
import { MetaBuilding, defaultBuildingVariant } from "../meta_building";
import { GameRoot } from "../root";
import { enumLogicGateType, LogicGateComponent } from "../components/logic_gate";
import { enumHubGoalRewards } from "../tutorial_goals";

/** @enum {string} */
export const enumFourInputLogicGateVariants = {
    or: "or",
};

/** @enum {string} */
const enumVariantToGate = {
    [defaultBuildingVariant]: enumLogicGateType.four_input_and,
    [enumFourInputLogicGateVariants.or]: enumLogicGateType.four_input_or,
};

const colors = {
    [defaultBuildingVariant]: "#f48d41",
    [enumFourInputLogicGateVariants.or]: "#f4d041",
};

export class MetaFourInputLogicGateBuilding extends MetaBuilding {
    constructor() {
        super("four_input_logic_gate");
    }

    static getAllVariantCombinations() {
        return [
            {
                internalId: 422,
                variant: defaultBuildingVariant,
            },
            {
                internalId: 423,
                variant: enumFourInputLogicGateVariants.or,
            },
        ];
    }

    getSilhouetteColor(variant) {
        return colors[variant];
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_logic_gates);
    }

    getDimensions() {
        return new Vector(4, 1);
    }

    getAvailableVariants() {
        return [
            defaultBuildingVariant,
            enumFourInputLogicGateVariants.or,
        ];
    }

    getRenderPins() {
        // We already have it included
        return false;
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     */
    updateVariants(entity, rotationVariant, variant) {
        const gateType = enumVariantToGate[variant];
        entity.components.LogicGate.type = gateType;

        const pinComp = entity.components.WiredPins;

        pinComp.setSlots([
            {
                pos: new Vector(0, 0),
                direction: enumDirection.top,
                type: enumPinSlotType.logicalEjector,
            },
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
                pos: new Vector(2, 0),
                direction: enumDirection.bottom,
                type: enumPinSlotType.logicalAcceptor,
            },
            {
                pos: new Vector(3, 0),
                direction: enumDirection.bottom,
                type: enumPinSlotType.logicalAcceptor,
            },
        ]);
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

        entity.addComponent(new LogicGateComponent({}));
    }
}
