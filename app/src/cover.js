// Golden Getaway — the cover engine. Draws a multi-panel GTA-style poster onto any
// 2D canvas from a plain state object. No Rockstar artwork, logos or fonts: every
// shape, grade and letter is drawn here from scratch with system fonts.
//
// A state looks like:
//   { layout, grade, caption, tagline, heat, outline, grain, halftone, vignette,
//     photos: [ { img, zoom, ox, oy } ], panelPhoto: [0, 1, 0, 1] }
// Panel photos are indexes into photos; a panel with no photo gets a painted sky.

export const LAYOUTS = ['hero-three', 'four-grid', 'full-bleed', 'slash', 'tilted', 'story-strip'];
export const GRADES = ['golden-hour', 'dusk-magenta', 'teal-noir', 'mono-chrome', 'bubblegum'];
export const EXPORT_SIZES = [
  { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
];

// Warm amber + deep teal duotone washes per grade. Each entry is [shadow, mid, highlight]
// used as soft-light / overlay washes over the photos, plus a painted sky band.
const GRADE_WASH = {
  'golden-hour': ['#1d3a4a', '#e8a33d', '#ffe9b0'],
  'dusk-magenta': ['#2a0e33', '#c2457a', '#ffb3c8'],
  'teal-noir': ['#06121a', '#0f5f6b', '#9fe8e0'],
  'mono-chrome': ['#0a0a0a', '#5c5c5c', '#f2f2f2'],
  'bubblegum': ['#3d1030', '#ff5fa2', '#ffe066'],
};

const PANEL_GAP = 0.012; // gap between panels, as a fraction of the short side

/** Panels for a layout, as fractions of the canvas [x, y, w, h, tiltDeg]. */
export function layoutPanels(layout, w, h) {
  const g = Math.min(w, h) * PANEL_GAP;
  switch (layout) {
    case 'four-grid':
      return [
        [0, 0, w / 2 - g / 2, h / 2 - g / 2, 0],
        [w / 2 + g / 2, 0, w / 2 - g / 2, h / 2 - g / 2, 0],
        [0, h / 2 + g / 2, w / 2 - g / 2, h / 2 - g / 2, 0],
        [w / 2 + g / 2, h / 2 + g / 2, w / 2 - g / 2, h / 2 - g / 2, 0],
      ];
    case 'full-bleed':
      return [[0, 0, w, h, 0]];
    case 'slash':
      return [
        [0, 0, w, h * 0.58, 0],
        [0, h * 0.58, w, h * 0.42, 0],
      ];
    case 'tilted':
      return [
        [w * 0.04, h * 0.06, w * 0.56, h * 0.52, -3],
        [w * 0.44, h * 0.10, w * 0.52, h * 0.46, 2.5],
        [w * 0.14, h * 0.52, w * 0.72, h * 0.42, -1.5],
      ];
    case 'story-strip':
      return [
        [0, 0, w, h * 0.26, 0],
        [0, h * 0.26 + g, w, h * 0.48, 0],
        [0, h * 0.76 + g, w, h * 0.24 - g, 0],
      ];
    case 'hero-three':
    default:
      return [
        [0, 0, w, h * 0.62, 0],
        [0, h * 0.62 + g, w / 3 - g * 0.66, h * 0.38 - g, 0],
        [w / 3 + g * 0.33, h * 0.62 + g, w / 3 - g * 0.66, h * 0.38 - g, 0],
        [(w / 3) * 2 + g * 0.66, h * 0.62 + g, w / 3 - g * 0.66, h * 0.38 - g, 0],
      ];
  }
}

/** Paints a generated dusk sky (gradient + sun disc + streaks) where a panel has no photo. */
export function paintSky(ctx, x, y, w, h, grade) {
  const [shadow, mid, hi] = GRADE_WASH[grade] || GRADE_WASH['golden-hour'];
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, shadow);
  sky.addColorStop(0.55, mid);
  sky.addColorStop(1, hi);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // Low sun disc.
  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.arc(x + w * 0.68, y + h * 0.42, Math.min(w, h) * 0.16, 0, Math.PI * 2);
  ctx.fill();
  // Horizontal light streaks.
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let i = 0; i < 5; i++) {
    const sy = y + h * (0.55 + i * 0.07);
    ctx.fillRect(x, sy, w, Math.max(2, h * 0.012));
  }
}

/** Draws one photo into a panel rect with cover-fit, zoom and pan offsets. */
export function drawPanelPhoto(ctx, photo, x, y, w, h, tilt) {
  ctx.save();
  if (tilt) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-w / 2, -h / 2);
    x = 0; y = 0;
  } else {
    ctx.translate(x, y);
  }
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  const img = photo.img;
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const scale = base * (photo.zoom || 1);
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const dx = (w - pw) / 2 + (photo.ox || 0) * w;
  const dy = (h - ph) / 2 + (photo.oy || 0) * h;
  ctx.drawImage(img, dx, dy, pw, ph);
  ctx.restore();
}

/** Applies a grade's colour wash over the whole canvas. */
export function applyGrade(ctx, w, h, grade) {
  const [shadow, mid, hi] = GRADE_WASH[grade] || GRADE_WASH['golden-hour'];
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const warm = ctx.createLinearGradient(0, 0, 0, h);
  warm.addColorStop(0, hi);
  warm.addColorStop(0.5, mid);
  warm.addColorStop(1, shadow);
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'overlay';
  const cool = ctx.createLinearGradient(0, 0, w, h);
  cool.addColorStop(0, 'rgba(20,60,80,0.25)');
  cool.addColorStop(1, 'rgba(255,170,60,0.22)');
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Fits a font size so `text` fits inside `maxW`. Returns the size used. */
export function fitFont(ctx, text, maxW, startSize, family, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxW) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

const TITLE_FAMILY = '"Arial Black", "Archivo Black", sans-serif';
const TAGLINE_FAMILY = 'Georgia, "Times New Roman", serif';

/** Draws the caption, tagline ribbon and chevron getaway meter. */
export function drawLettering(ctx, w, h, state) {
  const caption = (state.caption || '').trim().toUpperCase();
  const bandH = h * 0.16;
  const bandY = h - bandH;
  if (state.layout !== 'full-bleed') {
    // Dark slash band behind the title so it reads over any photo.
    ctx.save();
    ctx.fillStyle = 'rgba(12,10,16,0.82)';
    ctx.beginPath();
    ctx.moveTo(0, bandY + bandH * 0.35);
    ctx.lineTo(w, bandY);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  if (caption) {
    const size = fitFont(ctx, caption, w * 0.92, h * 0.085, TITLE_FAMILY, 900);
    const cy = bandY + bandH * 0.52;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Amber offset shadow, then white fill, then optional dark outline.
    ctx.fillStyle = '#f5a623';
    ctx.fillText(caption, w / 2 + size * 0.07, cy + size * 0.07);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(caption, w / 2, cy);
    if (state.outline) {
      ctx.lineWidth = Math.max(2, size * 0.06);
      ctx.strokeStyle = '#14101a';
      ctx.strokeText(caption, w / 2, cy);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(caption, w / 2, cy);
    }
    ctx.restore();
  }
  const tagline = (state.tagline || '').trim();
  if (tagline) {
    const size = fitFont(ctx, tagline, w * 0.7, h * 0.032, TAGLINE_FAMILY, 'italic 700');
    ctx.save();
    ctx.font = `italic 700 ${size}px ${TAGLINE_FAMILY}`;
    const tw = ctx.measureText(tagline).width;
    const pad = size * 0.9;
    const ry = bandY - size * 2.1;
    ctx.fillStyle = '#14101a';
    ctx.fillRect(w / 2 - tw / 2 - pad, ry - size * 0.7, tw + pad * 2, size * 1.7);
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagline, w / 2, ry + size * 0.15);
    ctx.restore();
  }
  drawGetawayMeter(ctx, w, h, state.heat || 3);
}

/** Five chevrons in the top-right corner; `heat` of them filled amber. */
export function drawGetawayMeter(ctx, w, h, heat) {
  const s = Math.min(w, h) * 0.035;
  const x0 = w - s * 6.4;
  const y0 = h * 0.03;
  ctx.save();
  ctx.fillStyle = 'rgba(12,10,16,0.72)';
  ctx.fillRect(x0 - s * 0.5, y0 - s * 0.5, s * 6.9, s * 2.1);
  for (let i = 0; i < 5; i++) {
    const cx = x0 + i * (s * 1.25);
    ctx.beginPath();
    ctx.moveTo(cx, y0);
    ctx.lineTo(cx + s * 0.55, y0 + s * 0.55);
    ctx.lineTo(cx, y0 + s * 1.1);
    ctx.lineTo(cx + s * 0.3, y0 + s * 0.55);
    ctx.closePath();
    ctx.fillStyle = i < heat ? '#f5a623' : 'rgba(255,255,255,0.35)';
    ctx.fill();
  }
  ctx.restore();
}

/** Film grain: speckles from a small pre-made noise tile, tiled over the canvas. */
let noiseTile = null;
export function drawGrain(ctx, w, h) {
  if (!noiseTile) {
    noiseTile = document.createElement('canvas');
    noiseTile.width = 128;
    noiseTile.height = 128;
    const nctx = noiseTile.getContext('2d');
    const data = nctx.createImageData(128, 128);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v;
      data.data[i + 3] = 22;
    }
    nctx.putImageData(data, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = 0.5;
  const pattern = ctx.createPattern(noiseTile, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Halftone dots in the top-left corner. */
export function drawHalftone(ctx, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,16,26,0.5)';
  const step = Math.max(10, Math.min(w, h) * 0.022);
  for (let y = step; y < h * 0.2; y += step) {
    for (let x = step; x < w * 0.24; x += step) {
      const r = step * 0.16 * (1 + (x + y) / (w * 0.3));
      ctx.beginPath();
      ctx.arc(x, y, Math.min(r, step * 0.32), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** A soft dark vignette around the edges. */
export function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,6,14,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** The whole cover: panels, grade, lettering, effects. `state.photos` holds image objects. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#14101a';
  ctx.fillRect(0, 0, w, h);
  const panels = layoutPanels(state.layout || 'hero-three', w, h);
  const photos = state.photos || [];
  const mapping = state.panelPhoto || [];
  panels.forEach(([x, y, pw, ph, tilt], i) => {
    const pick = mapping[i] ?? (photos.length ? i % photos.length : -1);
    const photo = pick >= 0 ? photos[pick] : null;
    if (photo && photo.img) {
      drawPanelPhoto(ctx, photo, x, y, pw, ph, tilt);
    } else {
      ctx.save();
      if (tilt) {
        ctx.translate(x + pw / 2, y + ph / 2);
        ctx.rotate((tilt * Math.PI) / 180);
        ctx.translate(-pw / 2, -ph / 2);
        paintSky(ctx, 0, 0, pw, ph, state.grade);
      } else {
        paintSky(ctx, x, y, pw, ph, state.grade);
      }
      ctx.restore();
    }
    if (tilt) {
      // White snapshot border for tilted cards.
      ctx.save();
      ctx.translate(x + pw / 2, y + ph / 2);
      ctx.rotate((tilt * Math.PI) / 180);
      ctx.strokeStyle = '#fdf8ef';
      ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.008);
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
      ctx.restore();
    }
  });
  // Slash layout: a bold amber diagonal band between the two panels.
  if (state.layout === 'slash') {
    ctx.save();
    ctx.fillStyle = '#f5a623';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.58 - h * 0.02);
    ctx.lineTo(w, h * 0.58 - h * 0.075);
    ctx.lineTo(w, h * 0.58 + h * 0.005);
    ctx.lineTo(0, h * 0.58 + h * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  applyGrade(ctx, w, h, state.grade || 'golden-hour');
  drawLettering(ctx, w, h, state);
  if (state.halftone) drawHalftone(ctx, w, h);
  if (state.vignette) drawVignette(ctx, w, h);
  if (state.grain) drawGrain(ctx, w, h);
  // Thin frame so the poster reads as one printed piece.
  ctx.strokeStyle = 'rgba(253,248,239,0.9)';
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.006);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}
