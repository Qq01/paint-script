import './lib/codemirror/codemirror.js';
import './lib/codemirror/mode/javascript/javascript.js';
import { PaintScript } from './paint-script.js';
const container = document.createElement('div');
document.body.appendChild(container);
const paintScript = new PaintScript(container);