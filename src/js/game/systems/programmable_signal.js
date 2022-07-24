import { Loader } from "../../core/loader";
import { ProgrammableSignalComponent } from "../components/programmable_signal";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { MapChunkView } from "../map_chunk_view";
import { castBool } from "../items/boolean_item";

export class ProgrammableSignalSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [ProgrammableSignalComponent]);

        // TODO create a new HUD or modify this one to accept a list of signals (and maybe multiple bit numbers)
        this.root.signals.entityManuallyPlaced.add(entity => {
            const editorHud = this.root.hud.parts.editProgrammableSignal;
            if (editorHud) {
                editorHud.editProgrammableSignal(entity, { deleteOnCancel: true });
            }
        });

        this.spriteOn = Loader.getSprite("sprites/wires/programmable_signal_on.png");
        this.spriteOff = Loader.getSprite("sprites/buildings/programmable_signal.png");
    }

    update() {
        if (!this.root.inSimulation) {
            for (let i = 0; i < this.allEntities.length; ++i) {
                const entity = this.allEntities[i];
                const signalComp = entity.components.ProgrammableSignal;
                const pinsComp = entity.components.WiredPins;

                // Simply sync the status to the first slot
                pinsComp.slots[0].value = castBool(signalComp.toggled);
            }
            return;
        }
        if (this.allEntities.length === 0) {
            this.root.inSimulation = false;
            this.root.currentSimulationFrame = 0;
            return;
        }

        const currentSimulationFrame = this.root.currentSimulationFrame;
        const sampleSignalComp = this.allEntities[0].components.ProgrammableSignal;

        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const signalComp = entity.components.ProgrammableSignal;
            const pinsComp = entity.components.WiredPins;

            const currentOutput = signalComp.signalList[Math.floor(currentSimulationFrame / 10)];

            if (pinsComp) {
                pinsComp.slots[0].value = currentOutput;
            }
        }

        if (sampleSignalComp.signalList.length <= Math.floor(currentSimulationFrame + 1 / 10)) {
            this.root.inSimulation = false;
            this.root.currentSimulationFrame = 0;
            return;
        }

        this.root.currentSimulationFrame++;
    }

    /**
     * Draws a given chunk
     * @param {import("../../core/draw_utils").DrawParameters} parameters
     * @param {MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntitiesByLayer.regular;

        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];
            const signalComp = entity.components.ProgrammableSignal;

            if (signalComp) {
                const sprite = signalComp.toggled ? this.spriteOn : this.spriteOff;
                entity.components.StaticMapEntity.drawSpriteOnBoundsClipped(parameters, sprite);
            }
        }
    }
}
