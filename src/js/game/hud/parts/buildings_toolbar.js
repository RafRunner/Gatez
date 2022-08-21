import { MetaDisplayBuilding } from "../../buildings/display";
import { MetaLeverBuilding } from "../../buildings/lever";
import { HUDBaseToolbar } from "./base_toolbar";
import { MetaBlockBuilding } from "../../buildings/block";
import { MetaProgrammableSignalBuilding } from "../../buildings/programmable_signal";
import { MetaProgrammableAcceptorBuilding } from "../../buildings/programmable_acceptor";
import { MetaWireBuilding } from "../../buildings/wire";
import { MetaLogicGateBuilding } from "../../buildings/logic_gate";
import { MetaWireTunnelBuilding } from "../../buildings/wire_tunnel";
import { MetaFourInputLogicGateBuilding } from "../../buildings/four_input_logic_gate";
import { MetaAdderBuilding } from "../../buildings/adder";
import { MetaMultiplexerBuilding } from "../../buildings/multiplexer";
import { MetaEdgeDetectorBuilding } from "../../buildings/edge_detector";
import { MetaMemoryBuilding } from "../../buildings/memory";

export class HUDBuildingsToolbar extends HUDBaseToolbar {
    constructor(root) {
        super(root, {
            primaryBuildings: [
                MetaProgrammableSignalBuilding,
                MetaProgrammableAcceptorBuilding,
                MetaWireBuilding,
                MetaWireTunnelBuilding,
                MetaLogicGateBuilding,
                MetaFourInputLogicGateBuilding,
                MetaMultiplexerBuilding,
                MetaAdderBuilding,
                MetaEdgeDetectorBuilding,
                MetaMemoryBuilding,
                MetaBlockBuilding,
            ],
            secondaryBuildings: [MetaLeverBuilding, MetaDisplayBuilding],
            visibilityCondition: () =>
                !this.root.camera.getIsMapOverlayActive() && this.root.currentLayer === "regular",
            htmlElementId: "ingame_HUD_BuildingsToolbar",
        });
    }
}
