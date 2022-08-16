import { globalConfig } from "../../core/config";
import { Loader } from "../../core/loader";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { MapChunkView } from "../map_chunk_view";
import { isTruthyItem } from "../items/boolean_item";
import { ProgrammableAcceptorComponent } from "../components/programmable_acceptor";
import { getCurrentSimulationStep, isSamplingFrame } from "../../core/logic_simulation_helper";

export class ProgrammableAcceptorSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [ProgrammableAcceptorComponent]);

        this.root.signals.entityManuallyPlaced.add(entity => {
            const editorHud = this.root.hud.parts.editProgrammableAcceptor;
            if (editorHud) {
                editorHud.editExpectedSignal(entity, { deleteOnCancel: true });
            }
        });

        this.root.signals.simulationComplete.add(this.computeSimulationResults, this);
        this.spriteOn = Loader.getSprite("sprites/wires/display/white.png");
    }

    update() {
        if (!this.root.inSimulation) {
            return;
        }

        if (this.allEntities.length === 0) {
            this.root.inSimulation = false;
            this.root.currentSimulationFrame = 0;
            return;
        }

        if (!isSamplingFrame(this.root)) {
            return;
        }

        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const acceptorComp = entity.components.ProgrammableAcceptor;

            const currentSimulationStep = getCurrentSimulationStep(this.root);
            if (currentSimulationStep === 0) {
                acceptorComp.simulationResults = [];
            }

            const expectedSignal = acceptorComp.expectedSignals[currentSimulationStep];

            const pinsComp = entity.components.WiredPins;
            const slot = pinsComp.slots[0];
            const network = slot.linkedNetwork;

            if (network) {
                // We consider conflicts errors no matter what. TODO maybe add some special treatment
                if (network.valueConflict) {
                    acceptorComp.simulationResults.push(false);
                    continue;
                }

                // If the expected signal is "don't care", we consider it a success
                if (expectedSignal === null) {
                    acceptorComp.simulationResults.push(true);
                    continue;
                }

                if (network.currentValue === expectedSignal) {
                    acceptorComp.simulationResults.push(true);
                } else {
                    acceptorComp.simulationResults.push(false);
                }
            } else {
                // The acceptor is not connected
                acceptorComp.simulationResults.push(false);
            }
        }
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

            if (entity && entity.components.ProgrammableAcceptor) {
                const pinsComp = entity.components.WiredPins;
                const network = pinsComp.slots[0].linkedNetwork;

                if (!network || !network.hasValue()) {
                    continue;
                }

                const value = isTruthyItem(network.currentValue) ? this.spriteOn : null;

                if (!value) {
                    continue;
                }

                const origin = entity.components.StaticMapEntity.origin;
                value.drawCachedCentered(
                    parameters,
                    (origin.x + 0.5) * globalConfig.tileSize,
                    (origin.y + 0.5) * globalConfig.tileSize,
                    globalConfig.tileSize
                );
            }
        }
    }

    /**
     * Determines whether all programmable signals got the expected signal on all steps and dispatches the appropriate signal
     */
    computeSimulationResults() {
        let wasSuccessful = true;
        const isEditorMode = this.root.gameMode.getIsEditor();

        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const acceptorComp = entity.components.ProgrammableAcceptor;

            if (acceptorComp.simulationResults.some(it => it === false)) {
                wasSuccessful = false;
                break;
            }
        }

        if (isEditorMode) {
            if (this.root.validatingSubmit) {
                this.root.signals.puzzleCompleteSubmit.dispatch(wasSuccessful);
                this.root.validatingSubmit = false;
            } else {
                this.root.signals.puzzleCompleteEdit.dispatch(wasSuccessful);
            }
        } else {
            this.root.signals.puzzleComplete.dispatch(wasSuccessful);
        }
    }
}
