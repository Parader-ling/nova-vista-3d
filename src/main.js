import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { buildCase } from './lib/buildCase.js';
import {
  PART_DATA,
  PART_BY_ID,
  CATEGORIES,
  BUILD_STEPS,
  SPECS,
} from './lib/partData.js';
import {
  createBackdropTexture,
  createPlatformTexture,
  createShadowTexture,
  createGlowTexture,
  createStudioEnvTexture,
} from './lib/textures.js';
import './style.css';

/* ------------------------------------------------------------------ */
/* DOM                                                                 */
/* ------------------------------------------------------------------ */
const $ = (id) => document.getElementById(id);
const dom = {
  app: $('app'),
  canvas: $('scene'),
  hoverTip: $('hoverTip'),
  hoverIndex: $('hoverIndex'),
  hoverName: $('hoverName'),
  labels: $('labels'),
  freeReticle: $('freeReticle'),
  viewMode: $('viewMode'),
  partPanel: $('partPanel'),
  partList: $('partList'),
  partCount: $('partCount'),
  labelToggle: $('labelToggle'),
  mobilePartsBtn: $('mobilePartsBtn'),
  infoPanel: $('infoPanel'),
  infoContent: $('infoContent'),
  modeLabel: $('modeLabel'),
  fpsValue: $('fpsValue'),
  navCoords: $('navCoords'),
  viewSpeedValue: $('viewSpeedValue'),
  orbitCenter: $('orbitCenter'),
  dockPip: $('dockPip'),
  dockState: $('dockState'),
  dockCount: $('dockCount'),
  explodeBtn: $('explodeBtn'),
  tourBtn: $('tourBtn'),
  resetBtn: $('resetBtn'),
  guideBtn: $('guideBtn'),
  guideModal: $('guideModal'),
  guideClose: $('guideClose'),
  guideSteps: $('guideSteps'),
  guideSpecs: $('guideSpecs'),
  toast: $('toast'),
  intro: $('intro'),
  introStatus: $('introStatus'),
};

const ICON = {
  close: `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  closeSmall: `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/></svg>`,
  focus: `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="4.1" stroke="currentColor" stroke-width="1.1"/><path d="M10 1.8v3M10 15.2v3M1.8 10h3M15.2 10h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="10" cy="10" r="1" fill="currentColor"/></svg>`,
  pop: `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.6v8.1M6.8 7.4 10 10.7l3.2-3.3M4 12.2v3.5c0 .8.6 1.4 1.4 1.4h9.2c.8 0 1.4-.6 1.4-1.4v-3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  assemble: `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 17.2V9.1M6.8 12.4 10 9.1l3.2 3.3M4 7.6V4.1c0-.8.6-1.4 1.4-1.4h9.2c.8 0 1.4.6 1.4 1.4v3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrow: `<svg class="step-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  back: `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h9.5M10 5.5 5.5 10l4.5 4.5M15.5 4v12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

const FINISH_PRESETS = [
  { name: '云母白', color: '#eee9e0' },
  { name: '曜石黑', color: '#20242a' },
  { name: '香槟金', color: '#c9a978' },
  { name: '冰川蓝', color: '#7c97ad' },
  { name: '勃艮第红', color: '#6f2f3d' },
  { name: '钛灰', color: '#7c838a' },
];

const FOCUS_DIRECTION = {
  frontGlass: [0.22, 0.16, 1],
  sideGlass: [1, 0.18, 0.28],
  topPanel: [0.35, 1, 0.55],
  radiator: [0.45, 0.9, 0.55],
  pump: [0.12, 0.2, 1],
  gpu: [0.16, 0.18, 1],
  motherboard: [0.18, 0.16, 1],
  ram: [0.3, 0.22, 1],
  m2: [0.22, 0.1, 1],
  sideFans: [1, 0.15, 0.3],
  bottomFans: [0.45, -0.72, 0.62],
  psu: [0.8, -0.08, -0.72],
  rearFan: [0.18, 0.2, -1],
  frame: [0.72, 0.28, 1],
};

const TOUR_IDS = [
  'frontGlass',
  'sideGlass',
  'radiator',
  'pump',
  'gpu',
  'motherboard',
  'ram',
  'sideFans',
  'bottomFans',
  'psu',
];

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */
let renderer;
let scene;
let camera;
let composer;
let bloomPass;
let clock;
let caseRoot;
let parts = {};
let anchors = {};
let fanRotors = [];
let caseMaterials = null;
let selectableGroups = [];
let raycaster;
let casePlatform;
let platformRings;
let particles;
let dust;
let background;
let halos = [];

const state = {
  selectedId: null,
  hoveredId: null,
  labelsVisible: true,
  isLooking: false,
  pointerInside: false,
  ready: false,
  viewSpeed: 1,
  freeLook: false,
  soloMode: false,
};

let yaw = 0;
let pitch = 0;
let yawTarget = 0;
let pitchTarget = 0;
let orbitAngularVelocity = 0;
const lookTarget = new THREE.Vector3(0, 0.31, 0);
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const movementVelocity = new THREE.Vector3();
const desiredMovement = new THREE.Vector3();
const worldUp = new THREE.Vector3(0, 1, 0);
const ORBIT_PIVOT = new THREE.Vector3(0, 0.33, 0);
const orbitPivotScratch = new THREE.Vector3();
const tmpVec = new THREE.Vector3();
const tmpVec2 = new THREE.Vector3();
const tmpBox = new THREE.Box3();

let cameraAnim = null;
let tour = {
  active: false,
  elapsed: 0,
  baseAngle: 0,
  startRadius: 1.4,
  startY: 0.58,
  lastIndex: -1,
  cycle: 0,
};

let hoverBox = null;
let selectionBox = null;
let selectionRing = null;
let pointerDirty = false;
let pointerClientX = 0;
let pointerClientY = 0;
let pointerNdc = new THREE.Vector2();
let pointerId = null;
let lookLastX = 0;
let lookLastY = 0;
let lookDistance = 0;
let clickCandidate = null;
let wheelSpeedAccum = 0;
let pointerLocked = false;
let freeLookGuardUntil = 0;
let soloSavedView = null;
let keys = new Set();
const partTints = new Map();
const partTintEntries = new Map();
let explodeTimers = [];
let toastTimer = null;
let fpsTime = 0;
let fpsFrames = 0;
let coordsTime = 0;
let elapsed = 0;
let lowPower = false;

const rows = new Map();
const labelEls = new Map();

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */
try {
  init();
} catch (error) {
  console.error('[NOVA VISTA]', error);
  if (dom.introStatus) {
    dom.introStatus.textContent = 'WebGL 初始化失败 · 请确认浏览器已开启硬件加速';
    dom.introStatus.style.color = '#ff8b9c';
  }
}

function init() {
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
  if (!gl) throw new Error('WebGL is not available');

  renderer = new THREE.WebGLRenderer({
    canvas: dom.canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x02040a, 1);

  lowPower = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 760;

  scene = new THREE.Scene();
  background = createBackdropTexture();
  scene.background = background;
  scene.fog = new THREE.FogExp2(0x040b15, 0.13);

  camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.01, 40);
  applyDefaultCamera(false);
  updateViewportFraming();

  // Studio environment reflections, generated from a dark room with softboxes.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = createStudioEnvTexture();
  envTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = pmrem.fromEquirectangular(envTexture).texture;
  scene.environmentIntensity = 0.55;
  envTexture.dispose();
  pmrem.dispose();

  setupLights();
  setupShowroom();
  setupCase();
  setupHelpers();
  setupPostprocessing();
  buildInterface();
  bindEvents();

  clock = new THREE.Clock();
  elapsed = 0;

  // Warm up shaders / first frame before revealing the scene
  renderer.compile(scene, camera);
  composer.render();

  window.__NOVA__ = {
    THREE,
    scene,
    camera,
    renderer,
    composer,
    bloomPass,
    pickAt(x, y) {
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2(x, y);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      return hits.slice(0, 12).map((hit) => ({
        id: resolvePartId(hit.object),
        distance: Number(hit.distance.toFixed(3)),
        point: hit.point.toArray().map((v) => Number(v.toFixed(3))),
        material: hit.object.material?.type,
        color: hit.object.material?.color ? `#${hit.object.material.color.getHexString()}` : null,
        map: Boolean(hit.object.material?.map),
      }));
    },
    get caseRoot() {
      return caseRoot;
    },
    get parts() {
      return parts;
    },
    hideSprites() {
      scene.traverse((object) => {
        if (object.isSprite) object.visible = false;
      });
    },
    listSprites() {
      const list = [];
      scene.traverse((object) => {
        if (object.isSprite) list.push({ scale: object.scale.toArray(), pos: object.position.toArray(), opacity: object.material.opacity });
      });
      return list;
    },
    setBackground(color) {
      scene.background = color;
    },
  };

  dom.introStatus.textContent = '正在构建 14 个可拆解模块…';
  window.setTimeout(() => {
    if (dom.introStatus) dom.introStatus.textContent = '视口就绪 · 等待交互';
  }, 420);

  window.setTimeout(() => {
    if (!dom.intro) return;
    dom.intro.classList.add('hidden');
    document.body.classList.add('ready');
    state.ready = true;
    window.setTimeout(() => dom.intro.remove(), 1100);
    window.setTimeout(() => {
      showToast('点击任意部件即可弹出，并查看它的装载方式', 3600);
    }, 1250);
  }, 720);

  renderer.setAnimationLoop(animate);
}

/* ------------------------------------------------------------------ */
/* Scene pieces                                                        */
/* ------------------------------------------------------------------ */
function setupLights() {
  scene.add(new THREE.HemisphereLight(0xb4d6ff, 0x020407, 0.3));

  const key = new THREE.DirectionalLight(0xffffff, 2.15);
  key.position.set(2.2, 3.1, 2.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -1.15;
  key.shadow.camera.right = 1.15;
  key.shadow.camera.top = 1.3;
  key.shadow.camera.bottom = -0.35;
  key.shadow.camera.near = 0.2;
  key.shadow.camera.far = 7;
  key.shadow.bias = -0.00025;
  key.shadow.normalBias = 0.008;
  scene.add(key);
  scene.add(key.target);

  const fill = new THREE.DirectionalLight(0x79a8ff, 0.5);
  fill.position.set(-2.8, 1.4, 1.7);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x8fa7ff, 0.75);
  rim.position.set(-0.6, 1.5, -3.0);
  scene.add(rim);

  // One very soft cool kicker inside the case; mostly for edge separation.
  const cyan = new THREE.PointLight(0x6fe6ff, 0.1, 0.9, 2);
  cyan.position.set(0.24, 0.46, 0.36);
  scene.add(cyan);
}

function setupShowroom() {
  const platformMat = new THREE.MeshPhysicalMaterial({
    color: 0x050a12,
    roughness: 0.27,
    metalness: 0.86,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    envMapIntensity: 0.8,
  });

  casePlatform = new THREE.Group();
  casePlatform.name = 'showroom-platform';

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.77, 0.8, 0.034, 128, 1), platformMat);
  base.position.y = -0.105;
  base.receiveShadow = true;
  casePlatform.add(base);

  const deckTexture = createPlatformTexture();
  const deck = new THREE.Mesh(
    new THREE.CircleGeometry(0.762, 128),
    new THREE.MeshBasicMaterial({
      map: deckTexture,
      transparent: true,
      opacity: 0.96,
      toneMapped: false,
      depthWrite: false,
    })
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = -0.086;
  casePlatform.add(deck);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.765, 0.0023, 8, 160),
    new THREE.MeshBasicMaterial({
      color: 0x7df2ff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.086;
  casePlatform.add(rim);

  const rimOuter = new THREE.Mesh(
    new THREE.TorusGeometry(0.792, 0.0014, 6, 160),
    new THREE.MeshBasicMaterial({
      color: 0x957dff,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  rimOuter.rotation.x = Math.PI / 2;
  rimOuter.position.y = -0.084;
  casePlatform.add(rimOuter);

  const shadowTexture = createShadowTexture();
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 1.02),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      toneMapped: false,
    })
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -0.081;
  contact.renderOrder = 2;
  casePlatform.add(contact);

  const floorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.42, 1.28),
    new THREE.MeshBasicMaterial({
      map: createGlowTexture(),
      color: 0x2a8bb4,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = -0.079;
  floorGlow.renderOrder = 3;
  casePlatform.add(floorGlow);

  scene.add(casePlatform);

  platformRings = new THREE.Group();
  const ringSpecs = [
    { radius: 0.56, tube: 0.0015, color: 0x5de6ff, opacity: 0.34, arc: Math.PI * 1.25, speed: 0.06, offset: -0.5 },
    { radius: 0.645, tube: 0.0012, color: 0x9f7dff, opacity: 0.24, arc: Math.PI * 0.8, speed: -0.045, offset: 1.2 },
    { radius: 0.52, tube: 0.001, color: 0xff65d2, opacity: 0.18, arc: Math.PI * 0.55, speed: 0.085, offset: 2.4 },
  ];
  for (const spec of ringSpecs) {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, spec.tube, 5, 120, spec.arc),
      new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: spec.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    arc.rotation.x = Math.PI / 2;
    arc.rotation.z = spec.offset;
    arc.position.y = -0.083;
    arc.userData.speed = spec.speed;
    arc.userData.baseOffset = spec.offset;
    platformRings.add(arc);
  }

  // tick marks around the stage
  const tickMat = new THREE.MeshBasicMaterial({
    color: 0x68dfff,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  for (let i = 0; i < 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.004 + (i % 7 === 0 ? 0.004 : 0), 0.001, 0.014), tickMat);
    tick.position.set(Math.sin(angle) * 0.72, -0.083, Math.cos(angle) * 0.72);
    tick.rotation.y = angle;
    tick.userData.baseAngle = angle;
    platformRings.add(tick);
  }
  scene.add(platformRings);

  // Background particles
  const count = 310;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  let seed = 9182;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i += 1) {
    const radius = 1.1 + rand() * 2.3;
    const angle = rand() * Math.PI * 2;
    const height = -0.04 + rand() * 1.9;
    positions[i * 3] = Math.sin(angle) * radius;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.cos(angle) * radius;
    color.setHSL(0.5 + rand() * 0.17, 0.8, 0.56 + rand() * 0.3);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const particleMat = new THREE.PointsMaterial({
    size: 0.0065,
    vertexColors: true,
    transparent: true,
    opacity: 0.58,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    toneMapped: false,
  });
  particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  const dustCount = 120;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    dustPositions[i * 3] = (rand() - 0.5) * 1.8;
    dustPositions[i * 3 + 1] = 0.04 + rand() * 0.9;
    dustPositions[i * 3 + 2] = (rand() - 0.5) * 1.2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      size: 0.0045,
      color: 0x9ff4ff,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false,
    })
  );
  scene.add(dust);

  // Deep glow behind the case
  const glow = createGlowTexture();
  const backgroundHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0x2a79b8,
      transparent: true,
      opacity: 0.13,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  backgroundHalo.scale.set(2.4, 2.4, 1);
  backgroundHalo.position.set(0.05, 0.3, -0.6);
  scene.add(backgroundHalo);
  halos.push({ sprite: backgroundHalo, base: 0.13, speed: 0.35, phase: 0 });
}

function setupCase() {
  const caseData = buildCase();
  caseRoot = caseData.root;
  parts = caseData.parts;
  anchors = caseData.anchors;
  fanRotors = caseData.fanRotors;
  caseMaterials = caseData.materials;
  scene.add(caseRoot);
  selectableGroups = PART_DATA.map((part) => parts[part.id].group);

  // subtle idle drift on the case root is intentionally avoided:
  // the exploded positions are authored in world space.
}

function setupHelpers() {
  raycaster = new THREE.Raycaster();
  raycaster.near = 0.01;
  raycaster.far = 12;

  hoverBox = makeBoxHelper(0x9ef4ff, 0.72);
  selectionBox = makeBoxHelper(0x65eaff, 0.5);

  selectionRing = new THREE.Mesh(
    new THREE.RingGeometry(0.13, 0.136, 72),
    new THREE.MeshBasicMaterial({
      color: 0x66eaff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  selectionRing.rotation.x = -Math.PI / 2;
  selectionRing.position.y = -0.078;
  selectionRing.visible = false;
  selectionRing.renderOrder = 4;
  scene.add(selectionRing);
}

function makeBoxHelper(color, opacity) {
  const helper = new THREE.Box3Helper(new THREE.Box3(), color);
  helper.material.transparent = true;
  helper.material.opacity = opacity;
  helper.material.depthTest = false;
  helper.material.toneMapped = false;
  helper.renderOrder = 60;
  helper.visible = false;
  scene.add(helper);
  return helper;
}

function setupPostprocessing() {
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(scene, camera));

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    lowPower ? 0.2 : 0.34,
    0.45,
    1.6
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
}

/* ------------------------------------------------------------------ */
/* UI construction                                                     */
/* ------------------------------------------------------------------ */
function buildInterface() {
  dom.partCount.textContent = String(PART_DATA.length);

  for (const part of PART_DATA) {
    const category = CATEGORIES[part.category];
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'part-row';
    row.dataset.id = part.id;
    row.style.setProperty('--accent', category.color);
    row.setAttribute('role', 'listitem');
    row.innerHTML = `
      <span class="row-index">${part.index}</span>
      <span class="row-copy">
        <span class="row-name">${part.name}</span>
        <span class="row-mount">${part.summary}</span>
      </span>
      <span class="state-dot"></span>
    `;
    row.addEventListener('click', () => handlePartPick(part.id));
    dom.partList.appendChild(row);
    rows.set(part.id, row);

    const label = document.createElement('div');
    label.className = 'scene-label';
    label.dataset.id = part.id;
    label.style.setProperty('--accent', category.color);
    label.innerHTML = `<i>${part.index}</i><span>${part.name}</span>`;
    dom.labels.appendChild(label);
    labelEls.set(part.id, label);
  }

  renderDefaultInfo();
  renderGuide();
  updateExplodeUI();
  setTourUI(false);
}

/* ------------------------------------------------------------------ */
/* Info panel                                                          */
/* ------------------------------------------------------------------ */
function renderDefaultInfo() {
  dom.infoContent.style.setProperty('--accent', '#67e9ff');
  dom.infoPanel.scrollTop = 0;
  dom.infoContent.innerHTML = `
    <div class="empty-kicker">
      <span class="eyebrow">ASSEMBLY INSPECTOR</span>
      <span class="empty-badge">READY</span>
    </div>
    <div class="empty-number">${PART_DATA.length}</div>
    <div class="empty-copy">
      <h3>点击部件，查看装载结构</h3>
      <p>从左侧索引、底部「部件」入口或直接点击机箱上的任意模块。部件会进入独显特写，这里同步显示它的定位方式、紧固件与拆装提示。</p>
      <p class="mobile-only-copy">手机端：单指拖动旋转视角，点按部件进入独显，底部「部件」可打开完整索引。</p>
    </div>
    <div class="empty-stats">
      <div class="empty-stat"><b>0</b><span>无立柱</span></div>
      <div class="empty-stat"><b>2</b><span>独立风仓</span></div>
      <div class="empty-stat"><b>360</b><span>顶部冷排</span></div>
    </div>
    <div class="empty-controls">
      <div class="empty-control-line"><span><kbd>LMB</kbd> 部件独显</span><span><kbd>RMB</kbd> 自由视角</span></div>
      <div class="empty-control-line"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动</span><span><kbd>Q</kbd><kbd>E</kbd> 环绕机箱</span></div>
      <div class="empty-control-line"><span><kbd>SPACE</kbd><kbd>C</kbd> 升降</span><span><kbd>滚轮</kbd> 视角速度</span></div>
      <div class="empty-control-line"><span><kbd>F</kbd> 聚焦选中</span><span><kbd>R</kbd> 复位视口</span></div>
    </div>
  `;
}

function renderInfo(id) {
  const part = PART_BY_ID[id];
  const runtime = parts[id];
  if (!part || !runtime) {
    renderDefaultInfo();
    return;
  }
  const category = CATEGORIES[part.category];
  const isOut = runtime.target > 0.5;
  const isFrame = id === 'frame';
  dom.infoContent.style.setProperty('--accent', category.color);
  dom.infoPanel.scrollTop = 0;

  const stats = part.stats
    .map(([label, value]) => `<div class="detail-stat"><b>${value}</b><span>${label}</span></div>`)
    .join('');
  const fixes = part.fix.map((item) => `<li>${item}</li>`).join('');
  const statusLabel = isFrame ? '固定结构' : isOut ? '已弹出' : '已就位';
  const activeTint = partTints.get(id) || null;
  const activePreset = FINISH_PRESETS.find((preset) => preset.color.toLowerCase() === (activeTint || '').toLowerCase());
  const swatches = FINISH_PRESETS.map(
    (preset) => `
      <button
        class="finish-swatch${activeTint && activeTint.toLowerCase() === preset.color.toLowerCase() ? ' active' : ''}"
        type="button"
        style="--swatch:${preset.color}"
        data-tint="${preset.color}"
        title="${preset.name} · ${preset.color}"
        aria-label="应用${preset.name}"
      ><span></span></button>`
  ).join('');

  dom.infoContent.innerHTML = `
    <div class="detail-top">
      <div class="detail-no">${part.index}<small>/ ${PART_DATA.length}</small></div>
      <div class="detail-head-right">
        <span class="status-chip ${isOut ? 'out' : ''}">${statusLabel}</span>
        <button class="icon-button detail-close" type="button" data-info-close aria-label="关闭部件详情">
          ${ICON.closeSmall}
        </button>
      </div>
    </div>
    <div class="eyebrow" style="margin-top:13px">${category.en} · ${part.chip}</div>
    <h3 class="detail-title">${part.name}</h3>
    <div class="detail-en">${part.en}</div>
    <div class="detail-chips">
      <span>${part.chip}</span>
      <span>${part.summary}</span>
    </div>
    ${
      state.soloMode
        ? `<button class="solo-exit-button" type="button" data-exit-solo>${ICON.back}退出独显 · 返回全景</button>`
        : ''
    }

    <div class="detail-block">
      <div class="block-head"><span>01</span><h4>安装位置</h4></div>
      <p class="detail-mount">${part.mount}</p>
    </div>

    <div class="detail-block">
      <div class="block-head"><span>02</span><h4>固定方式</h4></div>
      <ul class="fix-list">${fixes}</ul>
    </div>

    <div class="detail-block">
      <div class="block-head"><span>03</span><h4>关键规格</h4></div>
      <div class="detail-stats">${stats}</div>
    </div>

    <div class="detail-block">
      <div class="block-head"><span>04</span><h4>高级配色</h4></div>
      <div class="finish-palette">
        ${swatches}
        <button class="finish-reset${!activeTint ? ' active' : ''}" type="button" data-tint="reset">原色</button>
      </div>
      <div class="finish-current"><span>FINISH</span><b>${activePreset ? activePreset.name : '原厂色'}</b></div>
      <div class="finish-caption">仅作用于当前部件的浅色外壳与金属件，不改动灯效、屏幕与纹理。</div>
    </div>

    <div class="tip-box">${part.tip}</div>
    <div class="detail-step">${part.step}</div>
    <div class="detail-orbit-note">
      ${isFrame ? 'Q / E 环绕中心：机箱' : isOut ? `Q / E 正在环绕此部件` : '部件弹出后，Q / E 将自动改为环绕此部件'}
    </div>

    <div class="detail-actions">
      <button class="action-button" type="button" data-focus>
        ${ICON.focus}<span>定位部件</span>
      </button>
      ${
        isFrame
          ? `<button class="action-button" type="button" disabled style="opacity:.4;cursor:not-allowed">${ICON.assemble}<span>不可拆卸</span></button>`
          : `<button class="action-button accent" type="button" data-pop>
              ${isOut ? ICON.assemble : ICON.pop}<span>${isOut ? '装回原位' : '弹出部件'}</span>
            </button>`
      }
    </div>
  `;

  dom.infoContent.querySelector('[data-info-close]')?.addEventListener('click', () => {
    if (state.soloMode) exitSoloView();
    else setSelected(null);
  });
  dom.infoContent.querySelector('[data-focus]')?.addEventListener('click', () => focusPart(id));
  dom.infoContent.querySelector('[data-pop]')?.addEventListener('click', () => togglePart(id));
  dom.infoContent.querySelector('[data-exit-solo]')?.addEventListener('click', () => exitSoloView());
  dom.infoContent.querySelectorAll('[data-tint]').forEach((button) => {
    button.addEventListener('click', () => {
      const scrollTop = dom.infoPanel.scrollTop;
      applyPartTint(id, button.dataset.tint || 'reset');
      renderInfo(id);
      dom.infoPanel.scrollTop = scrollTop;
    });
  });
}

function isTintableMaterial(material) {
  if (!material || Array.isArray(material)) return false;
  if (material.isMeshBasicMaterial || material.transparent) return false;
  if (!material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial) return false;
  if (material.map) return false;
  if (material.emissive && material.emissive.r + material.emissive.g + material.emissive.b > 0.02) return false;
  if (!material.color) return false;
  const luminance = material.color.r * 0.2126 + material.color.g * 0.7152 + material.color.b * 0.0722;
  return luminance > 0.24;
}

function buildTintEntries(id) {
  const part = parts[id];
  if (!part) return [];
  const entries = [];
  part.group.traverse((object) => {
    if (!object.isMesh) return;
    const material = object.material;
    if (!isTintableMaterial(material)) return;
    const clone = material.clone();
    object.material = clone;
    entries.push({
      mesh: object,
      original: material,
      material: clone,
      baseColor: material.color.clone(),
    });
  });
  partTintEntries.set(id, entries);
  return entries;
}

function applyPartTint(id, value) {
  if (!parts[id]) return;
  if (value === 'reset') {
    const entries = partTintEntries.get(id);
    if (entries) {
      for (const entry of entries) {
        entry.mesh.material = entry.original;
        entry.material.dispose();
      }
    }
    partTintEntries.delete(id);
    partTints.delete(id);
    showToast('已恢复原厂色', 1600);
    return;
  }

  let entries = partTintEntries.get(id);
  if (!entries || entries.length === 0) entries = buildTintEntries(id);
  if (entries.length === 0) {
    partTints.delete(id);
    showToast('该部件没有可改色的外壳材质', 2200);
    return;
  }

  const target = new THREE.Color(value);
  for (const entry of entries) {
    entry.material.color.copy(entry.baseColor).lerp(target, 0.84);
  }
  partTints.set(id, value);
  const preset = FINISH_PRESETS.find((item) => item.color.toLowerCase() === value.toLowerCase());
  showToast(`已应用 ${preset ? preset.name : '自定义色'} · ${PART_BY_ID[id].name}`, 1700);
}

function setSelected(id) {
  if (id && !PART_BY_ID[id]) return;
  if (!id && state.soloMode) {
    // Safety net for paths that deselect without an explicit solo exit.
    state.soloMode = false;
    soloSavedView = null;
    for (const part of PART_DATA) parts[part.id].group.visible = true;
  }
  state.selectedId = id;
  document.body.classList.toggle('has-selection', Boolean(id));

  for (const [partId, row] of rows) {
    row.classList.toggle('selected', partId === id);
    row.setAttribute('aria-current', partId === id ? 'true' : 'false');
  }
  for (const [partId, label] of labelEls) {
    label.classList.toggle('active', partId === id);
  }

  if (id) {
    renderInfo(id);
    const row = rows.get(id);
    if (row) row.scrollIntoView({ block: 'nearest' });
  } else {
    renderDefaultInfo();
  }
}

function refreshInfo(id = state.selectedId) {
  if (id) renderInfo(id);
}

/* ------------------------------------------------------------------ */
/* Part interaction                                                    */
/* ------------------------------------------------------------------ */
function rememberCameraView() {
  camera.getWorldDirection(cameraForward);
  return {
    position: camera.position.clone(),
    target: camera.position.clone().addScaledVector(cameraForward, 2.6),
  };
}

function enterSoloPart(id) {
  if (!parts[id]) return;
  if (tour.active) stopTour(false);
  if (cameraAnim) {
    cameraAnim = null;
    syncAngles();
  }
  if (state.freeLook) exitFreeLook({ silent: true });
  if (!state.soloMode) soloSavedView = rememberCameraView();

  state.soloMode = true;
  for (const part of PART_DATA) {
    parts[part.id].group.visible = part.id === id;
  }
  if (id !== 'frame' && parts[id].target < 0.5) {
    parts[id].target = 1;
  }

  setSelected(id);
  updateExplodeUI();
  focusPart(id, { notify: false });
  showToast(`部件独显 · ${PART_BY_ID[id].name}`, 2000);
}

function exitSoloView({ restoreView = true, notify = true } = {}) {
  if (!state.soloMode) {
    setSelected(null);
    return;
  }
  const saved = soloSavedView;
  state.soloMode = false;
  soloSavedView = null;
  for (const part of PART_DATA) {
    parts[part.id].group.visible = true;
  }
  setSelected(null);
  updateExplodeUI();
  if (restoreView && saved) {
    flyTo(saved.position, saved.target, 0.7);
  }
  if (notify) showToast('已退出独显 · 返回全景', 1800);
}

function handlePartPick(id) {
  if (!PART_BY_ID[id]) return;
  closeMobileParts();
  if (tour.active) stopTour(false);
  if (state.soloMode && state.selectedId === id) {
    focusPart(id);
    return;
  }
  enterSoloPart(id);
}

function togglePart(id) {
  if (id === 'frame') {
    showToast('承力内胆框架是整机基准，不建议拆卸', 2400);
    return;
  }
  const part = parts[id];
  const next = part.target > 0.5 ? 0 : 1;
  part.target = next;
  updateExplodeUI();
  if (state.selectedId === id) refreshInfo(id);
  showToast(next ? `${PART_BY_ID[id].name} · 已弹出` : `${PART_BY_ID[id].name} · 已装回`, 1800);
}

function clearExplodeTimers() {
  for (const timer of explodeTimers) window.clearTimeout(timer);
  explodeTimers = [];
}

function explodeAll() {
  if (state.freeLook) exitFreeLook({ silent: true });
  if (state.soloMode) exitSoloView({ restoreView: false, notify: false });
  if (tour.active) stopTour(false);
  clearExplodeTimers();
  const pending = PART_DATA.filter((part) => part.id !== 'frame' && parts[part.id].target < 0.5);
  if (pending.length === 0) {
    retractAll();
    return;
  }
  showExplodedView();
  showToast(`正在展开 ${pending.length} 个模块…`, 1800);
  pending.forEach((part, index) => {
    const timer = window.setTimeout(() => {
      parts[part.id].target = 1;
      updateExplodeUI();
      if (index === pending.length - 1) {
        refreshInfo();
        showToast('拆解完成 · 点击部件查看装载方式', 3000);
      }
    }, index * 48);
    explodeTimers.push(timer);
  });
}

function retractAll(options = {}) {
  clearExplodeTimers();
  for (const part of PART_DATA) {
    parts[part.id].target = 0;
  }
  updateExplodeUI();
  if (state.selectedId) refreshInfo();
  if (!options.silent) showToast('所有模块已装回装配位置', 2400);
}

function allSelectableOut() {
  return PART_DATA.every((part) => part.id === 'frame' || parts[part.id].target > 0.5);
}

function updateExplodeUI() {
  const selectable = PART_DATA.filter((part) => part.id !== 'frame');
  const outCount = selectable.reduce((total, part) => total + (parts[part.id].target > 0.5 ? 1 : 0), 0);
  const allOut = outCount === selectable.length;

  for (const [id, row] of rows) {
    row.classList.toggle('exploded', parts[id].target > 0.5);
  }

  if (state.soloMode && state.selectedId) {
    dom.modeLabel.textContent = '部件独显';
    dom.dockState.textContent = '独显视图';
    dom.dockCount.textContent = PART_BY_ID[state.selectedId]?.name || '';
  } else if (tour.active) {
    dom.modeLabel.textContent = '自动巡展';
    dom.dockState.textContent = '自动巡展';
    dom.dockCount.textContent = `${outCount} / ${selectable.length} 个模块展开`;
  } else if (outCount > 0) {
    dom.modeLabel.textContent = `拆解视图 ${outCount}/${selectable.length}`;
    dom.dockState.textContent = allOut ? '完全拆解' : '拆解视图';
    dom.dockCount.textContent = `${outCount} / ${selectable.length} 个模块已弹出`;
  } else {
    dom.modeLabel.textContent = '装配状态';
    dom.dockState.textContent = '装配状态';
    dom.dockCount.textContent = `${selectable.length} / ${selectable.length} 个模块锁定`;
  }

  dom.dockPip.classList.toggle('live', outCount > 0 || tour.active);
  dom.explodeBtn.querySelector('.button-copy b').textContent = allOut ? '一键装回' : '一键拆解';
  dom.explodeBtn.querySelector('.button-copy small').textContent = allOut ? 'ASSEMBLE ALL' : 'EXPLODE ALL';
}

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */
function updateViewportFraming() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const mobilePortrait = width <= 820 && height > width;
  if (mobilePortrait) {
    // Keep the chassis above the mobile info sheet and dock.
    const offset = Math.round(height * 0.21);
    camera.setViewOffset(width, height, 0, offset, width, height);
  } else {
    camera.clearViewOffset();
  }
  camera.updateProjectionMatrix();
}

function computeDefaultView() {
  const aspect = window.innerWidth / window.innerHeight;
  let fov = 36;
  let distance = 1.56;
  if (aspect < 0.78) {
    fov = 48;
    distance = 2.18;
  } else if (aspect < 1.05) {
    fov = 42;
    distance = 1.76;
  }
  const target = new THREE.Vector3(0, 0.32, 0);
  const direction = new THREE.Vector3(0.62, 0.215, 0.755).normalize();
  return {
    position: target.clone().addScaledVector(direction, distance),
    target,
    fov,
  };
}

function computeExplodedView() {
  const aspect = window.innerWidth / window.innerHeight;
  const fov = aspect < 0.78 ? 48 : aspect < 1.05 ? 42 : 36;
  let distance = 2.9;
  if (aspect < 0.78) distance = 4.2;
  else if (aspect < 1.05) distance = 3.4;
  const target = new THREE.Vector3(0, 0.44, 0);
  const direction = new THREE.Vector3(0.58, 0.21, 0.785).normalize();
  return {
    position: target.clone().addScaledVector(direction, distance),
    target,
    fov,
  };
}

function showExplodedView() {
  const view = computeExplodedView();
  camera.fov = view.fov;
  camera.updateProjectionMatrix();
  flyTo(view.position, view.target, 0.8);
}

function applyDefaultCamera(animate = false) {
  const view = computeDefaultView();
  camera.fov = view.fov;
  camera.updateProjectionMatrix();
  const target = view.target;
  if (animate) {
    flyTo(view.position, target, 0.7);
  } else {
    camera.position.copy(view.position);
    camera.lookAt(target);
    lookTarget.copy(target);
    syncAngles();
  }
}

function syncAngles() {
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  euler.setFromQuaternion(camera.quaternion, 'YXZ');
  yaw = euler.y;
  pitch = euler.x;
  yawTarget = yaw;
  pitchTarget = pitch;
}

function syncLookTargetsToCurrent() {
  yawTarget = yaw;
  pitchTarget = pitch;
}

function applyLookAngles() {
  pitch = THREE.MathUtils.clamp(pitch, -1.42, 1.42);
  camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
  camera.getWorldDirection(cameraForward);
  lookTarget.copy(camera.position).addScaledVector(cameraForward, 2.6);
}

function flyTo(position, target, duration = 0.65) {
  if (tour.active) stopTour(false);
  syncAngles();
  movementVelocity.set(0, 0, 0);
  orbitAngularVelocity = 0;
  cameraAnim = {
    fromPosition: camera.position.clone(),
    toPosition: position.clone(),
    fromLook: lookTarget.clone(),
    toLook: target.clone(),
    time: 0,
    duration,
  };
}

function focusPart(id, { notify = true } = {}) {
  if (!parts[id]) return;
  stopTour(false);
  const part = parts[id];
  if (id !== 'frame' && part.target < 0.5) {
    part.target = 1;
    updateExplodeUI();
    refreshInfo(id);
  }

  const box = new THREE.Box3().setFromObject(part.group);
  if (part.explode < 0.35) box.translate(part.offset);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const direction = new THREE.Vector3(...(FOCUS_DIRECTION[id] || [0.7, 0.25, 1])).normalize();
  const radius = Math.max(size.length() * 0.5, 0.09);
  const distance = Math.max(radius * 3.8, 0.62);
  const position = center.clone().addScaledVector(direction, distance);
  position.y = Math.max(position.y, 0.16);
  flyTo(position, center, 0.6);
  if (notify) showToast(`已定位到 ${PART_BY_ID[id].name}`, 1800);
}

function startTour() {
  if (tour.active) {
    stopTour();
    return;
  }
  if (state.freeLook) exitFreeLook({ silent: true });
  if (state.soloMode) exitSoloView({ restoreView: false, notify: false });
  closeGuide();
  setSelected(null);
  retractAll({ silent: true });
  cameraAnim = null;
  movementVelocity.set(0, 0, 0);
  orbitAngularVelocity = 0;

  tour.active = true;
  tour.elapsed = 0;
  tour.baseAngle = Math.atan2(camera.position.x, camera.position.z);
  tour.startRadius = Math.max(1.15, Math.hypot(camera.position.x, camera.position.z));
  tour.startY = camera.position.y;
  tour.lastIndex = -1;
  tour.cycle = -1;

  setTourUI(true);
  updateExplodeUI();
  showToast('自动巡展已启动 · 右键拖拽或 WASD 可随时接管', 3400);
}

function stopTour(notify = true) {
  if (!tour.active) return;
  tour.active = false;
  movementVelocity.set(0, 0, 0);
  orbitAngularVelocity = 0;
  setTourUI(false);
  camera.getWorldDirection(cameraForward);
  lookTarget.copy(camera.position).addScaledVector(cameraForward, 2.6);
  syncAngles();
  updateExplodeUI();
  if (notify) showToast('已接管视口 · 右键拖拽旋转 / WASD 移动', 2400);
}

function setTourUI(active) {
  dom.tourBtn.classList.toggle('active', active);
  const title = dom.tourBtn.querySelector('.button-copy b');
  const sub = dom.tourBtn.querySelector('.button-copy small');
  if (active) {
    title.textContent = '停止巡展';
    sub.textContent = 'STOP TOUR';
  } else {
    title.textContent = '自动巡展';
    sub.textContent = 'SHOWCASE';
  }
}

function resetView() {
  if (state.freeLook) exitFreeLook({ silent: true });
  if (state.soloMode) exitSoloView({ restoreView: false, notify: false });
  clearExplodeTimers();
  stopTour(false);
  retractAll({ silent: true });
  setSelected(null);
  applyDefaultCamera(true);
  showToast('视口与装配状态已复位', 2400);
}

function updateCameraRig(dt) {
  if (cameraAnim) {
    cameraAnim.time += dt;
    const t = THREE.MathUtils.clamp(cameraAnim.time / cameraAnim.duration, 0, 1);
    const ease = t * t * (3 - 2 * t);
    camera.position.lerpVectors(cameraAnim.fromPosition, cameraAnim.toPosition, ease);
    lookTarget.lerpVectors(cameraAnim.fromLook, cameraAnim.toLook, ease);
    camera.lookAt(lookTarget);
    if (t >= 1) {
      cameraAnim = null;
      syncAngles();
    }
    return;
  }

  if (tour.active) {
    updateTour(dt);
    return;
  }

  // Q / E orbit with an ease-in/ease-out angular velocity.
  let orbitDirection = 0;
  if (keys.has('KeyQ')) orbitDirection -= 1;
  if (keys.has('KeyE')) orbitDirection += 1;
  const rotateBoost = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 1.9 : 1;
  const desiredOrbitVelocity = orbitDirection * 1.3 * state.viewSpeed * rotateBoost;
  orbitAngularVelocity += (desiredOrbitVelocity - orbitAngularVelocity) * (1 - Math.exp(-dt * 20));
  if (Math.abs(orbitAngularVelocity) < 0.002) orbitAngularVelocity = 0;
  if (orbitAngularVelocity !== 0) {
    orbitAroundPivot(orbitAngularVelocity * dt);
    pointerDirty = true;
  }

  // Damped look: mouse deltas feed the target angles, the rendered camera
  // eases toward them so fast drags and part-pivot changes never snap.
  const lookDamping = 1 - Math.exp(-dt * 32);
  const deltaYaw = Math.atan2(Math.sin(yawTarget - yaw), Math.cos(yawTarget - yaw));
  yaw += deltaYaw * lookDamping;
  pitch += (pitchTarget - pitch) * lookDamping;
  applyLookAngles();

  camera.getWorldDirection(cameraForward);
  cameraRight.crossVectors(cameraForward, worldUp).normalize();

  let forward = 0;
  let strafe = 0;
  let lift = 0;
  if (keys.has('KeyW')) forward += 1;
  if (keys.has('KeyS')) forward -= 1;
  if (keys.has('KeyD')) strafe += 1;
  if (keys.has('KeyA')) strafe -= 1;
  if (keys.has('Space') || keys.has('PageUp')) lift += 1;
  if (keys.has('KeyC') || keys.has('PageDown')) lift -= 1;

  const boost = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 2.5 : 1;
  desiredMovement.set(0, 0, 0);
  if (forward || strafe || lift) {
    desiredMovement
      .addScaledVector(cameraForward, forward)
      .addScaledVector(cameraRight, strafe)
      .addScaledVector(worldUp, lift)
      .normalize()
      .multiplyScalar(0.78 * state.viewSpeed * boost);
  }
  movementVelocity.lerp(desiredMovement, 1 - Math.exp(-dt * 14));
  if (desiredMovement.lengthSq() === 0 && movementVelocity.lengthSq() < 0.00001) {
    movementVelocity.set(0, 0, 0);
  }
  if (movementVelocity.lengthSq() > 0) {
    camera.position.addScaledVector(movementVelocity, dt);
    clampCameraPosition();
    camera.getWorldDirection(cameraForward);
    pointerDirty = true;
  }

  lookTarget.copy(camera.position).addScaledVector(cameraForward, 2.6);
}

function getOrbitPivot() {
  const id = state.selectedId;
  if (id && id !== 'frame' && parts[id] && parts[id].target > 0.5) {
    parts[id].anchor.getWorldPosition(orbitPivotScratch);
    return orbitPivotScratch;
  }
  return orbitPivotScratch.copy(ORBIT_PIVOT);
}

function orbitAroundPivot(angle) {
  // Orbit the camera around the case center by default, or around the selected
  // part once it has been popped out. The view direction is eased toward the
  // pivot by the damped look pass, so changing pivot never snaps.
  const pivot = getOrbitPivot();
  const offsetX = camera.position.x - pivot.x;
  const offsetZ = camera.position.z - pivot.z;
  const radius = Math.hypot(offsetX, offsetZ);
  if (radius < 0.06) {
    yawTarget += angle;
    return;
  }

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const nextX = offsetX * cos + offsetZ * sin;
  const nextZ = -offsetX * sin + offsetZ * cos;
  camera.position.x = pivot.x + nextX;
  camera.position.z = pivot.z + nextZ;

  // Aim the look targets at the pivot; actual orientation interpolates in the
  // damped look pass. Camera forward is -Z, so derive the yaw directly.
  const dx = pivot.x - camera.position.x;
  const dy = pivot.y - camera.position.y;
  const dz = pivot.z - camera.position.z;
  const horizontal = Math.hypot(dx, dz);
  yawTarget = Math.atan2(-dx, -dz);
  pitchTarget = THREE.MathUtils.clamp(Math.atan2(dy, horizontal), -1.42, 1.42);
}

function clampCameraPosition() {
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.06, 2.8);
  const radius = Math.hypot(camera.position.x, camera.position.z);
  const maxRadius = 4.4;
  if (radius > maxRadius) {
    const scale = maxRadius / radius;
    camera.position.x *= scale;
    camera.position.z *= scale;
  }
}

function updateTour(dt) {
  tour.elapsed += dt;
  const t = tour.elapsed;
  const settle = Math.min(1, t / 1.7);
  const radius = THREE.MathUtils.lerp(tour.startRadius, 2.9, settle) + Math.sin(t * 0.22) * 0.07;
  const angle = tour.baseAngle + t * 0.18;
  const height = THREE.MathUtils.lerp(tour.startY, 0.92, settle) + Math.sin(t * 0.33) * 0.05;

  camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
  lookTarget.set(0, 0.44, 0);
  camera.lookAt(lookTarget);
  syncAngles();

  // Stagger the exploded view during the intro of the tour
  if (t > 1.05) {
    const count = Math.min(13, Math.floor((t - 1.05) / 0.1) + 1);
    let changed = false;
    let cursor = 0;
    for (const part of PART_DATA) {
      if (part.id === 'frame') continue;
      cursor += 1;
      if (cursor <= count && parts[part.id].target < 0.5) {
        parts[part.id].target = 1;
        changed = true;
      }
    }
    if (changed) updateExplodeUI();
  }

  // Cycle the detail panel through the key modules
  if (t > 4.2) {
    const cycle = Math.floor((t - 4.2) / 2.8);
    if (cycle !== tour.cycle) {
      tour.cycle = cycle;
      const id = TOUR_IDS[cycle % TOUR_IDS.length];
      if (state.selectedId !== id) {
        setSelected(id);
        tour.lastIndex = cycle;
      }
    }
  }

  const loopAt = 4.2 + TOUR_IDS.length * 2.8 + 3.2;
  if (t > loopAt) {
    tour.elapsed = 0;
    tour.cycle = -1;
    tour.lastIndex = -1;
    tour.baseAngle = angle;
    tour.startRadius = 2.9;
    tour.startY = height;
    setSelected(null);
    retractAll({ silent: true });
    updateExplodeUI();
  }
}

/* ------------------------------------------------------------------ */
/* Pointer & keyboard                                                  */
/* ------------------------------------------------------------------ */
function enterFreeLook() {
  if (state.freeLook) return;
  stopTour(false);
  if (cameraAnim) {
    cameraAnim = null;
    syncAngles();
  }
  orbitAngularVelocity = 0;
  syncLookTargetsToCurrent();

  state.freeLook = true;
  freeLookGuardUntil = performance.now() + 180;
  lookLastX = pointerClientX;
  lookLastY = pointerClientY;
  dom.app.classList.add('free-look');
  dom.canvas.classList.add('is-free-look');
  dom.freeReticle.classList.add('active');
  dom.viewMode.textContent = 'FREE LOOK';
  dom.viewMode.classList.add('free');
  hideHover();
  pointerDirty = false;

  try {
    const request = dom.canvas.requestPointerLock?.({ unadjustedMovement: true });
    if (request && typeof request.catch === 'function') request.catch(() => {});
  } catch {
    /* fall back to canvas-relative mouse look */
  }

  showToast('自由视角已开启 · 移动鼠标旋转 / 左键选中 / 右键或 Esc 退出', 3200);
}

function exitFreeLook({ silent = false } = {}) {
  if (!state.freeLook) return;
  state.freeLook = false;
  dom.app.classList.remove('free-look');
  dom.canvas.classList.remove('is-free-look');
  dom.freeReticle.classList.remove('active');
  dom.viewMode.textContent = 'PERSPECTIVE';
  dom.viewMode.classList.remove('free');
  if (document.pointerLockElement === dom.canvas) {
    try {
      document.exitPointerLock();
    } catch {
      /* noop */
    }
  }
  if (!silent) showToast('已退出自由视角', 1600);
}

function onPointerLockChange() {
  const locked = document.pointerLockElement === dom.canvas;
  const wasLocked = pointerLocked;
  pointerLocked = locked;
  if (locked && state.freeLook) {
    // Chrome can emit a large recenter delta when pointer lock engages.
    freeLookGuardUntil = performance.now() + 150;
  }
  if (!locked && wasLocked && state.freeLook) {
    exitFreeLook({ silent: true });
    showToast('已退出自由视角', 1500);
  }
}

function onPointerLockError() {
  pointerLocked = false;
  if (state.freeLook) {
    showToast('自由视角已开启 · 鼠标未锁定，移动鼠标即可旋转', 2800);
  }
}

function updatePointerFromEvent(event) {
  const rect = dom.canvas.getBoundingClientRect();
  pointerClientX = event.clientX;
  pointerClientY = event.clientY;
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onPointerDown(event) {
  if (event.target !== dom.canvas) return;
  if (dom.partPanel.classList.contains('mobile-open')) {
    closeMobileParts();
    event.preventDefault();
    return;
  }
  updatePointerFromEvent(event);

  if (event.button === 2) {
    event.preventDefault();
    if (state.freeLook) exitFreeLook();
    else enterFreeLook();
    return;
  }

  if (event.button === 0) {
    clickCandidate = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: 0,
      touch: event.pointerType === 'touch',
    };
    if (state.freeLook) {
      event.preventDefault();
      return;
    }
    if (event.pointerType === 'touch') {
      if (tour.active) stopTour(false);
      if (cameraAnim) {
        cameraAnim = null;
        syncAngles();
      }
      orbitAngularVelocity = 0;
      syncLookTargetsToCurrent();
      state.isLooking = true;
      pointerId = event.pointerId;
      lookLastX = event.clientX;
      lookLastY = event.clientY;
      lookDistance = 0;
      dom.canvas.classList.add('is-looking');
      try {
        dom.canvas.setPointerCapture(event.pointerId);
      } catch {
        /* noop */
      }
    } else {
      event.preventDefault();
    }
  }
}

function onPointerMove(event) {
  if (state.freeLook) {
    if (!pointerLocked) updatePointerFromEvent(event);
    const dx = pointerLocked ? event.movementX || 0 : event.clientX - lookLastX;
    const dy = pointerLocked ? event.movementY || 0 : event.clientY - lookLastY;
    lookLastX = event.clientX;
    lookLastY = event.clientY;
    if (performance.now() < freeLookGuardUntil) {
      hideHover();
      return;
    }
    if (dx !== 0 || dy !== 0) {
      const sensitivity = 0.00258 * state.viewSpeed;
      yawTarget -= dx * sensitivity;
      pitchTarget = THREE.MathUtils.clamp(pitchTarget - dy * sensitivity, -1.42, 1.42);
      if (clickCandidate) clickCandidate.moved += Math.hypot(dx, dy);
      cameraAnim = null;
    }
    state.pointerInside = true;
    pointerDirty = false;
    hideHover();
    return;
  }

  updatePointerFromEvent(event);

  if (state.isLooking) {
    const dx = event.clientX - lookLastX;
    const dy = event.clientY - lookLastY;
    if (dx !== 0 || dy !== 0) {
      const sensitivity = 0.00258 * state.viewSpeed;
      yawTarget -= dx * sensitivity;
      pitchTarget = THREE.MathUtils.clamp(pitchTarget - dy * sensitivity, -1.42, 1.42);
      lookDistance += Math.hypot(dx, dy);
      cameraAnim = null;
    }
    if (clickCandidate) clickCandidate.moved = Math.hypot(event.clientX - clickCandidate.startX, event.clientY - clickCandidate.startY);
    lookLastX = event.clientX;
    lookLastY = event.clientY;
    hideHover();
    return;
  }

  if (clickCandidate) {
    clickCandidate.moved = Math.hypot(event.clientX - clickCandidate.startX, event.clientY - clickCandidate.startY);
  }

  state.pointerInside = true;
  pointerDirty = true;
}

function onPointerUp(event) {
  const wasLooking = state.isLooking;
  const wasFreeLook = state.freeLook;
  const candidate = clickCandidate;
  const dragDistance = lookDistance;

  state.isLooking = false;
  pointerId = null;
  clickCandidate = null;
  lookDistance = 0;
  dom.canvas.classList.remove('is-looking');

  if (dom.canvas.hasPointerCapture?.(event.pointerId)) {
    try {
      dom.canvas.releasePointerCapture(event.pointerId);
    } catch {
      /* noop */
    }
  }

  if (wasFreeLook && candidate && !candidate.touch) {
    if (candidate.moved < 8) {
      const ndc = pointerLocked ? new THREE.Vector2(0, 0) : pointerNdc;
      const id = pickPart(ndc);
      if (id) {
        exitFreeLook({ silent: true });
        handlePartPick(id);
      }
    }
    return;
  }

  const shouldSelect =
    (candidate && candidate.id === event.pointerId && candidate.moved < 7) ||
    (candidate?.touch && dragDistance < 9);

  if (shouldSelect) {
    pickAtPointer(event);
  } else if (wasLooking) {
    pointerDirty = true;
  }
}

function onPointerLeave() {
  if (!state.isLooking) {
    state.pointerInside = false;
    setHovered(null);
  }
}

function onWheel(event) {
  event.preventDefault();
  if (dom.guideModal.classList.contains('open')) return;

  // Wheel adjusts both movement and orbit speed instead of dollying.
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : 1);
  wheelSpeedAccum += delta;
  if (Math.abs(wheelSpeedAccum) < 24) return;

  const direction = wheelSpeedAccum > 0 ? -1 : 1;
  const notches = Math.max(1, Math.min(4, Math.round(Math.abs(wheelSpeedAccum) / 110)));
  wheelSpeedAccum = 0;
  const previous = state.viewSpeed;
  state.viewSpeed = Math.round(THREE.MathUtils.clamp(state.viewSpeed + direction * 0.15 * notches, 0.3, 3) * 10) / 10;
  if (state.viewSpeed === previous) return;

  dom.viewSpeedValue.textContent = `${state.viewSpeed.toFixed(1)}×`;
  dom.viewSpeedValue.classList.remove('bump');
  // restart the small value animation
  void dom.viewSpeedValue.offsetWidth;
  dom.viewSpeedValue.classList.add('bump');
  hideHover();
}

function onContextMenu(event) {
  event.preventDefault();
}

function pickAtPointer(event) {
  hideHover();
  updatePointerFromEvent(event);
  const id = pickPart(pointerNdc);
  if (!id) {
    if (state.soloMode) {
      exitSoloView();
    } else {
      setSelected(null);
      showToast('已取消选择', 1400);
    }
    return;
  }
  handlePartPick(id);
}

function pickPart(ndc) {
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(selectableGroups, true).filter((hit) => {
    if (!hit.object.visible) return false;
    const id = resolvePartId(hit.object);
    return Boolean(id && parts[id] && parts[id].group.visible);
  });
  if (hits.length === 0) return null;

  let chosen = hits[0];
  const firstId = resolvePartId(chosen.object);
  if (firstId === 'frontGlass' || firstId === 'sideGlass') {
    const next = hits.find((hit) => {
      const id = resolvePartId(hit.object);
      return id && id !== 'frontGlass' && id !== 'sideGlass' && id !== 'frame' && hit.distance < chosen.distance + 0.72;
    });
    if (next) chosen = next;
  }
  return resolvePartId(chosen.object);
}

function resolvePartId(object) {
  let node = object;
  while (node) {
    if (node.userData && node.userData.partId) return node.userData.partId;
    node = node.parent;
  }
  return null;
}

function onKeyDown(event) {
  if (event.code === 'Escape') {
    if (state.freeLook) {
      exitFreeLook();
    } else if (dom.guideModal.classList.contains('open')) {
      closeGuide();
    } else if (state.soloMode) {
      exitSoloView();
    } else if (state.selectedId) {
      setSelected(null);
    }
    return;
  }

  if (dom.guideModal.classList.contains('open')) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const moveCodes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'Space', 'KeyC', 'PageUp', 'PageDown'];
  if (moveCodes.includes(event.code)) {
    if (tour.active) stopTour();
    if (cameraAnim) {
      cameraAnim = null;
      syncAngles();
    }
    keys.add(event.code);
    event.preventDefault();
    hideHover();
    return;
  }
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    keys.add(event.code);
    return;
  }
  if (event.code === 'KeyF') {
    if (state.selectedId) focusPart(state.selectedId);
    else showToast('先点击一个部件，再按 F 聚焦', 2000);
    return;
  }
  if (event.code === 'KeyR') {
    resetView();
    return;
  }
  if (event.code === 'KeyL') {
    toggleLabels();
  }
}

function onKeyUp(event) {
  keys.delete(event.code);
}

function clearKeys() {
  keys.clear();
}

/* ------------------------------------------------------------------ */
/* Hover, labels, helpers                                              */
/* ------------------------------------------------------------------ */
function setHovered(id) {
  if (state.hoveredId === id) return;
  state.hoveredId = id;
  dom.canvas.classList.toggle('is-hovering', Boolean(id) && !state.isLooking);
  if (!id) {
    dom.hoverTip.classList.remove('visible');
    return;
  }
  const part = PART_BY_ID[id];
  if (!part) return;
  dom.hoverIndex.textContent = part.index;
  dom.hoverName.textContent = part.name;
  dom.hoverTip.classList.add('visible');
}

function hideHover() {
  setHovered(null);
  dom.hoverTip.classList.remove('visible');
}

function updateHover() {
  if (!pointerDirty || !state.pointerInside || state.isLooking || state.freeLook || tour.active) return;
  pointerDirty = false;
  const id = pickPart(pointerNdc);
  setHovered(id);
  if (id) {
    let x = pointerClientX + 14;
    let y = pointerClientY + 16;
    if (x > window.innerWidth - 190) x = pointerClientX - 190;
    if (y > window.innerHeight - 64) y = pointerClientY - 48;
    dom.hoverTip.style.left = `${x}px`;
    dom.hoverTip.style.top = `${y}px`;
  }
}

function updateHelpers() {
  if (state.hoveredId && parts[state.hoveredId]) {
    tmpBox.setFromObject(parts[state.hoveredId].group);
    hoverBox.box.copy(tmpBox);
    hoverBox.visible = true;
  } else {
    hoverBox.visible = false;
  }

  if (state.selectedId && parts[state.selectedId]) {
    tmpBox.setFromObject(parts[state.selectedId].group);
    selectionBox.box.copy(tmpBox);
    selectionBox.visible = true;
    const center = tmpBox.getCenter(tmpVec2);
    selectionRing.visible = true;
    selectionRing.position.x = center.x;
    selectionRing.position.z = center.z;
    const pulse = 1 + Math.sin(elapsed * 2.2) * 0.08;
    selectionRing.scale.setScalar(pulse);
    selectionRing.material.opacity = 0.28 + Math.sin(elapsed * 2.2) * 0.08;
  } else {
    selectionBox.visible = false;
    selectionRing.visible = false;
  }
  hoverBox.material.color.setHex(state.hoveredId === state.selectedId ? 0x7df0ff : 0xc8f8ff);
}

function updateLabels() {
  if (!state.ready) return;
  camera.updateMatrixWorld();
  const width = window.innerWidth;
  const height = window.innerHeight;
  for (const part of PART_DATA) {
    const el = labelEls.get(part.id);
    const runtime = parts[part.id];
    if (!el || !runtime) continue;

    const shouldShow =
      state.labelsVisible &&
      (state.soloMode ? state.selectedId === part.id : runtime.explode > 0.14 || state.selectedId === part.id);
    if (!shouldShow) {
      el.classList.remove('visible');
      continue;
    }

    anchors[part.id].getWorldPosition(tmpVec);
    tmpVec.project(camera);
    if (tmpVec.z < -1 || tmpVec.z > 1) {
      el.classList.remove('visible');
      continue;
    }
    const x = (tmpVec.x * 0.5 + 0.5) * width;
    const y = (-tmpVec.y * 0.5 + 0.5) * height;
    const outside = x < -60 || x > width + 60 || y < 46 || y > height - 44;
    if (outside) {
      el.classList.remove('visible');
      continue;
    }
    el.style.left = `${x.toFixed(1)}px`;
    el.style.top = `${y.toFixed(1)}px`;
    el.classList.add('visible');
  }
}

function toggleLabels() {
  state.labelsVisible = !state.labelsVisible;
  dom.labelToggle.classList.toggle('active', state.labelsVisible);
  dom.labelToggle.setAttribute('aria-pressed', String(state.labelsVisible));
  if (!state.labelsVisible) {
    for (const label of labelEls.values()) label.classList.remove('visible');
  }
  showToast(state.labelsVisible ? '部件标注已开启' : '部件标注已隐藏', 1800);
}

/* ------------------------------------------------------------------ */
/* Mobile component drawer                                             */
/* ------------------------------------------------------------------ */
function isMobilePartsAvailable() {
  return window.innerWidth <= 820 || (window.innerWidth <= 950 && window.innerHeight <= 500);
}

function closeMobileParts() {
  dom.partPanel.classList.remove('mobile-open');
  dom.mobilePartsBtn.classList.remove('active');
  dom.mobilePartsBtn.setAttribute('aria-expanded', 'false');
}

function toggleMobileParts() {
  if (!isMobilePartsAvailable()) return;
  if (state.freeLook) exitFreeLook({ silent: true });
  const open = !dom.partPanel.classList.contains('mobile-open');
  dom.partPanel.classList.toggle('mobile-open', open);
  dom.mobilePartsBtn.classList.toggle('active', open);
  dom.mobilePartsBtn.setAttribute('aria-expanded', String(open));
  if (open) hideHover();
}

/* ------------------------------------------------------------------ */
/* Guide                                                               */
/* ------------------------------------------------------------------ */
function renderGuide() {
  dom.guideSteps.innerHTML = BUILD_STEPS.map((step, index) => {
    const partsText = step.parts.map((id) => PART_BY_ID[id]?.name).filter(Boolean).join(' · ');
    return `
      <button class="step-item" type="button" data-step="${index}">
        <span class="step-no">${step.no}</span>
        <span class="step-copy">
          <h4>${step.title}<span>${step.en}</span></h4>
          <p>${step.text}</p>
          <p style="margin-top:4px;color:#5f7891;font-size:8px;letter-spacing:.04em">${partsText}</p>
        </span>
        ${ICON.arrow}
      </button>
    `;
  }).join('');

  dom.guideSpecs.innerHTML = SPECS.map(
    ([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`
  ).join('');

  dom.guideSteps.querySelectorAll('[data-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const step = BUILD_STEPS[Number(button.dataset.step)];
      if (!step) return;
      closeGuide();
      enterSoloPart(step.parts[0]);
    });
  });
}

function openGuide() {
  if (state.freeLook) exitFreeLook({ silent: true });
  if (state.soloMode) {
    exitSoloView();
  } else {
    stopTour(false);
    cameraAnim = null;
  }
  dom.guideModal.classList.add('open');
  dom.guideModal.setAttribute('aria-hidden', 'false');
}

function closeGuide() {
  dom.guideModal.classList.remove('open');
  dom.guideModal.setAttribute('aria-hidden', 'true');
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */
function bindEvents() {
  dom.canvas.addEventListener('pointerdown', onPointerDown);
  dom.canvas.addEventListener('pointermove', onPointerMove);
  dom.canvas.addEventListener('pointerup', onPointerUp);
  dom.canvas.addEventListener('pointercancel', onPointerUp);
  dom.canvas.addEventListener('pointerleave', onPointerLeave);
  dom.canvas.addEventListener('pointerenter', (event) => {
    state.pointerInside = true;
    lookLastX = event.clientX;
    lookLastY = event.clientY;
  });
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('pointerlockerror', onPointerLockError);
  dom.canvas.addEventListener('wheel', onWheel, { passive: false });
  dom.canvas.addEventListener('contextmenu', onContextMenu);

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', clearKeys);
  window.addEventListener('resize', onResize);
  window.addEventListener('contextmenu', (event) => {
    if (event.target === dom.canvas) event.preventDefault();
  });

  dom.labelToggle.addEventListener('click', toggleLabels);
  dom.mobilePartsBtn.addEventListener('click', toggleMobileParts);

  dom.explodeBtn.addEventListener('click', () => {
    if (state.freeLook) exitFreeLook({ silent: true });
    if (state.soloMode) exitSoloView({ restoreView: false, notify: false });
    if (allSelectableOut()) {
      stopTour(false);
      retractAll();
      applyDefaultCamera(true);
    } else {
      explodeAll();
    }
  });

  dom.tourBtn.addEventListener('click', startTour);
  dom.resetBtn.addEventListener('click', resetView);
  dom.guideBtn.addEventListener('click', () => {
    if (dom.guideModal.classList.contains('open')) closeGuide();
    else openGuide();
  });
  dom.guideClose.addEventListener('click', closeGuide);
  dom.guideModal.querySelector('[data-close-guide]')?.addEventListener('click', closeGuide);

  document.addEventListener('visibilitychange', () => {
    if (clock) clock.getDelta();
  });

  window.addEventListener('pointerdown', (event) => {
    if (event.target === dom.canvas) return;
    if (!event.target.closest('.guide-panel')) {
      // Clicking empty UI does not interact with the 3D scene, but should
      // not leave a stale hover tag behind.
      hideHover();
    }
  });
}

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const view = computeDefaultView();
  camera.fov = view.fov;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(width, height);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(width, height);
  updateViewportFraming();
  if (!isMobilePartsAvailable()) closeMobileParts();
  pointerDirty = true;
}

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */
function showToast(message, duration = 2400) {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.classList.add('show');
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove('show');
  }, duration);
}

/* ------------------------------------------------------------------ */
/* Main loop                                                           */
/* ------------------------------------------------------------------ */
function animate() {
  const dt = Math.min(clock ? clock.getDelta() : 0.016, 0.05);
  elapsed += dt;

  updateCameraRig(dt);
  updateParts(dt);
  updateFanRotors(dt);
  updateHover();
  updateHelpers();
  updateLabels();
  updateAmbient(dt);
  updateHud(dt);

  composer.render();
}

function updateParts(dt) {
  const damp = 1 - Math.exp(-dt * 7.2);
  for (const part of Object.values(parts)) {
    const difference = part.target - part.explode;
    if (Math.abs(difference) < 0.0005) {
      part.explode = part.target;
    } else {
      part.explode += difference * damp;
    }
    const eased = part.explode * part.explode * (3 - 2 * part.explode);
    part.group.position.copy(part.base).addScaledVector(part.offset, eased);
  }

  if (caseMaterials) {
    caseMaterials.glass.opacity = 0.0;
    caseMaterials.glassStreak.opacity = 0.0;
  }
}

function updateFanRotors(dt) {
  for (const fan of fanRotors) {
    fan.rotor.rotation.z += fan.speed * dt * fan.dir;
  }
}

function updateAmbient(dt) {
  if (particles) {
    particles.rotation.y += dt * 0.018;
    particles.position.y = Math.sin(elapsed * 0.16) * 0.012;
  }
  if (dust) {
    dust.rotation.y -= dt * 0.012;
  }
  if (platformRings) {
    for (const child of platformRings.children) {
      if (child.userData.speed) {
        child.rotation.z += child.userData.speed * dt;
      }
    }
  }
  for (const halo of halos) {
    halo.sprite.material.opacity = halo.base + Math.sin(elapsed * halo.speed + halo.phase) * 0.03;
  }
}

function updateHud(dt) {
  fpsFrames += 1;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    const fps = Math.round(fpsFrames / fpsTime);
    dom.fpsValue.textContent = String(Math.min(fps, 144));
    fpsTime = 0;
    fpsFrames = 0;
  }

  coordsTime += dt;
  if (coordsTime >= 0.12) {
    coordsTime = 0;
    const fx = formatCoordinate(camera.position.x);
    const fy = formatCoordinate(camera.position.y);
    const fz = formatCoordinate(camera.position.z);
    dom.navCoords.textContent = `X ${fx}   Y ${fy}   Z ${fz}`;

    const id = state.selectedId;
    const orbitPart = id && id !== 'frame' && parts[id] && parts[id].target > 0.5 ? id : null;
    dom.orbitCenter.textContent = orbitPart ? PART_BY_ID[orbitPart].name : '机箱';
  }
}

function formatCoordinate(value) {
  const rounded = Math.abs(value) < 0.005 ? 0 : value;
  return `${rounded >= 0 ? '+' : ''}${rounded.toFixed(2)}`;
}
