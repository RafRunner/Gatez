// Puzzle icons are drawn as a small chip with one pin per input (left) and output (right).
// The backend stores the number of inputs/outputs in the puzzle's shortKey as "io:<inputs>:<outputs>".

const MAX_PINS_PER_SIDE = 6;

/**
 * Parses an "io:<inputs>:<outputs>" icon key
 * @param {string} shortKey
 * @returns {{ inputs: number, outputs: number }|null}
 */
export function parsePuzzleIconKey(shortKey) {
    const match = /^io:(\d+):(\d+)$/.exec(shortKey || "");
    if (!match) {
        return null;
    }
    return { inputs: Number(match[1]), outputs: Number(match[2]) };
}

/**
 * @param {number} inputs
 * @param {number} outputs
 * @returns {string}
 */
export function buildPuzzleIconKey(inputs, outputs) {
    return `io:${inputs}:${outputs}`;
}

/**
 * Draws pins evenly distributed along one side of the chip
 * @param {CanvasRenderingContext2D} context
 * @param {number} count
 * @param {number} x Start x of the pins
 * @param {number} length Pin length (negative to go left)
 * @param {number} top
 * @param {number} height
 * @param {string} color
 */
function drawPins(context, count, x, length, top, height, color) {
    const shown = Math.min(count, MAX_PINS_PER_SIDE);
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 5;
    context.lineCap = "round";

    for (let i = 0; i < shown; i++) {
        const y = top + (height * (i + 1)) / (shown + 1);
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + length, y);
        context.stroke();

        context.beginPath();
        context.arc(x + length, y, 4, 0, Math.PI * 2);
        context.fill();
    }
}

/**
 * CanvasRenderingContext2D.roundRect is not available in older Electron versions
 * @param {CanvasRenderingContext2D} context
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r
 */
function roundedRect(context, x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
}

/**
 * Generates a canvas with the icon of a puzzle
 * @param {string} shortKey
 * @param {number} size Canvas size in pixels
 * @param {object} [options]
 * @param {boolean} [options.locked] Draws a padlock instead of the inputs/outputs text
 * @returns {HTMLCanvasElement}
 */
export function generatePuzzleIcon(shortKey, size, { locked = false } = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");
    // Draw in a 100x100 space
    context.scale(size / 100, size / 100);

    const io = parsePuzzleIconKey(shortKey) || { inputs: 2, outputs: 1 };

    const bodyColor = locked ? "#9a9da8" : "#3d4152";
    const inputColor = locked ? "#b5b8c2" : "rgb(74, 151, 223)";
    const outputColor = locked ? "#b5b8c2" : "#66bb6a";

    const bodyX = 26;
    const bodyY = 18;
    const bodyW = 48;
    const bodyH = 64;

    drawPins(context, io.inputs, bodyX, -16, bodyY, bodyH, inputColor);
    drawPins(context, io.outputs, bodyX + bodyW, 16, bodyY, bodyH, outputColor);

    // Chip body
    context.fillStyle = bodyColor;
    roundedRect(context, bodyX, bodyY, bodyW, bodyH, 7);
    context.fill();

    // Orientation notch
    context.fillStyle = "rgba(255, 255, 255, 0.25)";
    context.beginPath();
    context.arc(50, bodyY, 7, 0, Math.PI);
    context.fill();

    context.fillStyle = "#fff";
    context.textAlign = "center";
    context.textBaseline = "middle";

    if (locked) {
        // Padlock
        context.fillRect(40, 50, 20, 16);
        context.strokeStyle = "#fff";
        context.lineWidth = 4;
        context.beginPath();
        context.arc(50, 50, 7, Math.PI, 0);
        context.stroke();
    } else {
        context.font = "bold 15px GameFont";
        context.fillText(`${io.inputs}→${io.outputs}`, 50, 54);
    }

    return canvas;
}
