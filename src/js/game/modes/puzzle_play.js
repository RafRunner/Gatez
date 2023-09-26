/* typehints:start */
import { GameRoot } from "../root";
/* typehints:end */

import { enumGameModeIds } from "../game_mode";
import { PuzzleGameMode } from "./puzzle";
import { MetaDisplayBuilding } from "../buildings/display";
import { MetaLeverBuilding } from "../buildings/lever";
import { MetaConstantProducerBuilding } from "../buildings/constant_producer";
import { MetaGoalAcceptorBuilding } from "../buildings/goal_acceptor";
import { PuzzleSerializer } from "../../savegame/puzzle_serializer";
import { T } from "../../translations";
import { HUDPuzzlePlayMetadata } from "../hud/parts/puzzle_play_metadata";
import { createLogger } from "../../core/logging";
import { HUDPuzzleCompleteNotification } from "../hud/parts/puzzle_complete_notification";
import { HUDPuzzlePlaySettings } from "../hud/parts/puzzle_play_settings";
import { MetaBlockBuilding } from "../buildings/block";
import { MetaBuilding } from "../meta_building";
import { gMetaBuildingRegistry } from "../../core/global_registries";
import { HUDPuzzleNextPuzzle } from "../hud/parts/next_puzzle";
import { MetaProgrammableSignalBuilding } from "../buildings/programmable_signal";
import { MetaProgrammableAcceptorBuilding } from "../buildings/programmable_acceptor";
import {
    getAllProgrammableAcceptorComponents,
    getAllProgrammableSignalComponents,
} from "../../core/logic_simulation_helper";
import { FormElementInput } from "../../core/modal_dialog_forms";
import trim from "trim";
import { DialogWithForm } from "../../core/modal_dialog_elements";
import { puzzleDescriptionMaxlegth, puzzleTitleRegex } from "../hud/constants";

const logger = createLogger("puzzle-play");
const copy = require("clipboard-copy");

export class PuzzlePlayGameMode extends PuzzleGameMode {
    static getId() {
        return enumGameModeIds.puzzlePlay;
    }

    /**
     * @param {GameRoot} root
     * @param {object} payload
     * @param {import("../../savegame/savegame_typedefs").PuzzleFullData} payload.puzzle
     * @param {Array<number> | undefined} payload.nextPuzzles
     */
    constructor(root, { puzzle, nextPuzzles }) {
        super(root);

        /** @type {Array<typeof MetaBuilding>} */
        let excludedBuildings = [
            MetaConstantProducerBuilding,
            MetaProgrammableSignalBuilding,
            MetaProgrammableAcceptorBuilding,
            MetaGoalAcceptorBuilding,
            MetaBlockBuilding,

            MetaLeverBuilding,
            MetaDisplayBuilding,
        ];

        // List of variant ids of excluded buildings
        if (puzzle.game.excludedBuildings) {
            /**
             * @type {any}
             */
            const puzzleHidden = puzzle.game.excludedBuildings
                .map(id => {
                    if (!gMetaBuildingRegistry.hasId(id)) {
                        return;
                    }
                    return gMetaBuildingRegistry.findById(id).constructor;
                })
                .filter(x => !!x);
            excludedBuildings = excludedBuildings.concat(puzzleHidden);
        }

        this.hiddenBuildings = excludedBuildings;

        this.additionalHudParts.puzzlePlayMetadata = HUDPuzzlePlayMetadata;
        this.additionalHudParts.puzzlePlaySettings = HUDPuzzlePlaySettings;
        this.additionalHudParts.puzzleCompleteNotification = HUDPuzzleCompleteNotification;

        root.signals.postLoadHook.add(this.loadPuzzle, this);

        this.puzzle = puzzle;

        /**
         * @type {Array<number>}
         */
        this.nextPuzzles = nextPuzzles || [];

        if (this.nextPuzzles.length > 0) {
            this.additionalHudParts.puzzleNext = HUDPuzzleNextPuzzle;
        }
    }

    loadPuzzle() {
        let errorText;
        logger.log("Loading puzzle", this.puzzle);

        try {
            this.zoneWidth = this.puzzle.game.bounds.w;
            this.zoneHeight = this.puzzle.game.bounds.h;
            errorText = new PuzzleSerializer().deserializePuzzle(this.root, this.puzzle.game);
        } catch (ex) {
            errorText = ex.message || ex;
        }

        if (errorText) {
            this.root.gameState.moveToState("PuzzleMenuState", {
                error: {
                    title: T.dialogs.puzzleLoadError.title,
                    desc: T.dialogs.puzzleLoadError.desc + " " + errorText,
                },
            });
            return;
        }

        this.root.hud.parts.buildingPlacer.lockedVariants =
            this.puzzle.game.excludedBuildingsVariations || [];

        this.root.signals.populateTruthTableSignal.dispatch(
            getAllProgrammableSignalComponents(this.root),
            getAllProgrammableAcceptorComponents(this.root)
        );
    }

    /**
     *
     * @param {boolean} liked
     * @param {string} difficultyRating
     * @param {number} time
     * @param {number} componentsUsed
     */
    async trackCompleted(liked, difficultyRating, time, componentsUsed) {
        const closeLoading = this.root.hud.parts.dialogs.showLoadingDialog();

        return this.root.app.clientApi
            .apiCompletePuzzle(this.puzzle.meta.id, {
                time,
                liked,
                difficultyRating,
                componentsUsed,
            })
            .catch(err => {
                logger.warn("Failed to complete puzzle:", err);
            })
            .then(data => {
                // add data.trophies to local storage
                if (data && data.trophies) {
                    localStorage.setItem("trophies", data.trophies.toString());
                }
                closeLoading();
            });
    }

    sharePuzzle() {
        const puzzleId = this.puzzle.meta.id.toString();
        copy(puzzleId);

        this.root.hud.parts.dialogs.showInfo(
            T.dialogs.puzzleShare.title,
            T.dialogs.puzzleShare.desc.replace("<key>", puzzleId)
        );
    }

    reportPuzzle() {
        const { optionSelected } = this.root.hud.parts.dialogs.showOptionChooser(
            T.dialogs.puzzleReport.title,
            {
                options: [
                    { value: "profane", text: T.dialogs.puzzleReport.options.profane },
                    { value: "unsolvable", text: T.dialogs.puzzleReport.options.unsolvable },
                    { value: "trolling", text: T.dialogs.puzzleReport.options.trolling },
                ],
            }
        );

        optionSelected.add(option => {
            const closeLoading = this.root.hud.parts.dialogs.showLoadingDialog();

            this.root.app.clientApi.apiReportPuzzle(this.puzzle.meta.id, option).then(
                () => {
                    this.root.hud.parts.dialogs.showInfo(
                        T.dialogs.puzzleReportComplete.title,
                        T.dialogs.puzzleReportComplete.desc
                    );
                },
                err => {
                    closeLoading();
                    this.root.hud.parts.dialogs.showInfo(
                        T.dialogs.puzzleReportError.title,
                        T.dialogs.puzzleReportError.desc + " " + err
                    );
                }
            );
        });
    }

    suggestPuzzleTranslation() {
        const titleInput = new FormElementInput({
            id: "titleInput",
            label: T.dialogs.suggestTranslation.descName,
            placeholder: T.dialogs.submitPuzzle.placeholderName,
            defaultValue: "",
            validator: val => trim(val).match(puzzleTitleRegex),
        });

        // TODO use a rich text box with multi line support and a smaller font
        const descriptionInput = new FormElementInput({
            id: "descriptionInput",
            label: T.dialogs.suggestTranslation.descDescription,
            placeholder: T.dialogs.submitPuzzle.placeholderDescription,
            defaultValue: "",
            validator: val => trim(val).length < puzzleDescriptionMaxlegth,
        });

        const dialog = new DialogWithForm({
            app: this.root.app,
            title: T.dialogs.suggestTranslation.title,
            desc: "",
            formElements: [titleInput, descriptionInput],
            buttons: ["ok:good:enter"],
        });
        this.root.hud.parts.dialogs.internalShowDialog(dialog);

        dialog.buttonSignals.ok.add(() => {
            const closeLoading = this.root.hud.parts.dialogs.showLoadingDialog();
            const paylaod = {
                title: trim(titleInput.getValue()),
                description: trim(descriptionInput.getValue()),
                puzzleId: this.puzzle.meta.id,
                locale: this.root.app.settings.getLanguage(),
            };
            this.root.app.clientApi.apiSuggestTranslation(paylaod).then(
                () => {
                    closeLoading();
                    this.root.hud.parts.dialogs.showInfo(
                        T.dialogs.suggestTranslation.completeTitle,
                        T.dialogs.suggestTranslation.completeDesc
                    );
                },
                e => {
                    this.root.hud.parts.dialogs.showInfo(
                        T.dialogs.suggestTranslation.errorTitle,
                        T.dialogs.suggestTranslation.errorDesc + " " + e
                    );
                }
            );
        });
    }
}
