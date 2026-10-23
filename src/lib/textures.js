import * as THREE from 'three';

function canvas2d(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d') };
}

function finish(canvas, { srgb = true, anisotropy = 8 } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/* ------------------------------------------------------------------ */
/* Deep-space showroom backdrop                                        */
/* ------------------------------------------------------------------ */
export function createBackdropTexture() {
  const { canvas, ctx } = canvas2d(2048, 1152);
  const w = canvas.width;
  const h = canvas.height;

  const sky = ctx.createLinearGradient(0, 0, w * 0.18, h);
  sky.addColorStop(0, '#02040a');
  sky.addColorStop(0.34, '#061224');
  sky.addColorStop(0.58, '#071a30');
  sky.addColorStop(0.8, '#040a15');
  sky.addColorStop(1, '#010206');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // cyan nebula, upper right
  let glow = ctx.createRadialGradient(w * 0.74, h * 0.16, 0, w * 0.74, h * 0.16, w * 0.56);
  glow.addColorStop(0, 'rgba(83, 180, 255, 0.22)');
  glow.addColorStop(0.28, 'rgba(35, 103, 189, 0.14)');
  glow.addColorStop(0.62, 'rgba(16, 49, 105, 0.06)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // violet nebula, left
  glow = ctx.createRadialGradient(w * 0.13, h * 0.54, 0, w * 0.13, h * 0.54, w * 0.42);
  glow.addColorStop(0, 'rgba(124, 66, 235, 0.16)');
  glow.addColorStop(0.45, 'rgba(72, 39, 151, 0.07)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // star field
  let seed = 9127;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 620; i += 1) {
    const x = rand() * w;
    const y = rand() * h * 0.84;
    const size = rand() < 0.94 ? rand() * 1.5 + 0.3 : rand() * 2.7 + 1.2;
    const alpha = 0.12 + rand() * 0.66;
    ctx.fillStyle = `rgba(${190 + Math.floor(rand() * 50)}, ${218 + Math.floor(rand() * 30)}, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // distant planet limb, lower left
  const cx = -w * 0.035;
  const cy = h * 1.26;
  const radius = h * 0.86;
  const planet = ctx.createRadialGradient(cx - radius * 0.18, cy - radius * 0.56, radius * 0.1, cx, cy, radius);
  planet.addColorStop(0, '#1b3a61');
  planet.addColorStop(0.36, '#102542');
  planet.addColorStop(0.72, '#071424');
  planet.addColorStop(1, '#03070f');
  ctx.fillStyle = planet;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // planet atmosphere rim
  ctx.save();
  ctx.strokeStyle = 'rgba(90, 185, 255, 0.5)';
  ctx.lineWidth = 7;
  ctx.shadowColor = 'rgba(63, 189, 255, 0.9)';
  ctx.shadowBlur = 46;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 1.02, Math.PI * 1.72);
  ctx.stroke();
  ctx.restore();

  // horizon haze
  glow = ctx.createRadialGradient(w * 0.1, h * 0.9, 0, w * 0.1, h * 0.9, w * 0.5);
  glow.addColorStop(0, 'rgba(40, 128, 213, 0.18)');
  glow.addColorStop(0.5, 'rgba(22, 71, 131, 0.08)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // vignette baked into the backdrop
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.46, w * 0.18, w * 0.5, h * 0.5, w * 0.76);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.64, 'rgba(0,0,0,0.08)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  return finish(canvas, { anisotropy: 4 });
}

/* ------------------------------------------------------------------ */
/* Studio environment (equirectangular)                                */
/* ------------------------------------------------------------------ */
export function createStudioEnvTexture() {
  const { canvas, ctx } = canvas2d(2048, 1024);
  const w = canvas.width;
  const h = canvas.height;

  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, '#050a13');
  base.addColorStop(0.34, '#12243a');
  base.addColorStop(0.52, '#4c6d8b');
  base.addColorStop(0.6, '#24384c');
  base.addColorStop(1, '#020408');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const softbox = (x, y, rx, ry, angle, strength) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    grad.addColorStop(0, `rgba(255, 253, 247, ${strength})`);
    grad.addColorStop(0.32, `rgba(238, 248, 255, ${strength * 0.72})`);
    grad.addColorStop(0.7, `rgba(160, 208, 255, ${strength * 0.16})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Large diffused softboxes: key and rim
  softbox(w * 0.3, h * 0.29, 320, 170, -0.3, 0.92);
  softbox(w * 0.73, h * 0.22, 220, 120, 0.45, 0.62);
  softbox(w * 0.05, h * 0.48, 150, 90, 0.1, 0.42);

  // Colored strips for reflective trim
  ctx.save();
  const cyan = ctx.createLinearGradient(0, 0, w, 0);
  cyan.addColorStop(0, 'rgba(0,0,0,0)');
  cyan.addColorStop(0.2, 'rgba(52, 206, 255, 0.35)');
  cyan.addColorStop(0.27, 'rgba(120, 239, 255, 0.12)');
  cyan.addColorStop(0.5, 'rgba(0,0,0,0)');
  cyan.addColorStop(0.82, 'rgba(156, 108, 255, 0.26)');
  cyan.addColorStop(0.9, 'rgba(255, 88, 205, 0.2)');
  cyan.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cyan;
  ctx.fillRect(0, h * 0.53, w, h * 0.12);
  ctx.restore();

  // dark floor / horizon
  const floor = ctx.createLinearGradient(0, h * 0.58, 0, h);
  floor.addColorStop(0, 'rgba(2, 5, 9, 0)');
  floor.addColorStop(0.16, 'rgba(2, 5, 9, 0.5)');
  floor.addColorStop(1, '#010204');
  ctx.fillStyle = floor;
  ctx.fillRect(0, h * 0.58, w, h * 0.42);

  // small hot highlights
  for (const [x, y, size] of [[w * 0.4, h * 0.36, 24], [w * 0.66, h * 0.32, 16], [w * 0.14, h * 0.29, 13]]) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
    glow.addColorStop(0, 'rgba(255,255,255,0.95)');
    glow.addColorStop(0.25, 'rgba(230,248,255,0.5)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - size * 4, y - size * 4, size * 8, size * 8);
  }

  return finish(canvas, { anisotropy: 4 });
}

/* ------------------------------------------------------------------ */
/* Glass reflection streaks                                            */
/* ------------------------------------------------------------------ */
export function createGlassStreakTexture() {
  const { canvas, ctx } = canvas2d(1024, 1024);
  const w = canvas.width;
  ctx.clearRect(0, 0, w, w);
  ctx.globalCompositeOperation = 'lighter';

  // One broad, soft diagonal reflection — not a repeating pattern.
  const sweep = ctx.createLinearGradient(0, 0, w, w);
  sweep.addColorStop(0, 'rgba(255,255,255,0)');
  sweep.addColorStop(0.36, 'rgba(210,244,255,0.015)');
  sweep.addColorStop(0.44, 'rgba(235,250,255,0.11)');
  sweep.addColorStop(0.49, 'rgba(255,255,255,0.3)');
  sweep.addColorStop(0.53, 'rgba(190,233,255,0.07)');
  sweep.addColorStop(0.62, 'rgba(255,255,255,0)');
  sweep.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, w, w);

  // A single thin secondary glint
  ctx.save();
  ctx.translate(w * 0.52, w * 0.52);
  ctx.rotate(-0.78);
  const glint = ctx.createLinearGradient(0, -24, 0, 24);
  glint.addColorStop(0, 'rgba(255,255,255,0)');
  glint.addColorStop(0.48, 'rgba(255,255,255,0.08)');
  glint.addColorStop(0.52, 'rgba(255,255,255,0.22)');
  glint.addColorStop(0.56, 'rgba(255,255,255,0.05)');
  glint.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glint;
  ctx.fillRect(-w, -w, w * 2, w * 2);
  ctx.restore();

  ctx.globalCompositeOperation = 'source-over';
  return finish(canvas);
}

/* ------------------------------------------------------------------ */
/* Motherboard PCB                                                     */
/* ------------------------------------------------------------------ */
export function createPcbTexture() {
  const { canvas, ctx } = canvas2d(1024, 1120);
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#0a1018';
  ctx.fillRect(0, 0, w, h);

  // fine fibreglass weave
  ctx.globalAlpha = 0.12;
  for (let x = 0; x < w; x += 5) {
    ctx.strokeStyle = x % 10 === 0 ? '#27405a' : '#152638';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 5) {
    ctx.strokeStyle = y % 10 === 0 ? '#223a52' : '#132333';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  let seed = 4411;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed / 4294967296;
  };

  // copper traces with 45 degree bends
  for (let i = 0; i < 270; i += 1) {
    let x = rand() * w;
    let y = rand() * h;
    const horizontal = rand() > 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let step = 0; step < 3 + Math.floor(rand() * 4); step += 1) {
      const length = 14 + rand() * 90;
      if (step % 2 === 0) x += horizontal ? length : 0;
      else y += horizontal ? 0 : length;
      if (rand() > 0.55) {
        if (horizontal) y += (rand() > 0.5 ? 1 : -1) * (8 + rand() * 24);
        else x += (rand() > 0.5 ? 1 : -1) * (8 + rand() * 24);
      }
      ctx.lineTo(x, y);
    }
    const tone = rand();
    ctx.strokeStyle = tone > 0.72 ? 'rgba(174, 141, 78, 0.23)' : 'rgba(102, 154, 124, 0.13)';
    ctx.lineWidth = rand() > 0.85 ? 2.2 : 1;
    ctx.stroke();
  }

  // vias
  for (let i = 0; i < 420; i += 1) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 1.2 + rand() * 2.5;
    ctx.fillStyle = rand() > 0.6 ? 'rgba(202, 171, 99, 0.4)' : 'rgba(87, 134, 152, 0.32)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(4, 8, 12, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // silkscreen helper
  const label = (text, x, y, size = 18, color = 'rgba(210, 225, 235, 0.72)', spacing = 2) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px "Bahnschrift", "Segoe UI", sans-serif`;
    ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  // component outlines / keep-outs
  ctx.strokeStyle = 'rgba(208, 224, 232, 0.36)';
  ctx.lineWidth = 2;
  ctx.strokeRect(158, 168, 160, 160);
  ctx.strokeRect(365, 172, 112, 112);
  ctx.strokeRect(150, 405, 330, 122);

  // CPU socket
  ctx.save();
  ctx.translate(238, 248);
  ctx.strokeStyle = 'rgba(205, 219, 228, 0.48)';
  ctx.lineWidth = 3;
  ctx.strokeRect(-72, -72, 144, 144);
  ctx.strokeStyle = 'rgba(130, 158, 180, 0.24)';
  for (let i = -60; i <= 60; i += 8) {
    ctx.beginPath();
    ctx.moveTo(-66, i);
    ctx.lineTo(66, i);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, -66);
    ctx.lineTo(i, 66);
    ctx.stroke();
  }
  ctx.restore();

  // DDR5 slots
  for (let i = 0; i < 4; i += 1) {
    const x = 690 + i * 27;
    ctx.fillStyle = 'rgba(162, 177, 190, 0.5)';
    ctx.fillRect(x, 246, 10, 320);
    ctx.fillStyle = 'rgba(5, 9, 13, 0.8)';
    ctx.fillRect(x + 3, 250, 4, 312);
  }

  // PCIe slots
  for (let i = 0; i < 2; i += 1) {
    const y = 700 + i * 68;
    ctx.fillStyle = 'rgba(169, 184, 198, 0.5)';
    ctx.fillRect(168, y, 400, 13);
    ctx.fillStyle = 'rgba(5, 9, 13, 0.85)';
    ctx.fillRect(172, y + 4, 392, 5);
  }

  label('NOVA  X870E  PRO', 58, 86, 31, 'rgba(223, 236, 244, 0.84)', 4);
  label('DDR5  ·  PCIe 5.0  ·  WIFI 7', 60, 118, 15, 'rgba(145, 170, 190, 0.6)', 3);
  label('CPU_FAN', 354, 152, 13, 'rgba(216, 228, 235, 0.55)', 1);
  label('AIO_PUMP', 468, 184, 13, 'rgba(216, 228, 235, 0.55)', 1);
  label('DDR5_A1  A2  B1  B2', 688, 600, 13, 'rgba(216, 228, 235, 0.55)', 1);
  label('M.2_1  /  PCIe 5.0 x4', 512, 650, 14, 'rgba(216, 228, 235, 0.6)', 1);
  label('M.2_2', 512, 692, 13, 'rgba(216, 228, 235, 0.45)', 1);
  label('SATA  /  USB 3.2', 688, 760, 13, 'rgba(216, 228, 235, 0.5)', 1);
  label('24PIN  ATX', 64, 820, 14, 'rgba(216, 228, 235, 0.55)', 2);
  label('NOVA', 895, 1010, 42, 'rgba(111, 195, 228, 0.3)', 6);

  // subtle highlight sweep
  const sheen = ctx.createLinearGradient(0, 0, w, h);
  sheen.addColorStop(0, 'rgba(255,255,255,0.035)');
  sheen.addColorStop(0.4, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.76, 'rgba(115,205,255,0.028)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  return finish(canvas);
}

/* ------------------------------------------------------------------ */
/* AIO pump LCD                                                        */
/* ------------------------------------------------------------------ */
export function createLcdTexture() {
  const { canvas, ctx } = canvas2d(512, 512);

  ctx.fillStyle = '#010407';
  ctx.fillRect(0, 0, 512, 512);

  const glow = ctx.createRadialGradient(256, 256, 0, 256, 256, 250);
  glow.addColorStop(0, '#08222c');
  glow.addColorStop(0.72, '#04121b');
  glow.addColorStop(1, '#000509');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.fill();

  // outer tick ring
  ctx.save();
  ctx.translate(256, 256);
  for (let i = 0; i < 60; i += 1) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const major = i % 5 === 0;
    ctx.strokeStyle = major ? 'rgba(116, 238, 255, 0.9)' : 'rgba(84, 155, 188, 0.35)';
    ctx.lineWidth = major ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 210, Math.sin(angle) * 210);
    ctx.lineTo(Math.cos(angle) * (major ? 195 : 202), Math.sin(angle) * (major ? 195 : 202));
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(76, 227, 255, 0.8)';
  ctx.lineWidth = 7;
  ctx.shadowColor = '#31ddff';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(0, 0, 177, -Math.PI * 0.4, Math.PI * 0.38);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f1fdff';
  ctx.font = '300 188px "Bahnschrift", "Segoe UI", sans-serif';
  ctx.shadowColor = 'rgba(74, 227, 255, 0.55)';
  ctx.shadowBlur = 22;
  ctx.fillText('59', 246, 300);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#66eaff';
  ctx.font = '300 50px "Bahnschrift", "Segoe UI", sans-serif';
  ctx.fillText('°C', 355, 246);

  ctx.fillStyle = 'rgba(155, 206, 224, 0.8)';
  ctx.font = '600 21px "Bahnschrift", "Segoe UI", sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('CPU  TEMP', 256, 375);

  ctx.fillStyle = 'rgba(95, 225, 255, 0.8)';
  ctx.font = '500 17px "Bahnschrift", "Segoe UI", sans-serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('LIQUID  31°C', 256, 410);

  // tiny live graph
  ctx.beginPath();
  for (let i = 0; i < 34; i += 1) {
    const x = 168 + i * 5.2;
    const y = 446 + Math.sin(i * 0.7) * 5 + Math.sin(i * 1.7) * 3;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(103, 235, 255, 0.62)';
  ctx.lineWidth = 2;
  ctx.stroke();

  return finish(canvas);
}

/* ------------------------------------------------------------------ */
/* Fan hub sticker                                                     */
/* ------------------------------------------------------------------ */
export function createHubTexture() {
  const { canvas, ctx } = canvas2d(256, 256);
  ctx.fillStyle = '#0a1119';
  ctx.fillRect(0, 0, 256, 256);
  const grad = ctx.createRadialGradient(128, 108, 4, 128, 128, 128);
  grad.addColorStop(0, '#1d3346');
  grad.addColorStop(1, '#060b11');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 126, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(115, 235, 255, 0.65)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 128, 104, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#d9f6ff';
  ctx.textAlign = 'center';
  ctx.font = '700 62px "Bahnschrift", "Segoe UI", sans-serif';
  ctx.fillText('NV', 128, 152);
  ctx.fillStyle = 'rgba(101, 224, 255, 0.8)';
  ctx.font = '600 17px "Bahnschrift", sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('AERO', 128, 184);
  return finish(canvas);
}

/* ------------------------------------------------------------------ */
/* GPU edge label                                                      */
/* ------------------------------------------------------------------ */
export function createGpuLabelTexture() {
  const { canvas, ctx } = canvas2d(1024, 192);

  const grad = ctx.createLinearGradient(0, 0, 0, 192);
  grad.addColorStop(0, '#dbe4ec');
  grad.addColorStop(0.44, '#aebac6');
  grad.addColorStop(0.5, '#eef4f8');
  grad.addColorStop(0.56, '#98a5b2');
  grad.addColorStop(1, '#d2dbe4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 192);

  // brushed finish
  for (let i = 0; i < 340; i += 1) {
    ctx.strokeStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.055})`;
    ctx.beginPath();
    const y = Math.random() * 192;
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#131c26';
  ctx.font = '800 56px "Bahnschrift", "Segoe UI", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('GEFORCE RTX', 34, 82);

  ctx.fillStyle = 'rgba(22, 33, 45, 0.7)';
  ctx.font = '600 24px "Bahnschrift", sans-serif';
  ctx.letterSpacing = '7px';
  ctx.fillText('NOVA 24G  ·  GDDR7', 37, 127);

  ctx.fillStyle = 'rgba(240, 248, 255, 0.65)';
  ctx.font = '700 22px "Bahnschrift", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('∞  RTX', 984, 84);
  return finish(canvas);
}

/* ------------------------------------------------------------------ */
/* Glass / trim branding                                               */
/* ------------------------------------------------------------------ */
export function createBrandTexture() {
  const { canvas, ctx } = canvas2d(1024, 256);
  ctx.clearRect(0, 0, 1024, 256);
  ctx.fillStyle = 'rgba(238, 248, 255, 0.95)';
  ctx.font = '700 92px "Bahnschrift", "Segoe UI", sans-serif';
  ctx.letterSpacing = '18px';
  ctx.fillText('NOVA', 24, 122);
  ctx.fillStyle = 'rgba(130, 235, 255, 0.9)';
  ctx.font = '500 39px "Bahnschrift", sans-serif';
  ctx.letterSpacing = '20px';
  ctx.fillText('VISTA', 330, 120);
  ctx.fillStyle = 'rgba(164, 190, 210, 0.85)';
  ctx.font = '500 23px "Bahnschrift", sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('PANORAMIC  ATX  CHASSIS', 26, 177);
  return finish(canvas);
}

/* ------------------------------------------------------------------ */
/* Top mesh / dust filter                                              */
/* ------------------------------------------------------------------ */
export function createMeshTexture() {
  const { canvas, ctx } = canvas2d(512, 512);
  ctx.fillStyle = '#0b1119';
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = 'rgba(122, 160, 191, 0.18)';
  for (let y = 8; y < 512; y += 13) {
    for (let x = 8 + ((y / 13) % 2) * 6.5; x < 512; x += 13) {
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(2, 5, 9, 0.92)';
  for (let y = 8; y < 512; y += 13) {
    for (let x = 8 + ((y / 13) % 2) * 6.5; x < 512; x += 13) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return finish(canvas);
}

/* ------------------------------------------------------------------ */
/* Radiator fins                                                       */
/* ------------------------------------------------------------------ */
export function createRadiatorTexture() {
  const { canvas, ctx } = canvas2d(512, 128);
  ctx.fillStyle = '#111820';
  ctx.fillRect(0, 0, 512, 128);
  for (let x = 0; x < 512; x += 3) {
    ctx.fillStyle = x % 6 === 0 ? 'rgba(117, 139, 160, 0.28)' : 'rgba(39, 52, 65, 0.6)';
    ctx.fillRect(x, 0, 1.5, 128);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  for (let x = 0; x < 512; x += 24) ctx.fillRect(x, 0, 8, 128);
  return finish(canvas);
}

/* ------------------------------------------------------------------ */
/* Platform rings                                                      */
/* ------------------------------------------------------------------ */
export function createPlatformTexture() {
  const { canvas, ctx } = canvas2d(1024, 1024);
  const size = 1024;
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;

  const base = ctx.createRadialGradient(cx, cy, 40, cx, cy, 500);
  base.addColorStop(0, 'rgba(10, 24, 40, 0.94)');
  base.addColorStop(0.55, 'rgba(7, 15, 26, 0.95)');
  base.addColorStop(1, 'rgba(2, 5, 10, 0.98)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let i = 1; i <= 5; i += 1) {
    ctx.strokeStyle = `rgba(94, 205, 255, ${0.04 + i * 0.012})`;
    ctx.lineWidth = i === 5 ? 3 : 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 140 + i * 62, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(99, 229, 255, 0.32)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 72; i += 1) {
    const a = (i / 72) * Math.PI * 2;
    const inner = i % 6 === 0 ? 408 : 418;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * 432, Math.sin(a) * 432);
    ctx.stroke();
  }
  ctx.restore();

  return finish(canvas, { anisotropy: 4 });
}

/* ------------------------------------------------------------------ */
/* Glow sprite (for LEDs / floor bloom)                                */
/* ------------------------------------------------------------------ */
export function createGlowTexture() {
  const { canvas, ctx } = canvas2d(256, 256);
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(210,248,255,0.8)');
  grad.addColorStop(0.46, 'rgba(90,215,255,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  return finish(canvas);
}

/* ------------------------------------------------------------------ */
/* Soft contact shadow                                                 */
/* ------------------------------------------------------------------ */
export function createShadowTexture() {
  const { canvas, ctx } = canvas2d(512, 512);
  const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 250);
  grad.addColorStop(0, 'rgba(0,0,0,0.82)');
  grad.addColorStop(0.48, 'rgba(0,0,0,0.34)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  return finish(canvas, { srgb: false });
}
