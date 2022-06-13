/**
 * Originally taken from https://github.com/SkimnerPhi/wires-plus
 * Thanks to SkimnerPhi for providing the original code and art associated with this file
 */

import { generateMatrixRotations } from "../../core/utils";
import { enumDirection, Vector } from "../../core/vector";
import { EdgeDetectorComponent, enumEdgeDetectorType } from "../components/edge_detector";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { Entity } from "../entity";
import { defaultBuildingVariant, MetaBuilding } from "../meta_building";
import { enumHubGoalRewards } from "../tutorial_goals";

const overlayMatrices = {
    [defaultBuildingVariant]: generateMatrixRotations([1, 1, 0, 1, 1, 0, 0, 1, 0]),
    [enumEdgeDetectorType.falling]: generateMatrixRotations([0, 1, 0, 0, 1, 1, 0, 0, 1]),
    [enumEdgeDetectorType.change]: generateMatrixRotations([1, 1, 0, 1, 0, 0, 1, 1, 0])
};

export class MetaEdgeDetectorBuilding extends MetaBuilding {
    constructor() {
        super("edge_detector");
    }

    static getAllVariantCombinations() {
        return [
            {
                internalId: 428,
                variant: defaultBuildingVariant,
            },
            {
                internalId: 429,
                variant: enumEdgeDetectorType.falling,
            },
            {
                internalId: 430,
                variant: enumEdgeDetectorType.change,
            },
        ];
    }

    getSilhouetteColor() {
        return "#8FB8C6";
    }

    getAvailableVariants(root) {
        return [defaultBuildingVariant, enumEdgeDetectorType.falling, enumEdgeDetectorType.change];
    }

    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant) {
        return overlayMatrices[variant][rotation];
    }

    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_logic_gates);
    }

    /** @returns {"wires"} **/
    getLayer() {
        return "wires";
    }

    getDimensions() {
        return new Vector(1, 1);
    }

    getRenderPins() {
        return false;
    }

    /**
     * @param {Entity} entity
     * @param {number} rotationVariant
     */
    updateVariants(entity, rotationVariant, variant) {
        const edgeDetectorType = enumEdgeDetectorType[variant];
        entity.components.EdgeDetector.type = edgeDetectorType;
    }

    setupEntityComponents(entity) {
        entity.addComponent(
            new WiredPinsComponent({
                slots: [
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
                ],
            })
        );

        entity.addComponent(new EdgeDetectorComponent({}));
    }
}
