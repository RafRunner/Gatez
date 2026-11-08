/* typehints:start */
import { GameRoot } from "../root";
/* typehints:end */

/**
 * Like the building tooltip: while the player is placing a building and the mouse is over the
 * side panel, the panel fades out and lets clicks through, so the area behind it can be built on.
 * Otherwise the panel stays opaque and interactive (scrolling, buttons).
 */
export class SidePanelFade {
    /**
     * @param {GameRoot} root
     * @param {HTMLElement} element
     */
    constructor(root, element) {
        this.root = root;
        this.element = element;
        this.faded = false;
    }

    /**
     * Call every frame
     */
    update() {
        const placer = this.root.hud.parts.buildingPlacer;
        const placing = Boolean(placer && placer.currentMetaBuilding.get());
        const mouse = this.root.app.mousePosition;

        let faded = false;
        if (placing && mouse) {
            const bounds = this.element.getBoundingClientRect();
            faded =
                mouse.x > bounds.left &&
                mouse.x < bounds.right &&
                mouse.y > bounds.top &&
                mouse.y < bounds.bottom;
        }

        if (faded !== this.faded) {
            this.faded = faded;
            this.element.classList.toggle("faded", faded);
        }
    }
}
