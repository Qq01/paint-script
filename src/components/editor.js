import {elem, text} from "../utils.js";

export function makeEditor() {
    const defaultFunctionText = `//Script No. 0
ps.resizeView(256, 256);
loop(() => {
    let time = performance.now();
    let b = Math.sin(time * 0.001);
    ps.eachPixel(data => {
    data.rgba[0] = data.u;
        data.rgba[1] = data.v;
    data.rgba[2] = b;
        data.rgba[3] = 1;
    });
});`;

    const $editorContainer = elem('div');
    $editorContainer.classList.add('ps-editor-container');
    const codeMirror = CodeMirror($editorContainer, {
        lineNumbers: true,
        value: defaultFunctionText,
        viewportMargin: Infinity
    });
    $editorContainer.editor = codeMirror;
    return $editorContainer;
}