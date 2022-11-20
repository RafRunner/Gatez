import { GameState } from "../core/game_state";
import { cachebust } from "../core/cachebust";
import { THIRDPARTY_URLS } from "../core/config";
import { getLogoSprite } from "../core/background_resources_loader";

export class MobileWarningState extends GameState {
    constructor() {
        super("MobileWarningState");
    }

    getInnerHTML() {
        return `

            <img class="logo" src="${cachebust("res/" + getLogoSprite())}" alt="Gatez Logo">

            <p>
                I'm sorry, but Gatez is not available on mobile devices yet!
                There is also no estimate when this will change, but feel to make a contribution! It's
                &nbsp;<a href="${THIRDPARTY_URLS.github}" target="_blank">open source</a>!
            </p>
        `;
    }

    getThemeMusic() {
        return null;
    }

    getHasFadeIn() {
        return false;
    }

    onEnter() {
        try {
            if (window.gtag) {
                window.gtag("event", "click", {
                    event_category: "ui",
                    event_label: "mobile_warning",
                });
            }
        } catch (ex) {
            console.warn("Failed to track mobile click:", ex);
        }
    }
    onLeave() {
        // this.dialogs.cleanup();
    }
}
