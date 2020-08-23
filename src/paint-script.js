import { elem, text } from "./utils.js";
import { makeTabs } from "./components/tabs.js";
import { makeEditor } from "./components/editor.js";
import { makeCanvas } from "./components/canvas.js";
import { makeExampleList } from "./components/example-list.js";
import { makeActionbar } from "./components/actionbar.js";
import { makeResourceContainer } from "./components/resource-container.js";

export class PaintScript {
    /**
     * @type {PaintScriptAPI}
     */
    #api;
    /**
     * 
     * @type {UI}
     */
    #ui;
    get ui() {return this.#ui;}
    /**
     * 
     * @param {HTMLElement} $root 
     */
    constructor($root) {
        this.#api = new PaintScriptAPI(this);
        this.$root = $root;
        this.$root.classList.add('ps-container');
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
        this.$exampleList = makeExampleList();
        this.$root.appendChild(this.$exampleList);
        this.$canvas = makeCanvas();
        this.width = this.$canvas.width;
        this.height = this.$canvas.height;
        this.$appTabs = makeTabs(false, 'Canvas', 'Resources', 'Examples');
        this.$appTabs.classList.add('ps-tabs--app-tabs');
        this.$appTabs.selectTab(0);
        this.$root.appendChild(this.$appTabs);
        const $canvasContainer = elem('div', this.$canvas)
        $canvasContainer.classList.add('ps-canvas-container');
        this.$root.appendChild($canvasContainer);
        this.$resourceContainer = makeResourceContainer();
        this.$root.appendChild(this.$resourceContainer);
        this.#ui = new UI(this.$resourceContainer);
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
        this.$appTabs.addEventListener('tabs:change', e => {
            switch (e.detail.prevTabName) {
                case 'Canvas':
                    $canvasContainer.style.display = 'none';
                    break;
                case 'Resources':
                    this.$resourceContainer.style.display = 'none';
                    break;
                case 'Examples':
                    this.$exampleList.style.display = 'none';
                    break;
            }
            switch (e.detail.nextTabName) {
                case 'Canvas':
                    $canvasContainer.style.display = '';
                    break;
                case 'Resources':
                    this.$resourceContainer.style.display = '';
                    break;
                case 'Examples':
                    this.$exampleList.style.display = '';
                    break;
            }
        });

        this.$actionbar.addEventListener('action:run', e => {
            if (this.loopId) {
                cancelAnimationFrame(this.loopId);
                this.loopId = null;
            }
            this.actions = [];
            this.#ui.clear();
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
                    this.$tabs.addTab();
                    const text = localStorage.getItem(`document_${i}`);
                    lastDoc = this.scripts[i] = new CodeMirror.Doc(text, "javascript");
                    i++;
                }
                if (lastDoc) {
                    this.$editorContainer.editor.swapDoc(lastDoc);
                }
            }
        });
        this.$exampleList.addEventListener('example-list:selected', e => {
            if (confirm('Override project with example data?')) {
                this.scripts = [];
                this.$tabs.clearTabs();
                this.$tabs.addTab();
                this.scripts.push(new CodeMirror.Doc(e.detail.data, "javascript"));
                this.$editorContainer.editor.swapDoc(this.scripts[0]);
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

class PartialRenderer {
    #division = 1;
    #imageData = null;
    #offset = 0;
    setDivision = division => {
        this.#division = division;
        this.#offset = 0;
    }
    setImageData = imageData => {
        this.#imageData = imageData;
    }
    next = () => {
        this.#offset++;
        if (this.#offset >= this.#division) {
            this.#offset = 0;
        }
    }
    eachPixel = fn => {
        const img = this.#imageData;
        let x = 0;
        let y = 0;
        for (let i = this.#offset * 4; i < img.data.length; i += this.#division * 4) {
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
    get ui() { return this.#ps.ui;}
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
    getImageData() {
        return this.ctx.getImageData(0, 0, this.#ps.width, this.#ps.height);
    }
    putImageData(img) {
        this.ctx.putImageData(img, 0, 0);
    }
    partialRenderer() {
        return new PartialRenderer();
    }
    clear() {
        this.ctx.clearRect(0, 0, this.#ps.width, this.#ps.height);
    }
}

class UI {
    #instances = new Map();
    /**
     * 
     * @param {HTMLElement} root 
     */
    constructor(root) {
        this.$root = root;
    }
    clear = () => {
        this.$root.innerHTML = '';
        this.#instances.clear();
    }
    get = (label) => {
        return this.#instances.get(label);
    }
    has = (label) => {
        return this.#instances.has(label);
    }
    input = (label, value, {type = 'text', min = 0, max = 1, step = null} = {}) => {
        const $input = elem('input');
        const $label = elem('label', text(label), $input);
        const $container = elem('div', $label);
        $input.type = type;
        $input.value = value;
        if (type == 'range') {
            $input.min = min;
            $input.max = max;
            if (step != null) {
                $input.step = step;
            }
        }
        const api = {
            _input: $input,
            _label: $label,
            _container: $container,
            value,
            setValue: (value) => {
                $input.value = value;
            }
        }
        $input.onchange = 
            ['number', 'range'].includes(type) ?
                e => api.value = $input.valueAsNumber : 
                e => api.value = $input.value;

        this.$root.appendChild($container);
        this.#instances.set(label, api);
        return api;
    }
}

class ResourceStorage {
    data = new Set();
}
class Resource {
    name = 'File';
    ext = 'txt';
    data = null;
}