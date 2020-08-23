import {elem, text} from "../utils.js";

export function makeResourceContainer() {
    const $resourceContainer = elem('div');
    $resourceContainer.classList.add('ps-resource__container');
    $resourceContainer.style.display = 'none';
    return $resourceContainer;
}