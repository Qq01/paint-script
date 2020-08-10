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
function makeTabs(addTabBtn = true, ...tabsNames) {
    const tabClass = 'ps-tabs__tab';
    const tabSelectedClass = 'ps-tabs__tab--selected';
    const addTabClass = 'ps-tabs__add-tab';
    function addTab({dispatchEvents = true, name} = {}) {
        const index = $tabs.tabCount++;
        const $tab = elem('div', text(name ? name : index));
        $tab.dataset.name = name ? name : index;
        $tab.dataset.tabIndex = index;
        $tab.classList.add(tabClass);
        $tab.onclick = function(){selectTab(index)};
        if (addTabBtn) {
            $tabs.lastChild.insertAdjacentElement('beforebegin', $tab);
        } else {
            $tabs.appendChild($tab);
        }
        if (dispatchEvents) {
            $tabs.dispatchEvent(new CustomEvent('tabs:add', {detail: {index}}));
        }
        selectTab(index, {dispatchEvents});
    }
    function selectTab(index, {dispatchEvents = true} = {}) {
        const $prevTab = $tabs.querySelector(`.${tabSelectedClass}`);
        if ($prevTab) {
            $prevTab.classList.remove(tabSelectedClass);
        }
        const $nextTab = $tabs.querySelector(`.${tabClass}[data-tab-index="${index}"]`);
        if ($nextTab) {
            $nextTab.classList.add(tabSelectedClass);
            $tabs.selectedTabIndex = index;
        }
        if (dispatchEvents) {
            $tabs.dispatchEvent(new CustomEvent('tabs:change', {detail: {
                prevTabIndex: $prevTab && $prevTab.dataset.tabIndex ? Number.parseInt($prevTab.dataset.tabIndex) : null,
                nextTabIndex: $nextTab ? index : null,
                prevTabName: $prevTab?.dataset.name,
                nextTabName: $nextTab.dataset.name
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
    const $tabs = elem('div');
    if (addTabBtn) {
        const $addTab = elem('div', text('Add'));
        $addTab.onclick = addTab;
        $addTab.classList.add(addTabClass, tabClass);
        $tabs.appendChild($addTab);
    }
    $tabs.classList.add('ps-tabs');
    $tabs.addTab = e => addTab({dispatchEvents: false});
    $tabs.tabCount = 0;
    $tabs.selectedTabIndex = 0;
    if (tabsNames.length) {
        tabsNames.forEach(name => addTab({name}));
    } else {
        addTab();
    }                
    $tabs.clearTabs = clearTabs;
    $tabs.selectTab = selectTab;
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
    const codeMirror = CodeMirror($editorContainer, {
        lineNumbers: true,
        value: defaultFunctionText,
        viewportMargin: Infinity
    });
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

const scriptExamples = [
{
    title: 'UV to RGB',
    data:`//UV to RGB
ps.resizeView(256, 256);//resizing canvas.
loop(() => {// loop executes passed function once per frame.
    let time = performance.now();
    let b = Math.sin(time * 0.001);
    ps.eachPixel(data => {// function is executed per pixel.
        //color values passed to function are normalized.
        //data.u and data.v are normalized x nad y coords.
        //not normalized pixel position is held in data.x and data.y
        data.rgba[0] = data.u;
        data.rgba[1] = data.v;
        data.rgba[2] = b;
        data.rgba[3] = 1;//setting alpha channel to 1 so its no longer transparent.
    });
});`
},
{
    title: 'PartialRenderer for large canvas',
    data: `//Script No. 0
ps.resizeView(1000, 1000);
const r = ps.partialRenderer();//getting instance of PartialRenderer
r.setDivision(19);//Ammount of frames needed to fully render image.
//the bigger value the more visible artefact can be.
//for best results set value to number that is not divisible by image width
loop(() => {
    let time = performance.now();
    let b = Math.sin(time * 0.001);
    const img = ps.getImageData();//get image data from canvas
    r.setImageData(img);//set image data for that we want to process
    r.eachPixel(data => {//execute function only for 1/19 of canvas pixels
        data.rgba[0] = data.u;
        data.rgba[1] = data.v;
        data.rgba[2] = b;
        data.rgba[3] = 1;
    });
    ps.putImageData(img);//putting back resulted image data to our canvas.
    r.next();//tell PartialRenderer that we finished rendering in current frame so in next iteration 
});`
}
];
function makeExampleList() {
    const $exampleList = elem('div');
    $exampleList.classList.add('ps-example-list');
    $exampleList.style.display = 'none';
    scriptExamples.forEach(example => {
        const $ex = elem('div');
        $ex.classList.add('ps-examplelist__example-button');
        $ex.innerHTML = example.title;
        $ex.onclick = e => {
            $exampleList.dispatchEvent(new CustomEvent('example-list:selected', {detail: {
                ...example
            }}));
        }
        $exampleList.appendChild($ex);
    });
    return $exampleList;
}

function makeResourceContainer() {
    const $resourceContainer = elem('div');
    $resourceContainer.classList.add('ps-resource__container');
    $resourceContainer.style.display = 'none';
    return $resourceContainer;
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
}

class ResourceStorage {
    data = new Set();
}
class Resource {
    name = 'File';
    ext = 'txt';
    data = null;
}