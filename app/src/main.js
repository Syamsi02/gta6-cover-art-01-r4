// Golden Getaway — page wiring: photos, layout/grade pickers, caption editing,
// drag-to-pan and zoom per panel, undo/redo, and PNG export in three post sizes.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, layoutPanels, LAYOUTS, GRADES, EXPORT_SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const captionInput = document.getElementById('caption');
const taglineInput = document.getElementById('tagline');
const zoomInput = document.getElementById('zoom');
const panelLabel = document.getElementById('panel-label');

const PREVIEW_W = 900;
const MAX_PHOTOS = 4;

const state = {
  layout: 'hero-three',
  grade: 'golden-hour',
  caption: 'Golden Getaway',
  tagline: 'one last ride at dusk',
  heat: 3,
  outline: true,
  grain: true,
  halftone: true,
  vignette: true,
  photos: [],
  panelPhoto: [0, 1, 0, 1],
  selectedPanel: 0,
};

let undoStack = [];
let redoStack = [];

function snapshot() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, caption: state.caption,
    tagline: state.tagline, heat: state.heat, outline: state.outline,
    grain: state.grain, halftone: state.halftone, vignette: state.vignette,
    panelPhoto: state.panelPhoto,
    photos: state.photos.map((p) => ({ zoom: p.zoom, ox: p.ox, oy: p.oy })),
  });
}

function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, {
    layout: s.layout, grade: s.grade, caption: s.caption, tagline: s.tagline,
    heat: s.heat, outline: s.outline, grain: s.grain, halftone: s.halftone,
    vignette: s.vignette, panelPhoto: s.panelPhoto,
  });
  s.photos.forEach((p, i) => {
    if (state.photos[i]) Object.assign(state.photos[i], p);
  });
  syncControls();
  redraw();
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  updateHistoryButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  updateHistoryButtons();
}

function updateHistoryButtons() {
  document.getElementById('undo').disabled = !undoStack.length;
  document.getElementById('redo').disabled = !redoStack.length;
}

function previewSize() {
  const ratio = canvas.width / canvas.height;
  return ratio >= 1
    ? { w: PREVIEW_W, h: Math.round(PREVIEW_W / ratio) }
    : { w: Math.round(PREVIEW_W * ratio), h: PREVIEW_W };
}

function redraw() {
  const { w, h } = previewSize();
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  panelLabel.textContent = `Panel ${state.selectedPanel + 1} of ${layoutPanels(state.layout, w, h).length}`;
}

function syncControls() {
  captionInput.value = state.caption;
  taglineInput.value = state.tagline;
  zoomInput.value = String(selectedPhoto().zoom || 1);
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.getElementById('heat').value = String(state.heat);
  document.getElementById('outline').checked = state.outline;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('halftone').checked = state.halftone;
  document.getElementById('vignette').checked = state.vignette;
}

function selectedPhoto() {
  const idx = state.panelPhoto[state.selectedPanel] ?? 0;
  return state.photos[idx] || { zoom: 1, ox: 0, oy: 0 };
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addFiles(files) {
  const room = Math.max(0, MAX_PHOTOS - state.photos.length);
  const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, room);
  for (const file of list) {
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push({ img, zoom: 1, ox: 0, oy: 0, name: file.name });
  }
  if (!list.length) return;
  pushHistory();
  document.getElementById('photo-count').textContent = `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} loaded`;
  redraw();
}

function buildPickers() {
  const layoutBox = document.getElementById('layouts');
  LAYOUTS.forEach((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = name;
    b.textContent = name.replace(/-/g, ' ');
    b.addEventListener('click', () => { pushHistory(); state.layout = name; state.selectedPanel = 0; syncControls(); redraw(); });
    layoutBox.appendChild(b);
  });
  const gradeBox = document.getElementById('grades');
  GRADES.forEach((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = name;
    b.textContent = name.replace(/-/g, ' ');
    b.addEventListener('click', () => { pushHistory(); state.grade = name; syncControls(); redraw(); });
    gradeBox.appendChild(b);
  });
  const sizeBox = document.getElementById('sizes');
  EXPORT_SIZES.forEach((size, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = String(i);
    b.textContent = size.label;
    b.addEventListener('click', () => exportCover(size));
    sizeBox.appendChild(b);
  });
}

function exportCover(size) {
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `golden-getaway-${size.w}x${size.h}.png`;
    a.click();
    statusEl.textContent = `Saved golden-getaway-${size.w}x${size.h}.png`;
  }, 'image/png');
}

function exportAll() {
  EXPORT_SIZES.forEach((size, i) => setTimeout(() => exportCover(size), i * 250));
  statusEl.textContent = 'Exporting all three sizes…';
}

// Drag on the preview to pan the photo in the panel under the pointer.
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  const hit = panels.findIndex(([px, py, pw, ph]) => x >= px && x <= px + pw && y >= py && y <= py + ph);
  if (hit === -1) return;
  pushHistory();
  state.selectedPanel = hit;
  drag = { x, y, photo: selectedPhoto() };
  canvas.setPointerCapture(e.pointerId);
  syncControls();
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  drag.photo.ox += (x - drag.x) / canvas.width;
  drag.photo.oy += (y - drag.y) / canvas.height;
  drag.x = x;
  drag.y = y;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

document.getElementById('photo').addEventListener('change', (e) => addFiles(e.target.files));
document.getElementById('sample').addEventListener('click', async () => {
  for (const name of ['boulevard', 'pier']) {
    if (state.photos.length >= MAX_PHOTOS) break;
    const img = await loadImage(`samples/${name}.jpg`);
    state.photos.push({ img, zoom: 1, ox: 0, oy: 0, name });
  }
  pushHistory();
  document.getElementById('photo-count').textContent = `${state.photos.length} photos loaded`;
  redraw();
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; redraw(); });
document.getElementById('heat').addEventListener('input', (e) => { state.heat = Number(e.target.value); redraw(); });
document.getElementById('outline').addEventListener('change', (e) => { pushHistory(); state.outline = e.target.checked; redraw(); });
document.getElementById('grain').addEventListener('change', (e) => { pushHistory(); state.grain = e.target.checked; redraw(); });
document.getElementById('halftone').addEventListener('change', (e) => { pushHistory(); state.halftone = e.target.checked; redraw(); });
document.getElementById('vignette').addEventListener('change', (e) => { pushHistory(); state.vignette = e.target.checked; redraw(); });
zoomInput.addEventListener('input', () => {
  if (!state.photos.length) return;
  selectedPhoto().zoom = Number(zoomInput.value);
  redraw();
});
document.getElementById('cycle-photo').addEventListener('click', () => {
  if (!state.photos.length) return;
  pushHistory();
  const cur = state.panelPhoto[state.selectedPanel] ?? 0;
  state.panelPhoto[state.selectedPanel] = (cur + 1) % state.photos.length;
  redraw();
});
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);
document.getElementById('export-all').addEventListener('click', exportAll);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
  }
});

// Test hook: lets a screenshot run or a reviewer drive the export path.
window.__goldenGetaway = { state, drawCover, exportCover, redraw };

buildPickers();
syncControls();
updateHistoryButtons();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, redraw);
} else {
  redraw();
}
