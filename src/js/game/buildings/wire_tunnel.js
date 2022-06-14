import { generateMatrixRotations } from "../../core/utils";
import { enumDirection, Vector } from "../../core/vector";
import { WireTunnelComponent } from "../components/wire_tunnel";
import { Entity } from "../entity";
import { defaultBuildingVariant, MetaBuilding } from "../meta_building";
import { GameRoot } from "../root";
import { enumHubGoalRewards } from "../tutorial_goals";

/** @enum {string} */
export const enumWireTunnelVariants = {
    [defaultBuildingVariant]: defaultBuildingVariant,
    cross: "cross",
    forward: "forward",
    turn: "turn",
    double_turn: "double_turn",
    swap: "swap",
};

const overlayMatrices = {
    [defaultBuildingVariant]: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 1, 0]),
    forward: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
    turn: generateMatrixRotations([0, 0, 0, 0, 1, 1, 0, 1, 0]),
    double_turn: generateMatrixRotations([1, 1, 0, 1, 0, 1, 0, 1, 1]),
    swap: null,
};

export class MetaWireTunnelBuilding extends MetaBuilding {
    constructor() {
        super("wire_tunnel");
    }

    static getAllVariantCombinations() {
        return [
            {
                internalId: 39,
                variant: defaultBuildingVariant,
            },
            {
                internalId: 428,
                variant: enumWireTunnelVariants.forward,
            },
            {
                internalId: 429,
                variant: enumWireTunnelVariants.turn,
            },
            {
                internalId: 430,
                variant: enumWireTunnelVariants.double_turn,
            },
            {
                internalId: 431,
                variant: enumWireTunnelVariants.swap,
            },
        ];
    }

    getAvailableVariants() {
        return [
            defaultBuildingVariant,
            enumWireTunnelVariants.forward,
            enumWireTunnelVariants.turn,
            enumWireTunnelVariants.double_turn,
            enumWireTunnelVariants.swap,
        ];
    }

    getSilhouetteColor() {
        return "#777a86";
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_wires_painter_and_levers);
    }

    /**
     *
     * @param {number} rotation
     * @param {number} rotationVariant
     * @param {string} variant
     * @param {Entity} entity
     */
    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant, entity) {
        return overlayMatrices[variant][rotation];
    }

    getIsRotateable() {
        return true;
    }

    getDimensions(variant) {
        if (variant == enumWireTunnelVariants.swap) {
            return new Vector(2, 1);
        }
        return new Vector(1, 1);
    }

    updateVariants(entity, rotationVariant, variant) {
        const tunnelType = enumWireTunnelVariants[variant];
        entity.components.WireTunnel.type = tunnelType;

        switch (tunnelType) {
            case defaultBuildingVariant: {
                this.connections = [
                    [
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.top,
                        },
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.bottom,
                        },
                    ],
                    [
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.left,
                        },
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.right,
                        },
                    ],
                ];
                break;
            }
            case enumWireTunnelVariants.forward: {
                this.connections = [
                    [
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.top,
                        },
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.bottom,
                        },
                    ],
                ];
                break;
            }
            case enumWireTunnelVariants.turn: {
                this.connections = [
                    [
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.right,
                        },
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.bottom,
                        },
                    ],
                ];
                break;
            }
            case enumWireTunnelVariants.double_turn: {
                this.connections = [
                    [
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.top,
                        },
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.left,
                        },
                    ],
                    [
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.right,
                        },
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.bottom,
                        },
                    ],
                ];
                break;
            }
            case enumWireTunnelVariants.swap: {
                this.connections = [
                    [
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.top,
                        },
                        {
                            pos: new Vector(1, 0),
                            direction: enumDirection.bottom,
                        },
                    ],
                    [
                        {
                            pos: new Vector(1, 0),
                            direction: enumDirection.top,
                        },
                        {
                            pos: new Vector(0, 0),
                            direction: enumDirection.bottom,
                        },
                    ],
                ];
                break;
            }
        }

        // Generate reverse lookups
        this.connections = this.connections.flatMap(c => [
            {
                from: c[0],
                to: c[1]
            },
            {
                from: c[1],
                to: c[0]
            },
        ]);
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(new WireTunnelComponent());
    }
}
