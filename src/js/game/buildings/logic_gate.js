import { enumDirection, Vector } from "../../core/vector";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { Entity } from "../entity";
import { MetaBuilding, defaultBuildingVariant } from "../meta_building";
import { enumLogicGateType, LogicGateComponent } from "../components/logic_gate";
import { generateMatrixRotations } from "../../core/utils";

/** @enum {string} */
export const enumLogicGateVariants = {
    nand: "nand",
    not: "not",
    xor: "xor",
    or: "or",
    nor: "nor",
};

/** @enum {string} */
const enumVariantToGate = {
    [defaultBuildingVariant]: enumLogicGateType.and,
    [enumLogicGateVariants.nand]: enumLogicGateType.nand,
    [enumLogicGateVariants.not]: enumLogicGateType.not,
    [enumLogicGateVariants.xor]: enumLogicGateType.xor,
    [enumLogicGateVariants.or]: enumLogicGateType.or,
    [enumLogicGateVariants.nor]: enumLogicGateType.nor,
};

const overlayMatrices = {
    [defaultBuildingVariant]: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 1, 1]),
    [enumLogicGateVariants.nand]: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 1, 1]),
    [enumLogicGateVariants.xor]: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 1, 1]),
    [enumLogicGateVariants.or]: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 1, 1]),
    [enumLogicGateVariants.nor]: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 1, 1]),
    [enumLogicGateVariants.not]: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
};

const colors = {
    [defaultBuildingVariant]: "#f48d41",
    [enumLogicGateVariants.nand]: "#f4a241",
    [enumLogicGateVariants.xor]: "#f4a241",
    [enumLogicGateVariants.or]: "#f4d041",
    [enumLogicGateVariants.nor]: "#f4d041",
    [enumLogicGateVariants.not]: "#f44184",
};

export class MetaLogicGateBuilding extends MetaBuilding {
    constructor() {
        super("logic_gate");
    }

    static getAllVariantCombinations() {
        return [
            {
                internalId: 32,
                variant: defaultBuildingVariant,
            },
            {
                internalId: 420,
                variant: enumLogicGateVariants.nand,
            },
            {
                internalId: 34,
                variant: enumLogicGateVariants.not,
            },
            {
                internalId: 35,
                variant: enumLogicGateVariants.xor,
            },
            {
                internalId: 36,
                variant: enumLogicGateVariants.or,
            },
            {
                internalId: 421,
                variant: enumLogicGateVariants.nor,
            },
        ];
    }

    getSilhouetteColor(variant) {
        return colors[variant];
    }

    getDimensions() {
        return new Vector(1, 1);
    }

    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant) {
        return overlayMatrices[variant][rotation];
    }

    getAvailableVariants() {
        return [
            defaultBuildingVariant,
            enumLogicGateVariants.nand,
            enumLogicGateVariants.or,
            enumLogicGateVariants.nor,
            enumLogicGateVariants.not,
            enumLogicGateVariants.xor,
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

        switch (gateType) {
            case enumLogicGateType.and:
            case enumLogicGateType.nand:
            case enumLogicGateType.xor:
            case enumLogicGateType.or:
            case enumLogicGateType.nor: {
                pinComp.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.right,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ]);
                break;
            }

            case enumLogicGateType.not: {
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
                ]);
                break;
            }

            default:
                assertAlways("unknown logic gate type: " + gateType);
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

        entity.addComponent(new LogicGateComponent({}));
    }
}
