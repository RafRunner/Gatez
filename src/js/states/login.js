import { GameState } from "../core/game_state";
import { getRandomHint } from "../game/hints";
import { HUDModalDialogs } from "../game/hud/parts/modal_dialogs";
import { T } from "../translations";

export class LoginState extends GameState {
    constructor() {
        super("LoginState");
    }

    getInnerHTML() {
        return `
        <div class="loadingImage"></div>
        <div class="loadingStatus">
            <span class="desc">${T.global.loggingIn}</span>
            </div>
        </div>
        <span class="prefab_GameHint"></span>
        `;
    }

    /**
     *
     * @param {object} payload
     * @param {string} payload.nextStateId
     * @param {string} payload.name
     * @param {string} payload.password
     */
    onEnter(payload) {
        this.payload = payload;
        if (!this.payload.nextStateId) {
            throw new Error("No next state id");
        }

        if (this.app.clientApi.isLoggedIn()) {
            this.finishLoading();
            return;
        }

        this.dialogs = new HUDModalDialogs(null, this.app);
        const dialogsElement = document.body.querySelector(".modalDialogParent");
        this.dialogs.initializeToElement(dialogsElement);

        this.htmlElement.classList.add("prefab_LoadingState");

        /** @type {HTMLElement} */
        this.hintsText = this.htmlElement.querySelector(".prefab_GameHint");
        this.lastHintShown = -1000;
        this.nextHintDuration = 0;

        this.tryLogin(payload.name, payload.password);
    }

    tryLogin(name, password) {
        this.app.clientApi.tryLogin(name, password).then(success => {
            console.log("Logged in:", success);

            if (!success) {
                const signals = this.dialogs.showWarning(
                    T.dialogs.offlineMode.title,
                    T.dialogs.offlineMode.desc,
                    ["retry", "returnToMenu:bad"]
                );
                signals.retry.add(() => setTimeout(() => this.tryLogin(name, password), 2000), this);
                signals.returnToMenu.add(this.goToPreviousState, this);
                this.app.isLoggedIn = false;
            } else {
                this.finishLoading();
                this.app.isLoggedIn = true;
            }
        });
    }

    finishLoading() {
        this.moveToState(this.payload.nextStateId);
    }

    goToPreviousState() {
        this.moveToState(this.getDefaultPreviousState());
    }

    getDefaultPreviousState() {
        return "MainMenuState";
    }

    update() {
        const now = performance.now();
        if (now - this.lastHintShown > this.nextHintDuration) {
            this.lastHintShown = now;
            const hintText = getRandomHint();

            this.hintsText.innerHTML = hintText;

            /**
             * Compute how long the user will need to read the hint.
             * We calculate with 130 words per minute, with an average of 5 chars
             * that is 650 characters / minute
             */
            this.nextHintDuration = Math.max(2500, (hintText.length / 650) * 60 * 1000);
        }
    }

    onRender() {
        this.update();
    }

    onBackgroundTick() {
        this.update();
    }
}
