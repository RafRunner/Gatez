import { enumDirection, Vector } from "../../core/vector";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { Entity } from "../entity";
import { defaultBuildingVariant, MetaBuilding } from "../meta_building";
import { LeverComponent } from "../components/lever";

export class MetaLeverBuilding extends MetaBuilding {
    constructor() {
        super("lever");
    }

    static getAllVariantCombinations() {
        return [
            {
                internalId: 33,
                variant: defaultBuildingVariant,
            },
        ];
    }

    getSilhouetteColor() {
        // @todo: Render differently based on if its activated or not
        return "#1a678b";
    }

    getDimensions() {
        return new Vector(1, 1);
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

        entity.addComponent(new LeverComponent({}));
    }
}
