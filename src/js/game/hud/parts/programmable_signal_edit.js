import { DialogWithForm } from "../../../core/modal_dialog_elements";
import { FormElementInput } from "../../../core/modal_dialog_forms";
import { STOP_PROPAGATION } from "../../../core/signal";
import { Vector } from "../../../core/vector";
import { T } from "../../../translations";
import { BaseItem } from "../../base_item";
import { enumMouseButton } from "../../camera";
import { Entity } from "../../entity";
import { BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON } from "../../items/boolean_item";
import { BaseHUDPart } from "../base_hud_part";

export class HUDProgrammableSignalEdit extends BaseHUDPart {
    initialize() {
        this.root.camera.downPreHandler.add(this.downPreHandler, this);
    }

    /**
     * @param {Vector} pos
     * @param {enumMouseButton} button
     */
    downPreHandler(pos, button) {
        if (this.root.currentLayer !== "regular") {
            return;
        }

        const tile = this.root.camera.screenToWorld(pos).toTileSpace();
        const contents = this.root.map.getLayerContentXY(tile.x, tile.y, "regular");
        if (contents) {
            const signalComp = contents.components.ProgrammableSignal;
            if (signalComp) {
                if (button === enumMouseButton.left) {
                    this.editProgrammableSignal(contents, {
                        deleteOnCancel: false,
                    });
                    return STOP_PROPAGATION;
                }
            }
        }
    }

    /**
     * Asks the entity to enter a valid signal code
     * @param {Entity} entity
     * @param {object} param0
     * @param {boolean=} param0.deleteOnCancel
     */
    editProgrammableSignal(entity, { deleteOnCancel = true }) {
        if (!entity.components.ProgrammableSignal) {
            return;
        }

        // Ok, query, but also save the uid because it could get stale
        const uid = entity.uid;

        const signalList = entity.components.ProgrammableSignal.signalList;

        const signalValueInput = new FormElementInput({
            id: "signalListValue",
            label: T.dialogs.editProgrammableSignal.description,
            placeholder: "",
            defaultValue: signalList ? signalList.map(it => it.getAsCopyableKey()).join(", ") : "",
            validator: val => this.parseSignalListCode(entity, val),
        });

        // TODO maybe add this back in a way where you can keep selecting 0 or 1 and building the signal without having to type
        // const items = [BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON];

        // const itemInput = new FormElementItemChooser({
        //     id: "signalListItem",
        //     label: null,
        //     items,
        // });

        const dialog = new DialogWithForm({
            app: this.root.app,
            title: T.dialogs.editProgrammableSignal.title,
            desc: "",
            formElements: [signalValueInput],
            buttons: ["cancel:bad:escape", "ok:good:enter"],
            closeButton: false,
        });
        this.root.hud.parts.dialogs.internalShowDialog(dialog);

        // When confirmed, set the signal
        const closeHandler = () => {
            if (!this.root || !this.root.entityMgr) {
                // Game got stopped
                return;
            }

            const entityRef = this.root.entityMgr.findByUid(uid, false);
            if (!entityRef) {
                // outdated
                return;
            }

            const signalComp = entityRef.components.ProgrammableSignal;
            if (!signalComp) {
                // no longer interesting
                return;
            }

            signalComp.signalList = this.parseSignalListCode(entity, signalValueInput.getValue());
        };

        dialog.buttonSignals.ok.add(() => {
            closeHandler();
        });
        dialog.valueChosen.add(() => {
            dialog.closeRequested.dispatch();
            closeHandler();
        });

        // When cancelled, destroy the entity again
        if (deleteOnCancel) {
            dialog.buttonSignals.cancel.add(() => {
                if (!this.root || !this.root.entityMgr) {
                    // Game got stopped
                    return;
                }

                const entityRef = this.root.entityMgr.findByUid(uid, false);
                if (!entityRef) {
                    // outdated
                    return;
                }

                const signalComp = entityRef.components.ProgrammableSignal;
                if (!signalComp) {
                    // no longer interesting
                    return;
                }

                this.root.logic.tryDeleteBuilding(entityRef);
            });
        }
    }

    /**
     * Tries to parse a signal code
     * @param {Entity} entity
     * @param {string} codes
     * @returns {BaseItem[]}
     */
    parseSignalListCode(entity, codes) {
        if (!this.root || !this.root.shapeDefinitionMgr) {
            // Stale reference
            return null;
        }

        codes = codes.replace(/\s/, "");
        const values = codes.split(",");

        let returnList = [];

        for (let code of values) {
            const codeLower = code.toLowerCase();

            if (code === "1" || codeLower === "true") {
                returnList.push(BOOL_TRUE_SINGLETON);
            } else if (code === "0" || codeLower === "false") {
                returnList.push(BOOL_FALSE_SINGLETON);
            }
            // Couldn't parse the value
            else {
                returnList = null;
                break;
            }
        }

        return returnList;
    }
}
