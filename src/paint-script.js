/**
 * 
 * @param {string} tagName 
 * @param  {...HTMLElement} childs 
 * @returns {HTMLElement}
 */
function elem(tagName, ...childs) {
    const $el = document.createElement(tagName);
    childs.forEach($c => {
        $el.appendChild($c);
    });
    return $el;
}
function text(txt) {
    return document.createTextNode(txt);
}
function makeTabs() {
    const tabClass = 'ps-tabs__tab';
    const tabSelectedClass = 'ps-tabs__tab--selected';
    const addTabClass = 'ps-tabs__add-tab';
    function addTab({dispatchEvents = true} = {}) {
        console.log('dispatch', dispatchEvents);
        const index = $tabs.tabCount++;
        const $tab = elem('div', text(index));
        $tab.dataset.tabIndex = index;
        $tab.classList.add(tabClass);
        $tab.onclick = function(){selectTab(index)};
        $tabs.lastChild.insertAdjacentElement('beforebegin', $tab);
        if (dispatchEvents) {
            $tabs.dispatchEvent(new CustomEvent('tabs:add', {detail: {index}}));
        }
        selectTab(index, {dispatchEvents});
    }
    function selectTab(index, {dispatchEvents = true} = {}) {
        const prevTab = $tabs.querySelector(`.${tabSelectedClass}`);
        if (prevTab) {
            prevTab.classList.remove(tabSelectedClass);
        }
        const nextTab = $tabs.querySelector(`.${tabClass}[data-tab-index="${index}"]`);
        if (nextTab) {
            nextTab.classList.add(tabSelectedClass);
            $tabs.selectedTabIndex = index;
        }
        if (dispatchEvents) {
            $tabs.dispatchEvent(new CustomEvent('tabs:change', {detail: {
                prevTabIndex: prevTab && prevTab.dataset.tabIndex ? Number.parseInt(prevTab.dataset.tabIndex) : null,
                nextTabIndex: nextTab ? index : null
            }}));
        }
    }
    function clearTabs() {
        $tabs.tabCount = 0;
        $tabs.selectedTabIndex = 0;
        $tabs.querySelectorAll(`.${tabClass}:not(.${addTabClass})`).forEach($t => {
            $tabs.removeChild($t);
        });
    }
    const $addTab = elem('div', text('Add'));
    $addTab.onclick = addTab;
    $addTab.classList.add(addTabClass, tabClass);
    const $tabs = elem('div', $addTab);
    $tabs.classList.add('ps-tabs');
    $tabs.addTab = e => addTab({dispatchEvents: false});
    $tabs.tabCount = 0;
    $tabs.selectedTabIndex = 0;
    addTab();
    $tabs.clearTabs = clearTabs;
    return $tabs;
}
function makeEditor() {
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
    const codeMirror = CodeMirror($editorContainer, {lineNumbers: true, value: defaultFunctionText});
    $editorContainer.editor = codeMirror;
    return $editorContainer;
}
function makeCanvas() {
    const $canvas = elem('canvas');
    $canvas.classList.add('ps-canvas');
    return $canvas;
}
function makeActionbar() {
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

export class PaintScript {
    /**
     * @type {PaintScriptAPI}
     */
    #api;
    /**
     * 
     * @param {HTMLElement} $root 
     */
    constructor($root) {
        this.#api = new PaintScriptAPI(this);
        this.$root = $root;
        this.scripts = [];
        this.actions = [];
        this.storage = {};
        this.$actionbar = makeActionbar();
        this.$root.appendChild(this.$actionbar);
        this.$tabs = makeTabs();
        this.$root.appendChild(this.$tabs);
        this.$editorContainer = makeEditor();
        this.$root.appendChild(this.$editorContainer);
        this.$editorContainer.editor.refresh();
        this.scripts.push(this.$editorContainer.editor.getDoc());
        this.$canvas = makeCanvas();
        this.width = this.$canvas.width;
        this.height = this.$canvas.height;
        this.$root.appendChild(this.$canvas);
        /**
         * @type {CanvasRenderingContext2D}
         */
        this.ctx = this.$canvas.getContext('2d');

        this.$tabs.addEventListener('tabs:add', e => {
            this.scripts.push(new CodeMirror.Doc(`//Script No. ${this.scripts.length}`, "javascript"));
        })
        this.$tabs.addEventListener('tabs:change', e => {
            if (e.detail.nextTabIndex != null) {
                this.$editorContainer.editor.swapDoc(this.scripts[e.detail.nextTabIndex]);
                this.$editorContainer.editor.refresh();
            }
        });

        this.$actionbar.addEventListener('action:run', e => {
            if (this.loopId) {
                cancelAnimationFrame(this.loopId);
                this.loopId = null;
            }
            this.actions = [];
            try {
                this.scripts.forEach(s => {
                    const fn = new Function('ps', 'loop', s.getValue());
                    fn.bind(this.#api)(this.#api, (action) => {this.actions.push(action)});
                });
            } catch (e) {
                console.error(e);
            }
            if (this.actions.length) {
                this.loopId = requestAnimationFrame(this.loop);
            }
        });

        this.$actionbar.addEventListener('action:save', e => {
            localStorage.setItem('documents_count', this.scripts.length);
            this.scripts.forEach((s, i) => {
                try {
                    localStorage.setItem(`document_${i}`, s.getValue());
                } catch (e) {
                    alert(`document ${i} save failed`);
                }
            });
        });
        this.$actionbar.addEventListener('action:load', e => {
            if ( localStorage.getItem('documents_count') == null ) {
                alert('Cannot find files to load');
                return;
            }
            const count = Number.parseInt(localStorage.getItem('documents_count'));

            if (count > 0) {
                this.scripts = []; 
                this.$tabs.clearTabs();
                let i = 0;
                let lastDoc;
                while (i < count) {
                    console.log('loop', i, '<', count);
                    this.$tabs.addTab();
                    console.log('added tab');
                    const text = localStorage.getItem(`document_${i}`);
                    console.log(text);
                    lastDoc = this.scripts[i] = new CodeMirror.Doc(text, "javascript");
                    i++;
                }
                if (lastDoc) {
                    this.$editorContainer.editor.swapDoc(lastDoc);
                }
            }
        });
    }
    prevTime = null;
    deltaTime = null;
    time = null;
    loopId = null;
    loop = time => {
        if (this.prevTime == null) {
            this.prevTime = time;
        }
        this.deltaTime = time - this.prevTime;
        this.time = time;
        this.actions.forEach(action => action(this));
        this.loopId = requestAnimationFrame(this.loop);
    }
    resizeView = (width, height) => {
        this.width = this.$canvas.width = width;
        this.height = this.$canvas.height = height;
    }
}

class PaintScriptAPI {
    /**
     * @type {PaintScript}
     */
    #ps;
    /**
     * 
     * @param {PaintScript} paintScript 
     */
    constructor(paintScript) {
        this.#ps = paintScript;
    }
    resizeView = (width, height) => {
        this.#ps.resizeView(width, height);
    }
    get ctx() { return this.#ps.ctx;}
    eachPixel = fn => {
        const img = this.ctx.getImageData(0, 0, this.#ps.width, this.#ps.height);
        let x = 0;
        let y = 0;
        for (let i = 0; i < img.data.length; i += 4) {
            x = (i/4) % img.width;
            y = Math.floor((i/4)  / img.width);
            let rgba = Array.from(img.data.slice(i, i + 4));
            rgba = rgba.map(v => v / 255)
            let data = {
                rgba,
                x,
                y,
                u: x / img.width,
                v: y / img.height
            };
            fn(data);
            let j = (x + y * img.width) * 4;
            data.rgba = data.rgba.map(v => Math.min(255, Math.max(0, Math.round(v * 255))));
            img.data[j] = data.rgba[0];
            img.data[j + 1] = data.rgba[1];
            img.data[j + 2] = data.rgba[2];
            img.data[j + 3] = data.rgba[3];
        }
        this.ctx.putImageData(img, 0, 0);
    }
}