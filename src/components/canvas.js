import {elem, text} from "../utils.js";

export function makeCanvas() {
    const $canvas = elem('canvas');
    $canvas.classList.add('ps-canvas');
    return $canvas;
}