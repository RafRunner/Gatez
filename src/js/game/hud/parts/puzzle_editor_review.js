import { createLogger } from "../../../core/logging";
import { DialogWithForm } from "../../../core/modal_dialog_elements";
import { FormElementInput, FormElementItemChooser } from "../../../core/modal_dialog_forms";
import { STOP_PROPAGATION } from "../../../core/signal";
import { makeDiv } from "../../../core/utils";
import {
    buildFailedTestsString,
    countComponentsUsed,
    validatePuzzle,
} from "../../../core/logic_simulation_helper";
import { PuzzleSerializer } from "../../../savegame/puzzle_serializer";
import { T } from "../../../translations";
import { StaticMapEntityComponent } from "../../components/static_map_entity";
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

    initialize() {
        this.root.signals.puzzleCompleteSubmit.add(wasSuccessful => {
            if (wasSuccessful) {
                this.startSubmit();
            } else {
                let failedTests = buildFailedTestsString(this.root);

                this.root.hud.parts.dialogs.showWarning(
                    T.dialogs.puzzleCompleteEdit.titleFail,
                    T.dialogs.puzzleCompleteEdit.descFail.replace("<failed-tests>", failedTests)
                );
            }
        }, this);
    }

    startReview() {
        let validationError = null;

        // Check if all buildings are within the area
        const entities = this.root.entityMgr.getAllWithComponent(StaticMapEntityComponent);
        for (const entity of entities) {
            if (this.root.systemMgr.systems.zone.prePlacementCheck(entity) === STOP_PROPAGATION) {
                validationError = T.puzzleMenu.validation.buildingOutOfBounds;
            }
        }

        if (validationError) {
            this.root.hud.parts.dialogs.showWarning(T.puzzleMenu.validation.title, validationError);
            return;
        }

        validatePuzzle(this.root, T, () => {
            this.root.validatingSubmit = true;
            this.root.inSimulation = true;
        });
    }

    startSubmit(title = "", description = "", maxComponents = "") {
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

        const componentsUsed = countComponentsUsed(this.root);

        const maxComponentsInput = new FormElementInput({
            id: "maxComponentsInput",
            label: T.dialogs.submitPuzzle.descDescription,
            placeholder: T.dialogs.submitPuzzle.placeholderDescription,
            defaultValue: maxComponents,
            validator: val => val === "" || (/^[0-9]+$/.test(val) && new Number(val) >= componentsUsed),
            maxlength: 3,
        });

        const dialog = new DialogWithForm({
            app: this.root.app,
            title: T.dialogs.submitPuzzle.title,
            desc: "",
            formElements: [nameInput, descriptionInput, maxComponentsInput],
            buttons: ["ok:good:enter"],
        });

        this.root.hud.parts.dialogs.internalShowDialog(dialog);

        dialog.buttonSignals.ok.add(() => {
            const title = trim(nameInput.getValue());
            const shortKey = randomItem.getHash();
            const description = trim(descriptionInput.getValue());
            const maxComponentsValue = maxComponentsInput.getValue();

            const maxComponents = maxComponentsValue === "" ? undefined : new Number(maxComponentsValue);

            this.doSubmitPuzzle(title, shortKey, description, componentsUsed, maxComponents);
        });
    }

    checkIfSuccessfullAndSubmit(wasSuccessful) {}

    doSubmitPuzzle(title, shortKey, description, minimumComponents, maximumComponents) {
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
                minimumComponents,
                maximumComponents,
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
                    signals.retry.add(() => this.startSubmit(title, description, maximumComponents));
                }
            );
    }
}
