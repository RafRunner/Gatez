/**
 * Originally taken from https://github.com/SkimnerPhi/wires-plus
 * Thanks to SkimnerPhi for providing the original code and art associated with this file
 */

import { enumDirection, Vector } from "../../core/vector";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { MetaBuilding, defaultBuildingVariant } from "../meta_building";
import { GameRoot } from "../root";
import { enumHubGoalRewards } from "../tutorial_goals";
import { enumMultiplexerType, MultiplexerComponent } from "../components/multiplexer";
import { Entity } from "../entity";

export class MetaMultiplexerBuilding extends MetaBuilding {

    constructor() {
        super("multiplexer");
    }

    static getAllVariantCombinations() {
        return [
            {
                internalId: 426,
                variant: defaultBuildingVariant,
            },
            {
                internalId: 427,
                variant: enumMultiplexerType.demuxer,
            },
        ];
    }

    getSilhouetteColor() {
        return "#FF75FC";
    }

    getAvailableVariants() {
        return [defaultBuildingVariant, enumMultiplexerType.demuxer];
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_logic_gates);
    }

    getDimensions() {
        return new Vector(2, 1);
    }

    getRenderPins() {
        return false;
    }

    updateVariants(entity, rotationVariant, variant) {
        const muxerType = enumMultiplexerType[variant];
        entity.components.Multiplexer.type = muxerType;

        const pinComp = entity.components.WiredPins;

        switch (variant) {
            case defaultBuildingVariant:
                pinComp.setSlots([
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.right,
                        type: enumPinSlotType.logicalAcceptor,
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
                        pos: new Vector(1, 0),
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalEjector,
                    },
                ]);
                break;
            case enumMultiplexerType.demuxer:
                pinComp.setSlots([
                    {
                        pos: new Vector(1, 0),
                        direction: enumDirection.right,
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

        entity.addComponent(new MultiplexerComponent({}));
    }
}
