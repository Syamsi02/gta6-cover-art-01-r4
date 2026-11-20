// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone, full frame, at the window's size.
// Query knobs: photo (comma list of sample names), caption, tagline, layout,
// grade, heat, and panel (a comma list of photo indexes, one per panel).
// window.__shotReady is set once the scene has painted.
import { drawCover } from './cover.js';

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function applyQuery(state, query) {
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('caption') !== null) state.caption = query.get('caption');
  if (query.get('tagline') !== null) state.tagline = query.get('tagline');
  if (query.get('heat')) state.heat = Number(query.get('heat'));
  if (query.get('panel')) {
    state.panelPhoto = query.get('panel').split(',').map((s) => Number(s.trim()));
  }
}

export async function runShot(shot, query, state, redraw) {
  applyQuery(state, query);
  const names = (query.get('photo') || 'boulevard,pier').split(',').map((s) => s.trim()).filter(Boolean);
  for (const name of names) {
    const img = await loadImage(`samples/${name}.jpg`);
    state.photos.push({ img, zoom: 1, ox: 0, oy: 0, name });
  }
  if (!query.get('panel')) {
    state.panelPhoto = state.photos.map((_, i) => i % state.photos.length);
  }
  const countEl = document.getElementById('photo-count');
  if (countEl) countEl.textContent = `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} loaded`;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('cover');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawCover(canvas, state);
  } else {
    redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
