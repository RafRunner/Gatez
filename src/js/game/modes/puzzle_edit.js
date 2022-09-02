/* typehints:start */
import { GameRoot } from "../root";
/* typehints:end */

import { enumGameModeIds } from "../game_mode";
import { PuzzleGameMode } from "./puzzle";
import { MetaStorageBuilding } from "../buildings/storage";
import { MetaReaderBuilding } from "../buildings/reader";
import { MetaFilterBuilding } from "../buildings/filter";
import { MetaDisplayBuilding } from "../buildings/display";
import { MetaLeverBuilding } from "../buildings/lever";
import { MetaItemProducerBuilding } from "../buildings/item_producer";
import { MetaMinerBuilding } from "../buildings/miner";
import { MetaConstantSignalBuilding } from "../buildings/constant_signal";
import { HUDPuzzleEditorControls } from "../hud/parts/puzzle_editor_controls";
import { HUDPuzzleEditorReview } from "../hud/parts/puzzle_editor_review";
import { HUDPuzzleEditorSettings } from "../hud/parts/puzzle_editor_settings";
import { HUDConstantSignalEdit } from "../hud/parts/constant_signal_edit";
import { HUDProgrammableSignalEdit } from "../hud/parts/programmable_signal_edit";
import { HUDProgrammableAcceptorEdit } from "../hud/parts/programmable_acceptor_edit";
import { HUDNotifications } from "../hud/parts/notifications";

export class PuzzleEditGameMode extends PuzzleGameMode {
    static getId() {
        return enumGameModeIds.puzzleEdit;
    }

    static getSchema() {
        return {};
    }

    /** @param {GameRoot} root */
    constructor(root) {
        super(root);

        this.hiddenBuildings = [
            MetaStorageBuilding,
            MetaReaderBuilding,
            MetaFilterBuilding,
            MetaDisplayBuilding,
            MetaLeverBuilding,
            MetaItemProducerBuilding,
            MetaMinerBuilding,

            MetaConstantSignalBuilding,
        ];

        this.additionalHudParts.puzzleEditorControls = HUDPuzzleEditorControls;
        this.additionalHudParts.puzzleEditorReview = HUDPuzzleEditorReview;
        this.additionalHudParts.puzzleEditorSettings = HUDPuzzleEditorSettings;
        this.additionalHudParts.constantSignalEdit = HUDConstantSignalEdit;
        this.additionalHudParts.editProgrammableSignal = HUDProgrammableSignalEdit;
        this.additionalHudParts.editProgrammableAcceptor = HUDProgrammableAcceptorEdit;
        this.additionalHudParts.notification = HUDNotifications;
    }

    getIsEditor() {
        return true;
    }
}
