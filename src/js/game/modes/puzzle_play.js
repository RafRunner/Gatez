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
        }
    }

    /**
     *
     * @param {boolean} liked
     * @param {number} difficultyRating
     * @param {number} time
     */
    trackCompleted(liked, difficultyRating, time) {
        const closeLoading = this.root.hud.parts.dialogs.showLoadingDialog();

        // TODO send other information here
        return this.root.app.clientApi
            .apiCompletePuzzle(this.puzzle.meta.id, {
                time,
                liked,
                difficultyRating,
            })
            .catch(err => {
                logger.warn("Failed to complete puzzle:", err);
            })
            .then(() => {
                closeLoading();
            });
    }

    // TODO this is an example of an "alert box", but we should remove it since we're not going to use shortKeys as unique
    sharePuzzle() {
        copy(this.puzzle.meta.shortKey);

        this.root.hud.parts.dialogs.showInfo(
            T.dialogs.puzzleShare.title,
            T.dialogs.puzzleShare.desc.replace("<key>", this.puzzle.meta.shortKey)
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

        return new Promise(resolve => {
            optionSelected.add(option => {
                const closeLoading = this.root.hud.parts.dialogs.showLoadingDialog();

                this.root.app.clientApi.apiReportPuzzle(this.puzzle.meta.id, option).then(
                    () => {
                        closeLoading();
                        const { ok } = this.root.hud.parts.dialogs.showInfo(
                            T.dialogs.puzzleReportComplete.title,
                            T.dialogs.puzzleReportComplete.desc
                        );
                        ok.add(resolve);
                    },
                    err => {
                        closeLoading();
                        const { ok } = this.root.hud.parts.dialogs.showInfo(
                            T.dialogs.puzzleReportError.title,
                            T.dialogs.puzzleReportError.desc + " " + err
                        );
                    }
                );
            });
        });
    }
}
