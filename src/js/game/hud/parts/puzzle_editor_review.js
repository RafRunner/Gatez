import { THIRDPARTY_URLS } from "../../../core/config";
import { createLogger } from "../../../core/logging";
import { DialogWithForm } from "../../../core/modal_dialog_elements";
import { FormElementInput, FormElementItemChooser } from "../../../core/modal_dialog_forms";
import { STOP_PROPAGATION } from "../../../core/signal";
import { fillInLinkIntoTranslation, makeDiv } from "../../../core/utils";
import { PuzzleSerializer } from "../../../savegame/puzzle_serializer";
import { T } from "../../../translations";
import { GoalAcceptorComponent } from "../../components/goal_acceptor";
import { ProgrammableAcceptorComponent } from "../../components/programmable_acceptor";
import { StaticMapEntityComponent } from "../../components/static_map_entity";
import { ShapeItem } from "../../items/shape_item";
import { ShapeDefinition } from "../../shape_definition";
import { BaseHUDPart } from "../base_hud_part";

const trim = require("trim");
const logger = createLogger("puzzle-review");

export class HUDPuzzleEditorReview extends BaseHUDPart {
    constructor(root) {
        super(root);
    }

    createElements(parent) {
        this.element = makeDiv(parent, "ingame_HUD_PuzzleEditorReview");
        this.button = document.createElement("button");
        this.button.classList.add("button");
        this.button.textContent = T.puzzleMenu.reviewPuzzle;
        this.element.appendChild(this.button);

        this.trackClicks(this.button, this.startReview);
    }

    initialize() {}

    startReview() {
        const validationError = this.validatePuzzle();
        if (validationError) {
            this.root.hud.parts.dialogs.showWarning(T.puzzleMenu.validation.title, validationError);
            return;
        }

        this.startSubmit();
    }

    startSubmit(title = "", shortKey = "", description = "") {
        const regex = /^[a-zA-Z0-9_\- ]{4,30}$/;
        const nameInput = new FormElementInput({
            id: "nameInput",
            label: T.dialogs.submitPuzzle.descName,
            placeholder: T.dialogs.submitPuzzle.placeholderName,
            defaultValue: title,
            validator: val => trim(val).match(regex) && trim(val).length > 0,
        });

        // TODO implement a better way to choose an icon (maybe of a gate/component) for the puzzle
        const randomItem = this.root.hubGoals.computeFreeplayShape(Math.round(10 + Math.random() * 10000));

        // TODO use a rich text box with multi line support and a smaller font
        const descriptionInput = new FormElementInput({
            id: "descriptionInput",
            label: T.dialogs.submitPuzzle.descDescription,
            placeholder: T.dialogs.submitPuzzle.placeholderDescription,
            defaultValue: description,
            validator: val => trim(val).length < 1000,
            maxlength: 1000,
        });

        const dialog = new DialogWithForm({
            app: this.root.app,
            title: T.dialogs.submitPuzzle.title,
            desc: "",
            formElements: [nameInput, descriptionInput],
            buttons: ["ok:good:enter"],
        });

        this.root.hud.parts.dialogs.internalShowDialog(dialog);

        dialog.buttonSignals.ok.add(() => {
            const title = trim(nameInput.getValue());
            const shortKey = randomItem.getHash();
            const description = trim(descriptionInput.getValue());
            this.doSubmitPuzzle(title, shortKey, description);
        });
    }

    doSubmitPuzzle(title, shortKey, description) {
        const serialized = new PuzzleSerializer().generateDumpFromGameRoot(this.root);

        logger.log("Submitting puzzle, title=", title, "shortKey=", shortKey);
        if (G_IS_DEV) {
            logger.log("Serialized data:", serialized);
        }

        const closeLoading = this.root.hud.parts.dialogs.showLoadingDialog(T.puzzleMenu.submittingPuzzle);

        this.root.app.clientApi
            .apiSubmitPuzzle({
                title,
                shortKey,
                description,
                data: serialized,
            })
            .then(
                () => {
                    closeLoading();
                    const { ok } = this.root.hud.parts.dialogs.showInfo(
                        T.dialogs.puzzleSubmitOk.title,
                        T.dialogs.puzzleSubmitOk.desc
                    );
                    ok.add(() => this.root.gameState.moveToState("PuzzleMenuState"));
                },
                err => {
                    closeLoading();
                    logger.warn("Failed to submit puzzle:", err);
                    const signals = this.root.hud.parts.dialogs.showWarning(
                        T.dialogs.puzzleSubmitError.title,
                        T.dialogs.puzzleSubmitError.desc + " " + err,
                        ["cancel", "retry:good"]
                    );
                    signals.retry.add(() => this.startSubmit(title, shortKey, description));
                }
            );
    }

    validatePuzzle() {
        // Check there is at least one programmable signal and acceptor
        const programmableAcceptor = this.root.entityMgr.getAllWithComponent(ProgrammableAcceptorComponent);

        // Check if all programmable acceptors are satisfied
        for (const acceptor of programmableAcceptor) {
            const acceptorComp = acceptor.components.ProgrammableAcceptor;

            if (acceptorComp.simulationResults.length === 0) {
                return T.puzzleMenu.validation.mustTestBefore;
            }

            if (acceptorComp.simulationResults.some(result => result === false)) {
                return T.puzzleMenu.validation.testMustPass;
            }
        }

        // Check if all buildings are within the area
        const entities = this.root.entityMgr.getAllWithComponent(StaticMapEntityComponent);
        for (const entity of entities) {
            if (this.root.systemMgr.systems.zone.prePlacementCheck(entity) === STOP_PROPAGATION) {
                return T.puzzleMenu.validation.buildingOutOfBounds;
            }
        }
    }
}
