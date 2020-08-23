import {elem, text} from "../utils.js";

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
    },
    {
        title: 'Resource Inputs',
        data: `//Script No. 0
ps.resizeView(256, 256);
const $TestText = ps.ui.input('Test text', 'Hello World');
const $TestNumber = ps.ui.input('Test number', 40 , {type: 'number'});
const $TestRange = ps.ui.input('Test range', 30, {type: 'range', min: 0, max: 100});
loop(() => {
    ps.clear();
    ps.ctx.font = \`\${$TestRange.value}px Arial\`;
    ps.ctx.fillText($TestText.value, $TestNumber.value, $TestNumber.value);
});`
    }
];
export function makeExampleList() {
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