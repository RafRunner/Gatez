import { STOP_PROPAGATION } from "../../../core/signal";
import { Vector } from "../../../core/vector";
import { enumMouseButton } from "../../camera";
import { BaseHUDPart } from "../base_hud_part";

export class HUDProgrammableSignalClick extends BaseHUDPart {
    initialize() {
        this.root.camera.downPreHandler.add(this.downPreHandler, this);
    }

    /**
     * @param {Vector} pos
     * @param {enumMouseButton} button
     */
    downPreHandler(pos, button) {
        const tile = this.root.camera.screenToWorld(pos).toTileSpace();
        const contents = this.root.map.getLayerContentXY(tile.x, tile.y, "regular");

        if (!contents) {
            return;
        }

        const signalComp = contents.components.ProgrammableSignal;
        if (!signalComp) {
            return;
        }
        // TODO maybe we'll need to stop the simulation on any click on anything or suspend other clicks during simulation
        if (this.root.inSimulation) {
            return;
        }
        if (!this.root.gameMode.getIsEditor()) {
            // taken from lever_toggle.js
            if (button === enumMouseButton.left) {
                signalComp.toggled = !signalComp.toggled;
                return STOP_PROPAGATION;
            } else if (button === enumMouseButton.right) {
                if (!this.root.hud.parts.buildingPlacer.currentMetaBuilding) {
                    this.root.logic.tryDeleteBuilding(contents);
                }
                return STOP_PROPAGATION;
            }
        } else if (button === enumMouseButton.middle) {
            signalComp.toggled = !signalComp.toggled;
            return STOP_PROPAGATION;
        }
    }
}
