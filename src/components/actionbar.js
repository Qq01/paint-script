import {elem, text} from "../utils.js";

export function makeActionbar() {
    const $ab = elem('div');
    $ab.classList.add('ps-actionbar');
    function makeAction(name, label) {
        const $action = elem('div', text(label));
        $action.classList.add('ps-actionbar__action');
        $action.dataset.action = name;
        $action.onclick = function(){
            $ab.dispatchEvent(new CustomEvent(`action:${name}`));
        }
        $ab.appendChild($action);
    }
    makeAction('run', 'Run');
    makeAction('save', 'Save');
    makeAction('load', 'Load');
    return $ab;
}