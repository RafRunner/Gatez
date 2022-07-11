import { enumDirection, Vector } from "../../core/vector";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { Entity } from "../entity";
import { defaultBuildingVariant, MetaBuilding } from "../meta_building";
import { GameRoot } from "../root";
import { generateMatrixRotations } from "../../core/utils";
import { enumHubGoalRewards } from "../tutorial_goals";
import { ProgrammableSignalComponent } from "../components/programmable_signal";

const overlayMatrix = generateMatrixRotations([0, 1, 0, 1, 1, 1, 1, 1, 1]);

export class MetaProgrammableSignalBuilding extends MetaBuilding {
    constructor() {
        super("programmable_signal");
    }

    static getAllVariantCombinations() {
        return [
            {
                internalId: 435,
                variant: defaultBuildingVariant,
            },
        ];
    }

    getSilhouetteColor() {
        return "#2b84fd";
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_constant_signal);
    }

    getDimensions() {
        return new Vector(1, 1);
    }

    getRenderPins() {
        return false;
    }

    getSpecialOverlayRenderMatrix(rotation) {
        return overlayMatrix[rotation];
    }

    getSprite() {
        return null;
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(
            new WiredPinsComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                ],
            })
        );
        entity.addComponent(new ProgrammableSignalComponent({}));
    }
}
