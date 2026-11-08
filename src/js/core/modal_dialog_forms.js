import { BaseItem } from "../game/base_item";
import { ClickDetector } from "./click_detector";
import { Signal } from "./signal";
import { escapeHTML } from "./utils";

/*
 * ***************************************************
 *
 *  LEGACY CODE WARNING
 *
 *  This is old code from yorg3.io and needs to be refactored
 *  @TODO
 *
 * ***************************************************
 */

export class FormElement {
    constructor(id, label) {
        this.id = id;
        this.label = label;

        this.valueChosen = new Signal();
    }

    getHtml() {
        abstract;
        return "";
    }

    getFormElement(parent) {
        return parent.querySelector("[data-formId='" + this.id + "']");
    }

    bindEvents(parent, clickTrackers) {
        abstract;
    }

    focus() {}

    isValid() {
        return true;
    }

    /** @returns {any} */
    getValue() {
        abstract;
    }
}

export class FormElementInput extends FormElement {
    constructor({
        id,
        label = null,
        placeholder,
        defaultValue = "",
        inputType = "text",
        validator = null,
        maxlength = 256,
    }) {
        super(id, label);
        this.placeholder = placeholder;
        this.defaultValue = defaultValue;
        this.inputType = inputType;
        this.validator = validator;

        this.element = null;
        this.maxlength = maxlength;
    }

    getHtml() {
        let classes = [];
        let inputType = "text";
        let maxlength = this.maxlength;
        switch (this.inputType) {
            case "text": {
                classes.push("input-text");
                break;
            }

            case "email": {
                classes.push("input-email");
                inputType = "email";
                break;
            }

            case "token": {
                classes.push("input-token");
                inputType = "text";
                maxlength = 4;
                break;
            }

            case "password": {
                classes.push("input-text");
                inputType = "password";
                break;
            }
        }

        return `
            <div class="formElement input">
                ${this.label ? `<label>${this.label}</label>` : ""}
                <input
                    type="${inputType}"
                    value="${this.defaultValue.replace(/["\\]+/gi, "")}"
                    maxlength="${maxlength}"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    class="${classes.join(" ")}"
                    placeholder="${this.placeholder.replace(/["\\]+/gi, "")}"
                    data-formId="${this.id}">
            </div>
        `;
    }

    bindEvents(parent, clickTrackers) {
        this.element = this.getFormElement(parent);
        this.element.addEventListener("input", event => this.updateErrorState());
        this.updateErrorState();
    }

    updateErrorState() {
        this.element.classList.toggle("errored", !this.isValid());

        // profanity filter
        if (G_WEGAME_VERSION) {
            const value = String(this.element.value);

            ipcRenderer.invoke("profanity-check", value).then(newValue => {
                if (value !== newValue && this.element) {
                    this.element.value = newValue;
                }
            });
        }
    }

    isValid() {
        return !this.validator || this.validator(this.element.value);
    }

    getValue() {
        return this.element.value;
    }

    setValue(value) {
        this.element.value = value;
        this.updateErrorState();
    }

    focus() {
        this.element.focus();
        this.element.select();
    }
}

/**
 * Multi line text input. Enter inserts a line break instead of confirming the dialog.
 */
export class FormElementTextArea extends FormElement {
    /**
     * @param {object} param0
     * @param {string} param0.id
     * @param {string=} param0.label
     * @param {string=} param0.placeholder
     * @param {string=} param0.defaultValue
     * @param {((value: string) => boolean)=} param0.validator
     * @param {number=} param0.maxlength
     * @param {number=} param0.rows
     */
    constructor({
        id,
        label = null,
        placeholder = "",
        defaultValue = "",
        validator = null,
        maxlength = 1000,
        rows = 5,
    }) {
        super(id, label);
        this.placeholder = placeholder;
        this.defaultValue = defaultValue;
        this.validator = validator;
        this.maxlength = maxlength;
        this.rows = rows;

        /** @type {HTMLTextAreaElement} */
        this.element = null;
        /** @type {HTMLElement} */
        this.counter = null;
    }

    getHtml() {
        return `
            <div class="formElement input textArea">
                ${this.label ? `<label>${this.label}</label>` : ""}
                <textarea
                    rows="${this.rows}"
                    maxlength="${this.maxlength}"
                    autocomplete="off"
                    spellcheck="true"
                    class="input-text"
                    placeholder="${escapeHTML(this.placeholder)}"
                    data-formId="${this.id}">${escapeHTML(this.defaultValue)}</textarea>
                <span class="counter"></span>
            </div>
        `;
    }

    bindEvents(parent, clickTrackers) {
        this.element = /** @type {HTMLTextAreaElement} */ (this.getFormElement(parent));
        this.counter = this.element.parentElement.querySelector(".counter");
        this.element.addEventListener("input", () => this.updateErrorState());
        this.updateErrorState();
    }

    updateErrorState() {
        this.element.classList.toggle("errored", !this.isValid());
        this.counter.innerText = `${this.element.value.length} / ${this.maxlength}`;
    }

    isValid() {
        return !this.validator || this.validator(this.element.value);
    }

    getValue() {
        return this.element.value;
    }

    setValue(value) {
        this.element.value = value;
        this.updateErrorState();
    }

    focus() {
        this.element.focus();
        // Put the cursor at the end
        const length = this.element.value.length;
        this.element.setSelectionRange(length, length);
    }
}

export class FormElementCheckbox extends FormElement {
    constructor({ id, label, defaultValue = true }) {
        super(id, label);
        this.defaultValue = defaultValue;
        this.value = this.defaultValue;

        this.element = null;
    }

    getHtml() {
        return `
            <div class="formElement checkBoxFormElem">
            ${this.label ? `<label>${this.label}</label>` : ""}
                <div class="checkbox ${this.defaultValue ? "checked" : ""}" data-formId='${this.id}'>
                    <span class="knob"></span >
                </div >
            </div>
        `;
    }

    bindEvents(parent, clickTrackers) {
        this.element = this.getFormElement(parent);
        const detector = new ClickDetector(this.element, {
            consumeEvents: false,
            preventDefault: false,
        });
        clickTrackers.push(detector);
        detector.click.add(this.toggle, this);
    }

    getValue() {
        return this.value;
    }

    toggle() {
        this.value = !this.value;
        this.element.classList.toggle("checked", this.value);
    }

    focus(parent) {}
}

export class FormElementItemChooser extends FormElement {
    /**
     *
     * @param {object} param0
     * @param {string} param0.id
     * @param {string=} param0.label
     * @param {Array<BaseItem>} param0.items
     */
    constructor({ id, label, items = [] }) {
        super(id, label);
        this.items = items;
        this.element = null;

        /**
         * @type {BaseItem}
         */
        this.chosenItem = null;
    }

    getHtml() {
        let classes = [];

        return `
            <div class="formElement">
                ${this.label ? `<label>${this.label}</label>` : ""}
                <div class="ingameItemChooser input" data-formId="${this.id}"></div>
            </div>
            `;
    }

    /**
     * @param {HTMLElement} parent
     * @param {Array<ClickDetector>} clickTrackers
     */
    bindEvents(parent, clickTrackers) {
        this.element = this.getFormElement(parent);

        for (let i = 0; i < this.items.length; ++i) {
            const item = this.items[i];

            const canvas = document.createElement("canvas");
            canvas.width = 128;
            canvas.height = 128;
            const context = canvas.getContext("2d");
            item.drawFullSizeOnCanvas(context, 128);
            this.element.appendChild(canvas);

            const detector = new ClickDetector(canvas, {});
            clickTrackers.push(detector);
            detector.click.add(() => {
                this.chosenItem = item;
                this.valueChosen.dispatch(item);
            });
        }
    }

    isValid() {
        return true;
    }

    getValue() {
        return null;
    }

    focus() {}
}
