/**
 *
 * @param {string} tagName
 * @param  {...HTMLElement} childs
 * @returns {HTMLElement}
 */
export function elem(tagName, ...childs) {
    const $el = document.createElement(tagName);
    childs.forEach($c => {
        $el.appendChild($c);
    });
    return $el;
}
/**
 * 
 * @param {string} txt 
 */
export function text(txt) {
    return document.createTextNode(txt);
}