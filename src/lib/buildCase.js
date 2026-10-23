import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PART_BY_ID } from './partData.js';
import {
  createPcbTexture,
  createLcdTexture,
  createHubTexture,
  createGpuLabelTexture,
  createBrandTexture,
  createMeshTexture,
  createRadiatorTexture,
  createGlowTexture,
  createGlassStreakTexture,
} from './textures.js';

const CASE = {
  width: 0.5,
  height: 0.62,
  depth: 0.46,
  wall: 0.014,
  floor: 0.06,
  top: 0.6,
};

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function buildCase() {
  const root = new THREE.Group();
  root.name = 'case';

  const parts = {};
  const anchors = {};
  const fanRotors = [];
  const glowTexture = createGlowTexture();
  const pcbTexture = createPcbTexture();
  const lcdTexture = createLcdTexture();
  const hubTexture = createHubTexture();
  const gpuLabelTexture = createGpuLabelTexture();
  const brandTexture = createBrandTexture();
  const meshTexture = createMeshTexture();
  const radiatorTexture = createRadiatorTexture();
  const glassStreakTexture = createGlassStreakTexture();

  /* ------------------------------------------------------------------ */
  /* Materials                                                           */
  /* ------------------------------------------------------------------ */
  const white = new THREE.MeshPhysicalMaterial({
    color: 0xeef2f6,
    roughness: 0.34,
    metalness: 0.05,
    clearcoat: 0.38,
    clearcoatRoughness: 0.26,
    envMapIntensity: 0.7,
  });
  const whiteSatin = new THREE.MeshPhysicalMaterial({
    color: 0xdbe3ea,
    roughness: 0.48,
    metalness: 0.04,
    clearcoat: 0.18,
    envMapIntensity: 0.55,
  });
  const whiteInset = new THREE.MeshStandardMaterial({
    color: 0xacb9c5,
    roughness: 0.55,
    metalness: 0.2,
  });
  const trayMat = new THREE.MeshStandardMaterial({
    color: 0x374453,
    roughness: 0.52,
    metalness: 0.55,
    envMapIntensity: 0.55,
  });
  const silver = new THREE.MeshPhysicalMaterial({
    color: 0xc2ccd6,
    roughness: 0.2,
    metalness: 0.95,
    envMapIntensity: 1.5,
  });
  const chrome = new THREE.MeshPhysicalMaterial({
    color: 0xe8eef4,
    roughness: 0.08,
    metalness: 1,
    envMapIntensity: 1.8,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x0c121a,
    roughness: 0.3,
    metalness: 0.82,
    envMapIntensity: 1,
  });
  const darkMatte = new THREE.MeshStandardMaterial({
    color: 0x121922,
    roughness: 0.62,
    metalness: 0.45,
  });
  const black = new THREE.MeshStandardMaterial({
    color: 0x030507,
    roughness: 0.5,
    metalness: 0.3,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x0a0d12,
    roughness: 0.92,
    metalness: 0.02,
  });
  const pcb = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: pcbTexture,
    roughness: 0.52,
    metalness: 0.22,
  });
  const copper = new THREE.MeshStandardMaterial({
    color: 0xba8b4e,
    roughness: 0.32,
    metalness: 0.9,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xdff4ff,
    metalness: 0,
    roughness: 0.04,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    clearcoat: 0.04,
    clearcoatRoughness: 0.03,
    envMapIntensity: 0.07,
    ior: 1.48,
    specularIntensity: 0.2,
  });
  const glassStreak = new THREE.MeshBasicMaterial({
    map: glassStreakTexture,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const glassEdge = new THREE.MeshBasicMaterial({
    color: 0x9adfff,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const cyanLED = new THREE.MeshBasicMaterial({
    color: 0x64e9ff,
    toneMapped: false,
  });
  const magentaLED = new THREE.MeshBasicMaterial({
    color: 0xff53c8,
    toneMapped: false,
  });
  const rgbMaterials = [
    new THREE.MeshStandardMaterial({
      color: 0x77e7ff,
      emissive: 0x3bd8ff,
      emissiveIntensity: 3.2,
      roughness: 0.3,
      metalness: 0.2,
      toneMapped: false,
    }),
    new THREE.MeshStandardMaterial({
      color: 0xff8be0,
      emissive: 0xff33bf,
      emissiveIntensity: 2.8,
      roughness: 0.3,
      metalness: 0.2,
      toneMapped: false,
    }),
  ];

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function mesh(geometry, material, { shadow = true, receive = true } = {}) {
    const item = new THREE.Mesh(geometry, material);
    item.castShadow = shadow;
    item.receiveShadow = receive;
    return item;
  }

  function rbox(w, h, d, radius = 0.004, material = white) {
    const geo = new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2, h / 2, d / 2));
    return mesh(geo, material);
  }

  function box(w, h, d, material, x = 0, y = 0, z = 0) {
    const item = mesh(new THREE.BoxGeometry(w, h, d), material);
    item.position.set(x, y, z);
    return item;
  }

  function beam(a, b, thickness, material) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    const item = mesh(new THREE.BoxGeometry(thickness, length, thickness), material);
    item.position.copy(a).add(b).multiplyScalar(0.5);
    item.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
    return item;
  }

  function screw(radius = 0.006, height = 0.004, material = silver) {
    const item = mesh(new THREE.CylinderGeometry(radius, radius, height, 14), material);
    item.rotation.x = Math.PI / 2;
    return item;
  }

  function cylinder(radius, height, material, radialSegments = 32) {
    return mesh(new THREE.CylinderGeometry(radius, radius, height, radialSegments), material);
  }

  function glowSprite(size, color = 0x5ce7ff, opacity = 0.7) {
    const spriteMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(size, size, 1);
    return sprite;
  }

  function tube(points, radius, material, tubularSegments = 36, radialSegments = 8) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.45);
    const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
    return mesh(geo, material);
  }

  function textPlane(texture, width, height, materialOptions = {}) {
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      ...materialOptions,
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  }

  /* ------------------------------------------------------------------ */
  /* Fan builder                                                         */
  /* ------------------------------------------------------------------ */
  const bladeGeo = (() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.145, -0.045);
    shape.bezierCurveTo(0.24, -0.11, 0.4, -0.115, 0.48, -0.02);
    shape.bezierCurveTo(0.515, 0.03, 0.46, 0.095, 0.375, 0.095);
    shape.bezierCurveTo(0.29, 0.095, 0.23, 0.065, 0.175, 0.03);
    shape.quadraticCurveTo(0.14, 0.01, 0.145, -0.045);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.0016,
      bevelEnabled: true,
      bevelThickness: 0.0006,
      bevelSize: 0.0008,
      bevelSegments: 1,
      curveSegments: 7,
    });
    geo.center();
    return geo;
  })();

  const bladeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1c2836,
    roughness: 0.34,
    metalness: 0.35,
    clearcoat: 0.5,
    transparent: true,
    opacity: 0.94,
    side: THREE.DoubleSide,
  });

  function makeRgbRing(radius, tubeRadius, phase) {
    const geo = new THREE.TorusGeometry(radius, tubeRadius, 10, 108);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const hue = ((Math.atan2(y, x) / (Math.PI * 2) + 1 + phase) % 1);
      color.setHSL(hue, 1, 0.55);
      colors[i * 3] = color.r * 1.75;
      colors[i * 3 + 1] = color.g * 1.75;
      colors[i * 3 + 2] = color.b * 1.75;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, material);
  }

  function createFan({
    size = 0.12,
    thickness = 0.026,
    doubleRing = true,
    spin = 1,
    phase = 0,
    blades = 7,
  } = {}) {
    const fan = new THREE.Group();
    const frameWidth = size * 0.092;

    fan.add(box(size, frameWidth, thickness, white, 0, size / 2 - frameWidth / 2, 0));
    fan.add(box(size, frameWidth, thickness, white, 0, -size / 2 + frameWidth / 2, 0));
    fan.add(box(frameWidth, size - frameWidth * 2, thickness, white, -size / 2 + frameWidth / 2, 0, 0));
    fan.add(box(frameWidth, size - frameWidth * 2, thickness, white, size / 2 - frameWidth / 2, 0, 0));

    // Soft inner fillet
    const innerRing = mesh(
      new THREE.TorusGeometry(size * 0.447, size * 0.013, 8, 56),
      whiteSatin,
      { shadow: false }
    );
    innerRing.position.z = thickness * 0.42;
    fan.add(innerRing);

    // Rotor
    const rotor = new THREE.Group();
    rotor.position.z = thickness * 0.02;
    const bladeCount = blades;
    for (let i = 0; i < bladeCount; i += 1) {
      const blade = mesh(bladeGeo, bladeMaterial, { shadow: false });
      blade.scale.setScalar(size);
      blade.rotation.x = 0.6;
      blade.rotation.z = (i / bladeCount) * Math.PI * 2;
      rotor.add(blade);
    }
    const hub = mesh(new THREE.CylinderGeometry(size * 0.155, size * 0.155, thickness * 0.7, 32), darkMetal);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = thickness * 0.1;
    rotor.add(hub);

    const hubFace = new THREE.Mesh(
      new THREE.CircleGeometry(size * 0.14, 32),
      new THREE.MeshStandardMaterial({
        map: hubTexture,
        roughness: 0.38,
        metalness: 0.35,
        emissive: 0x101820,
        emissiveIntensity: 0.4,
      })
    );
    hubFace.position.z = thickness * 0.47;
    rotor.add(hubFace);
    fan.add(rotor);
    fanRotors.push({ rotor, speed: spin * (2.2 + Math.random() * 0.6), dir: 1 });

    const ringFront = makeRgbRing(size * 0.432, size * 0.019, phase);
    ringFront.position.z = thickness * 0.54;
    fan.add(ringFront);

    if (doubleRing) {
      const ringBack = makeRgbRing(size * 0.432, size * 0.019, phase + 0.26);
      ringBack.position.z = -thickness * 0.54;
      ringBack.rotation.y = Math.PI;
      fan.add(ringBack);
    }

    // Mounting screws
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const s = screw(size * 0.024, thickness * 0.18, darkMetal);
        s.rotation.x = 0;
        s.position.set(sx * (size / 2 - frameWidth * 0.5), sy * (size / 2 - frameWidth * 0.5), thickness * 0.5);
        s.rotation.x = Math.PI / 2;
        fan.add(s);
      }
    }

    // Corner anti-vibration pads
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const pad = box(size * 0.075, size * 0.075, thickness * 1.03, rubber, sx * (size / 2 - size * 0.02), sy * (size / 2 - size * 0.02), 0);
        fan.add(pad);
      }
    }

    return fan;
  }

  /* ------------------------------------------------------------------ */
  /* Part registry                                                       */
  /* ------------------------------------------------------------------ */
  function register(id, group) {
    const data = PART_BY_ID[id];
    if (!data) throw new Error(`Missing part data for ${id}`);
    group.name = id;
    group.userData.partId = id;
    group.traverse((child) => {
      if (child.isMesh) child.userData.partId = id;
    });
    root.add(group);
    const base = group.position.clone();
    const anchor = new THREE.Object3D();
    anchor.name = `${id}-anchor`;
    group.add(anchor);
    const box = new THREE.Box3().setFromObject(group);
    const centerWorld = box.getCenter(new THREE.Vector3());
    anchor.position.copy(group.worldToLocal(centerWorld.clone()));
    parts[id] = {
      id,
      group,
      base,
      offset: new THREE.Vector3(...data.offset),
      explode: 0,
      target: 0,
      floatBlend: 0,
      anchor,
    };
    anchors[id] = anchor;
    return group;
  }

  /* ================================================================== */
  /* 01 · FRONT GLASS                                                    */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(0, 0.33, CASE.depth / 2 - 0.004);

    const pane = mesh(new THREE.BoxGeometry(0.462, 0.5, 0.005), glass, { shadow: false });
    pane.renderOrder = 20;
    g.add(pane);
    g.add(box(0.496, 0.022, 0.012, white, 0, 0.255, 0.001));
    g.add(box(0.496, 0.026, 0.014, white, 0, -0.252, 0.002));
    g.add(box(0.017, 0.5, 0.012, white, -0.247, 0, 0.001));
    g.add(box(0.017, 0.5, 0.012, white, 0.247, 0, 0.001));

    // Brand etch
    const brand = textPlane(brandTexture, 0.135, 0.034, { opacity: 0.82 });
    brand.position.set(-0.145, -0.226, 0.0105);
    g.add(brand);

    // Glass corner screws / pads
    for (const [x, y] of [[-0.235, 0.24], [0.235, 0.24], [-0.235, -0.235], [0.235, -0.235]]) {
      const pad = screw(0.0055, 0.004, silver);
      pad.position.set(x, y, 0.011);
      g.add(pad);
    }

    // Small pull tab at the bottom
    const tab = rbox(0.06, 0.012, 0.028, 0.004, whiteSatin);
    tab.position.set(0.15, -0.263, 0.004);
    g.add(tab);

    register('frontGlass', g);
  }

  /* ================================================================== */
  /* 02 · SIDE GLASS                                                     */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(CASE.width / 2 - 0.003, 0.33, 0);

    const pane = mesh(new THREE.BoxGeometry(0.005, 0.5, 0.425), glass, { shadow: false });
    pane.renderOrder = 20;
    g.add(pane);
    g.add(box(0.014, 0.022, 0.46, white, 0.001, 0.255, 0));
    g.add(box(0.014, 0.026, 0.46, white, 0.002, -0.252, 0));
    g.add(box(0.012, 0.5, 0.018, white, 0.001, 0, 0.222));
    g.add(box(0.012, 0.46, 0.018, white, 0.001, 0, -0.218));

    // Rear quick-release thumbscrew
    const thumb = mesh(new THREE.CylinderGeometry(0.0105, 0.0105, 0.008, 20), silver);
    thumb.rotation.z = Math.PI / 2;
    thumb.position.set(-0.001, -0.24, -0.185);
    g.add(thumb);

    const etch = textPlane(brandTexture, 0.1, 0.025, { opacity: 0.55 });
    etch.rotation.y = Math.PI / 2;
    etch.position.set(0.004, -0.233, 0.14);
    g.add(etch);

    register('sideGlass', g);
  }

  /* ================================================================== */
  /* 03 · TOP PANEL                                                      */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(0, CASE.top, 0);

    g.add(box(0.5, 0.012, 0.035, white, 0, 0, 0.213));
    g.add(box(0.5, 0.012, 0.035, white, 0, 0, -0.213));
    g.add(box(0.035, 0.012, 0.46, white, -0.2325, 0, 0));
    g.add(box(0.035, 0.012, 0.46, white, 0.2325, 0, 0));

    const meshPanel = mesh(
      new THREE.BoxGeometry(0.455, 0.006, 0.41),
      new THREE.MeshStandardMaterial({
        map: meshTexture,
        color: 0xffffff,
        roughness: 0.6,
        metalness: 0.55,
      }),
      { shadow: false }
    );
    meshPanel.position.y = -0.004;
    g.add(meshPanel);

    // Magnetic dust filter pull tab
    const filterTab = rbox(0.07, 0.008, 0.028, 0.004, darkMatte);
    filterTab.position.set(0, 0.006, -0.185);
    g.add(filterTab);
    const tabMark = box(0.03, 0.0015, 0.006, cyanLED, 0, 0.011, -0.185);
    g.add(tabMark);

    // Recessed dark thumb screws blend into the top mesh
    for (const x of [-0.18, 0.18]) {
      const s = mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.0035, 22), darkMetal);
      s.position.set(x, 0.004, -0.205);
      g.add(s);
      const slot = box(0.009, 0.001, 0.002, black, x, 0.006, -0.205);
      g.add(slot);
    }

    register('topPanel', g);
  }

  /* ================================================================== */
  /* 04 · TOP RADIATOR + TUBES                                           */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(0, 0.552, 0);

    const radiatorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: radiatorTexture,
      roughness: 0.5,
      metalness: 0.65,
    });
    const core = mesh(new THREE.BoxGeometry(0.415, 0.036, 0.132), radiatorMat);
    g.add(core);

    g.add(box(0.018, 0.042, 0.14, white, -0.215, 0, 0));
    g.add(box(0.018, 0.042, 0.14, white, 0.215, 0, 0));
    // End-tank details
    for (const x of [-0.193, 0.193]) {
      const cap = cylinder(0.011, 0.045, white);
      cap.rotation.x = Math.PI / 2;
      cap.position.set(x, -0.002, 0.035);
      g.add(cap);
    }

    // Barbs / fittings
    for (const x of [0.17, 0.195]) {
      const fitting = cylinder(0.012, 0.04, silver, 20);
      fitting.position.set(x, -0.038, -0.025);
      g.add(fitting);
      const ring = mesh(new THREE.TorusGeometry(0.012, 0.0025, 8, 24), darkMetal);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, -0.058, -0.025);
      g.add(ring);
    }

    // Three exhaust fans under the radiator
    for (let i = 0; i < 3; i += 1) {
      const fan = createFan({ size: 0.112, thickness: 0.025, phase: i * 0.13, spin: 0.5 });
      fan.position.set(-0.135 + i * 0.135, -0.048, 0);
      fan.rotation.x = Math.PI / 2; // ring face -Y (down into case)
      g.add(fan);
    }

    // Screw heads visible through the top panel
    for (let i = 0; i < 4; i += 1) {
      const s = screw(0.0065, 0.004, darkMetal);
      s.position.set(-0.12 + (i % 2) * 0.24, 0.022, i < 2 ? 0.055 : -0.055);
      g.add(s);
    }

    // Tubes: radiator right end -> pump top (world coordinates converted local)
    const tubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x11161c,
      roughness: 0.62,
      metalness: 0.1,
      clearcoat: 0.25,
    });
    const p1 = V(0.17 - 0, 0.507 - g.position.y, -0.025);
    const p2 = V(0.185 - 0, 0.485 - g.position.y, -0.05);
    const p3 = V(0.13 - 0, 0.445 - g.position.y, -0.045);
    const p4 = V(0.072 - 0, 0.432 - g.position.y, 0.012);
    g.add(tube([p1, p2, p3, p4], 0.0095, tubeMat, 44, 9));
    const off = V(0.024, 0, 0.012);
    g.add(tube([p1.clone().add(off), p2.clone().add(off), p3.clone().add(off), p4.clone().add(off)], 0.0095, tubeMat, 44, 9));

    // Braided sleeve texture via small ribs near the pump
    for (let i = 0; i < 5; i += 1) {
      const t = i / 5;
      const p = new THREE.CatmullRomCurve3([p3, V(0.1, 0.437 - g.position.y, -0.02), p4]).getPoint(t * 0.9);
      const rib = mesh(new THREE.TorusGeometry(0.014, 0.0022, 6, 20), tubeMat);
      rib.position.copy(p);
      rib.rotation.y = Math.PI / 2;
      g.add(rib);
    }

    const glow = glowSprite(0.2, 0x5eeaff, 0.22);
    glow.position.set(0, -0.075, 0.03);
    g.add(glow);

    register('radiator', g);
  }

  /* ================================================================== */
  /* 05 · PUMP BLOCK                                                     */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(0.018, 0.404, 0.014);

    const bracket = rbox(0.074, 0.074, 0.012, 0.006, whiteSatin);
    bracket.position.z = -0.032;
    g.add(bracket);
    for (const [x, y] of [[-0.031, 0.031], [0.031, 0.031], [-0.031, -0.031], [0.031, -0.031]]) {
      const spring = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.018, 12), darkMetal);
      spring.rotation.x = Math.PI / 2;
      spring.position.set(x, y, -0.022);
      g.add(spring);
    }

    const housing = mesh(new THREE.CylinderGeometry(0.05, 0.052, 0.034, 64), white);
    housing.rotation.x = Math.PI / 2;
    g.add(housing);

    const outerRing = mesh(new THREE.TorusGeometry(0.047, 0.0045, 12, 64), whiteSatin);
    outerRing.position.z = 0.017;
    g.add(outerRing);

    const rgbRing = makeRgbRing(0.0415, 0.0028, 0.1);
    rgbRing.position.z = 0.019;
    g.add(rgbRing);

    const screenBack = new THREE.Mesh(new THREE.CircleGeometry(0.035, 64), black);
    screenBack.position.z = 0.019;
    g.add(screenBack);

    const screen = new THREE.Mesh(
      new THREE.CircleGeometry(0.0345, 64),
      new THREE.MeshBasicMaterial({ map: lcdTexture, toneMapped: false })
    );
    screen.position.z = 0.0205;
    g.add(screen);

    // Side fittings
    for (const x of [-0.014, 0.014]) {
      const fitting = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.022, 20), whiteSatin);
      fitting.position.set(x, 0.052, -0.004);
      g.add(fitting);
      const collar = mesh(new THREE.TorusGeometry(0.011, 0.0025, 8, 20), darkMetal);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(x, 0.063, -0.004);
      g.add(collar);
    }

    const glow = glowSprite(0.16, 0x63e9ff, 0.25);
    glow.position.z = 0.05;
    g.add(glow);

    register('pump', g);
  }

  /* ================================================================== */
  /* 06 · GPU                                                            */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(-0.01, 0.303, 0.073);

    // PCB and backplate
    g.add(box(0.305, 0.135, 0.008, pcb, 0, 0, -0.018));
    const back = rbox(0.31, 0.14, 0.008, 0.004, silver);
    back.position.z = -0.028;
    g.add(back);

    // Shroud
    const shroud = rbox(0.312, 0.145, 0.052, 0.012, white);
    g.add(shroud);
    const lower = box(0.312, 0.03, 0.056, whiteSatin, 0, -0.058, 0.001);
    g.add(lower);

    // Silver accent wings
    for (const y of [0.064, -0.069]) {
      const wing = box(0.315, 0.007, 0.06, silver, 0, y, 0.002);
      g.add(wing);
    }
    for (const x of [-0.148, 0.148]) {
      const wing = box(0.007, 0.14, 0.058, silver, x, 0.005, 0.003);
      g.add(wing);
    }

    // Three fans
    for (let i = 0; i < 3; i += 1) {
      const fan = createFan({ size: 0.083, thickness: 0.018, phase: i * 0.17 + 0.05, spin: 0.75 });
      fan.position.set(-0.096 + i * 0.096, 0.01, 0.033);
      g.add(fan);
    }

    // Edge label
    const label = textPlane(gpuLabelTexture, 0.2, 0.038, { transparent: true });
    label.position.set(-0.045, -0.057, 0.031);
    g.add(label);

    // RGB accent on the top edge
    const accent = box(0.24, 0.002, 0.006, rgbMaterials[0], -0.02, 0.073, 0.02);
    g.add(accent);
    const accent2 = box(0.012, 0.002, 0.045, rgbMaterials[1], 0.145, 0.073, 0.02);
    g.add(accent2);

    // Heatpipes peeking above the card
    for (let i = 0; i < 3; i += 1) {
      const hp = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.29, 12), chrome);
      hp.rotation.z = Math.PI / 2;
      hp.position.set(0, 0.078 + i * 0.001, -0.022 - i * 0.011);
      g.add(hp);
    }

    // Vertical mount bracket
    const bracket = box(0.02, 0.13, 0.08, white, 0.165, 0, -0.005);
    g.add(bracket);
    const bracketFoot = box(0.05, 0.035, 0.08, whiteSatin, 0.17, -0.075, 0.0);
    g.add(bracketFoot);
    for (const y of [-0.04, 0.04]) {
      const s = mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.008, 20), silver);
      s.rotation.z = Math.PI / 2;
      s.position.set(0.176, y, 0.0);
      g.add(s);
    }

    // PCIe riser ribbon, GPU end to motherboard
    const riserMat = new THREE.MeshStandardMaterial({ color: 0xdce3ea, roughness: 0.8, metalness: 0.05 });
    g.add(
      tube(
        [
          V(0.11, -0.085, -0.06),
          V(0.13, -0.12, -0.11),
          V(0.14, -0.16, -0.08),
          V(0.145, -0.17, -0.02),
        ],
        0.0045,
        riserMat,
        28,
        6
      )
    );

    const glow = glowSprite(0.35, 0xff4fc5, 0.18);
    glow.position.set(0, 0, 0.09);
    g.add(glow);

    register('gpu', g);
  }

  /* ================================================================== */
  /* 07 · MOTHERBOARD                                                    */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(0.012, 0.337, -0.085);

    const board = mesh(new THREE.BoxGeometry(0.302, 0.33, 0.009), pcb);
    g.add(board);

    // Standoffs / screws
    const standoffs = [
      [-0.13, 0.14], [0.13, 0.14], [-0.13, 0.05], [0.13, 0.05],
      [-0.13, -0.06], [0.13, -0.06], [-0.05, -0.145], [0.08, -0.145], [0.13, -0.145],
    ];
    for (const [x, y] of standoffs) {
      const s = screw(0.0055, 0.006, silver);
      s.position.set(x, y, 0.0075);
      g.add(s);
    }

    // CPU socket + retention
    g.add(box(0.062, 0.062, 0.006, darkMatte, 0.008, 0.055, 0.008));
    const cpu = box(0.038, 0.038, 0.003, silver, 0.008, 0.055, 0.0115);
    g.add(cpu);
    const retention = box(0.075, 0.075, 0.002, black, 0.008, 0.055, 0.0105);
    g.add(retention);

    // VRM heatsinks along the top
    for (let i = 0; i < 2; i += 1) {
      const sink = rbox(0.105, 0.035, 0.026, 0.004, whiteSatin);
      sink.position.set(-0.055 + i * 0.11, 0.139, 0.012);
      g.add(sink);
      for (let f = 0; f < 5; f += 1) {
        g.add(box(0.004, 0.03, 0.027, silver, -0.095 + i * 0.11 + f * 0.016, 0.139, 0.013));
      }
    }

    // Rear I/O shroud
    const shroud = rbox(0.082, 0.072, 0.032, 0.008, white);
    shroud.position.set(-0.104, 0.118, 0.014);
    g.add(shroud);
    for (let i = 0; i < 6; i += 1) {
      g.add(box(0.007, 0.052, 0.0015, darkMetal, -0.133 + i * 0.0095, 0.115, 0.031));
    }
    const shroudLine = box(0.05, 0.002, 0.002, rgbMaterials[0], -0.105, 0.086, 0.032);
    g.add(shroudLine);

    // Memory slots
    for (let i = 0; i < 4; i += 1) {
      const slot = box(0.0085, 0.13, 0.012, black, 0.083 + i * 0.014, 0.06, 0.011);
      g.add(slot);
      g.add(box(0.011, 0.009, 0.014, whiteInset, 0.083 + i * 0.014, 0.128, 0.012));
      g.add(box(0.011, 0.009, 0.014, whiteInset, 0.083 + i * 0.014, -0.008, 0.012));
    }

    // Chipset heatsink
    const chipset = rbox(0.065, 0.058, 0.014, 0.006, white);
    chipset.position.set(0.105, -0.072, 0.012);
    g.add(chipset);
    g.add(box(0.04, 0.002, 0.002, rgbMaterials[1], 0.105, -0.099, 0.019));
    g.add(box(0.05, 0.042, 0.002, darkMatte, 0.105, -0.072, 0.0205));

    // PCIe slots
    for (let i = 0; i < 2; i += 1) {
      const slot = box(0.165, 0.009, 0.014, black, -0.02, -0.105 - i * 0.045, 0.011);
      g.add(slot);
      g.add(box(0.17, 0.002, 0.015, silver, -0.02, -0.1 - i * 0.045, 0.012));
    }

    // SATA / headers
    for (let i = 0; i < 4; i += 1) {
      const port = box(0.022, 0.012, 0.016, darkMatte, 0.126, -0.015 + i * 0.018, 0.012);
      g.add(port);
    }
    for (let i = 0; i < 4; i += 1) {
      g.add(box(0.014, 0.004, 0.006, black, 0.04 + i * 0.025, 0.16, 0.012));
    }

    // Capacitors and chokes
    const capPositions = [
      [-0.06, 0.02], [-0.075, 0.02], [-0.09, 0.02], [-0.06, -0.01],
      [-0.09, -0.01], [0.14, 0.1], [0.14, 0.08], [0.14, 0.06],
    ];
    for (const [x, y] of capPositions) {
      const cap = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.018, 16), silver);
      cap.rotation.x = Math.PI / 2;
      cap.position.set(x, y, 0.017);
      g.add(cap);
    }
    for (let i = 0; i < 5; i += 1) {
      g.add(box(0.018, 0.016, 0.012, darkMatte, -0.07 + i * 0.025, 0.105, 0.012));
    }

    // M.2 slot under the GPU
    g.add(box(0.095, 0.024, 0.008, darkMatte, 0.035, -0.083, 0.01));
    g.add(box(0.006, 0.02, 0.012, silver, 0.088, -0.083, 0.011));

    // Subtle board RGB strip
    for (let i = 0; i < 6; i += 1) {
      g.add(box(0.02, 0.002, 0.0015, rgbMaterials[i % 2], -0.07 + i * 0.026, -0.158, 0.012));
    }

    // Fan / pump headers
    for (const [x, y] of [[0.05, 0.14], [0.075, 0.14], [0.1, 0.14], [0.025, -0.14]]) {
      g.add(box(0.014, 0.008, 0.009, black, x, y, 0.012));
    }

    register('motherboard', g);
  }

  /* ================================================================== */
  /* 08 · RAM                                                            */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(0.112, 0.43, -0.061);

    for (let i = 0; i < 2; i += 1) {
      const stick = new THREE.Group();
      stick.position.x = i * 0.019;
      const body = rbox(0.012, 0.118, 0.036, 0.003, white);
      stick.add(body);
      stick.add(box(0.013, 0.004, 0.036, silver, 0, 0.058, 0));
      stick.add(box(0.0125, 0.003, 0.034, i === 0 ? rgbMaterials[0] : rgbMaterials[1], 0, 0.062, 0));
      stick.add(box(0.0135, 0.008, 0.037, whiteSatin, 0, -0.061, 0));
      // black PCB sliver at the bottom
      stick.add(box(0.009, 0.006, 0.035, darkMatte, 0, -0.065, 0));
      // side label
      const label = box(0.001, 0.022, 0.022, darkMetal, -0.0067, 0.028, 0.002);
      stick.add(label);
      g.add(stick);
    }

    const glow = glowSprite(0.15, 0xff67d0, 0.22);
    glow.position.set(0.01, 0.08, 0.01);
    g.add(glow);

    register('ram', g);
  }

  /* ================================================================== */
  /* 09 · M.2 SSD                                                        */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(0.045, 0.254, -0.06);

    const board = box(0.092, 0.024, 0.004, darkMatte);
    g.add(board);
    const heatsink = rbox(0.094, 0.027, 0.009, 0.003, white);
    heatsink.position.z = 0.007;
    g.add(heatsink);
    for (let i = 0; i < 5; i += 1) {
      g.add(box(0.078, 0.0018, 0.002, silver, 0, -0.008 + i * 0.004, 0.012));
    }
    const brand = box(0.035, 0.006, 0.001, darkMetal, -0.018, 0.008, 0.012);
    g.add(brand);
    const led = box(0.005, 0.002, 0.0015, cyanLED, 0.035, 0.009, 0.0125);
    g.add(led);
    const retention = screw(0.0045, 0.004, silver);
    retention.position.set(0.041, 0.0, 0.012);
    g.add(retention);

    register('m2', g);
  }

  /* ================================================================== */
  /* 10 · SIDE INTAKE FANS                                               */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(0.214, 0.335, -0.008);

    // Slim mounting frame around the two 140 mm fans
    g.add(box(0.012, 0.47, 0.032, white, -0.025, 0, 0.092));
    g.add(box(0.012, 0.47, 0.032, white, -0.025, 0, -0.092));
    g.add(box(0.012, 0.032, 0.19, white, -0.025, 0.219, 0));
    g.add(box(0.012, 0.032, 0.19, white, -0.025, -0.219, 0));
    g.add(box(0.012, 0.032, 0.19, white, -0.025, 0, 0));

    for (let i = 0; i < 2; i += 1) {
      const fan = createFan({ size: 0.172, thickness: 0.038, phase: i * 0.11, spin: 0.55 });
      fan.rotation.y = Math.PI / 2;
      fan.position.set(0.004, -0.108 + i * 0.216, 0);
      g.add(fan);
    }

    // Magnetic dust filter hint behind the glass
    const filter = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.18),
      new THREE.MeshBasicMaterial({
        map: meshTexture,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    filter.rotation.y = Math.PI / 2;
    filter.position.set(0.028, 0, 0);
    g.add(filter);

    const glow = glowSprite(0.4, 0xa76bff, 0.16);
    glow.position.set(0.08, 0, 0);
    g.add(glow);

    register('sideFans', g);
  }

  /* ================================================================== */
  /* 11 · BOTTOM FANS                                                    */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(0, 0.105, 0.01);

    // Fan tray
    g.add(box(0.42, 0.012, 0.025, white, 0, -0.033, 0.09));
    g.add(box(0.42, 0.012, 0.025, white, 0, -0.033, -0.09));
    g.add(box(0.025, 0.012, 0.19, white, -0.195, -0.033, 0));
    g.add(box(0.025, 0.012, 0.19, white, 0.195, -0.033, 0));
    g.add(box(0.04, 0.012, 0.19, white, 0.0, -0.033, 0));

    for (let i = 0; i < 3; i += 1) {
      const fan = createFan({ size: 0.114, thickness: 0.025, phase: i * 0.09, spin: 0.5 });
      fan.rotation.x = -Math.PI / 2;
      fan.position.set(-0.13 + i * 0.13, 0, 0);
      g.add(fan);
    }

    // Pull-out dust filter
    const filter = box(0.4, 0.003, 0.18, new THREE.MeshStandardMaterial({
      map: meshTexture,
      color: 0x8394a3,
      roughness: 0.7,
      metalness: 0.4,
      transparent: true,
      opacity: 0.72,
    }), 0, -0.042, 0);
    g.add(filter);

    register('bottomFans', g);
  }

  /* ================================================================== */
  /* 12 · PSU                                                            */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(0.065, 0.145, -0.165);

    const body = rbox(0.17, 0.092, 0.15, 0.006, white);
    g.add(body);
    g.add(box(0.174, 0.008, 0.154, whiteSatin, 0, 0.046, 0));
    g.add(box(0.172, 0.091, 0.01, whiteSatin, 0, 0, 0.075));
    g.add(box(0.172, 0.091, 0.01, whiteSatin, 0, 0, -0.075));

    // Fan grille on the bottom face
    const grille = new THREE.Group();
    grille.position.y = -0.048;
    const grilleRing = mesh(new THREE.TorusGeometry(0.059, 0.004, 8, 48), darkMetal);
    grilleRing.rotation.x = Math.PI / 2;
    grille.add(grilleRing);
    for (let i = 1; i <= 3; i += 1) {
      const ring = mesh(new THREE.TorusGeometry(0.059 * (i / 4), 0.0018, 6, 40), darkMetal);
      ring.rotation.x = Math.PI / 2;
      grille.add(ring);
    }
    g.add(grille);

    // Side label
    const label = box(0.055, 0.032, 0.002, darkMatte, 0.0, 0.0, 0.081);
    g.add(label);
    g.add(box(0.04, 0.002, 0.0015, rgbMaterials[2 % rgbMaterials.length], 0, 0.01, 0.0825));
    const vent = box(0.06, 0.06, 0.002, new THREE.MeshStandardMaterial({
      color: 0x3e4b59,
      roughness: 0.6,
      metalness: 0.7,
    }), 0.0, 0.0, 0.0815);
    g.add(vent);

    for (const [x, y] of [[-0.073, 0.033], [0.073, 0.033], [-0.073, -0.033], [0.073, -0.033]]) {
      const s = screw(0.006, 0.004, silver);
      s.position.set(x, y, -0.078);
      g.add(s);
    }

    // Modular cable loom, from the PSU towards the tray grommets
    const cableMat = new THREE.MeshStandardMaterial({ color: 0xd9e1e8, roughness: 0.85, metalness: 0.02 });
    const cableMatDark = new THREE.MeshStandardMaterial({ color: 0x141a22, roughness: 0.9, metalness: 0.02 });
    const cables = [
      { color: cableMat, offset: 0.0, radius: 0.006 },
      { color: cableMat, offset: 0.014, radius: 0.005 },
      { color: cableMatDark, offset: 0.028, radius: 0.0055 },
    ];
    for (const c of cables) {
      g.add(tube(
        [
          V(0.055, c.offset, 0.075),
          V(0.075, 0.08, 0.12),
          V(0.12, 0.12, 0.14),
          V(0.15, 0.17, 0.12),
        ],
        c.radius,
        c.color,
        32,
        6
      ));
    }

    register('psu', g);
  }

  /* ================================================================== */
  /* 13 · REAR FAN                                                       */
  /* ================================================================== */
  {
    const g = new THREE.Group();
    g.position.set(-0.04, 0.415, -0.212);

    const fan = createFan({ size: 0.115, thickness: 0.026, phase: 0.35, spin: 0.45 });
    g.add(fan);

    const bracket = box(0.15, 0.15, 0.006, whiteSatin, 0, 0, -0.024);
    g.add(bracket);
    // cut a visual opening with a dark circle in front of the bracket
    const opening = new THREE.Mesh(
      new THREE.CircleGeometry(0.055, 40),
      new THREE.MeshBasicMaterial({ color: 0x04070b, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    opening.position.z = -0.028;
    g.add(opening);
    for (const [x, y] of [[-0.058, 0.058], [0.058, 0.058], [-0.058, -0.058], [0.058, -0.058]]) {
      const s = screw(0.006, 0.004, silver);
      s.position.set(x, y, -0.03);
      g.add(s);
    }

    register('rearFan', g);
  }

  /* ================================================================== */
  /* 14 · FRAME / STRUCTURE (static)                                     */
  /* ================================================================== */
  {
    const g = new THREE.Group();

    // Outer beams: top and bottom rectangles
    const t = CASE.wall;
    const yb = 0.05;
    const yt = CASE.top - 0.006;
    const xl = -CASE.width / 2 + 0.006;
    const xr = CASE.width / 2 - 0.006;
    const zf = CASE.depth / 2 - 0.006;
    const zr = -CASE.depth / 2 + 0.006;

    g.add(beam(V(xl, yt, zf), V(xr, yt, zf), t, white));
    g.add(beam(V(xl, yt, zr), V(xr, yt, zr), t, white));
    g.add(beam(V(xl, yt, zr), V(xl, yt, zf), t, white));
    g.add(beam(V(xr, yt, zr), V(xr, yt, zf), t, white));

    g.add(beam(V(xl, yb, zf), V(xr, yb, zf), t, white));
    g.add(beam(V(xl, yb, zr), V(xr, yb, zr), t, white));
    g.add(beam(V(xl, yb, zr), V(xl, yb, zf), t, white));
    g.add(beam(V(xr, yb, zr), V(xr, yb, zf), t, white));

    // Rear verticals only — the front corner is deliberately pillar-free
    g.add(beam(V(xl, yb, zr), V(xl, yt, zr), t, white));
    g.add(beam(V(xr, yb, zr), V(xr, yt, zr), t, white));

    // Bottom panel
    g.add(box(0.472, 0.016, 0.432, white, 0, 0.058, 0));
    // feet
    for (const [x, z] of [[-0.19, -0.16], [0.19, -0.16], [-0.19, 0.17], [0.19, 0.17]]) {
      const foot = rbox(0.058, 0.046, 0.085, 0.008, white);
      foot.position.set(x, 0.025, z);
      foot.rotation.y = x > 0 ? -0.18 : 0.18;
      g.add(foot);
      const rubberPad = box(0.05, 0.004, 0.07, rubber, x, 0.003, z);
      g.add(rubberPad);
    }

    // Left side panel
    const left = rbox(0.012, 0.51, 0.44, 0.006, white);
    left.position.set(-0.244, 0.33, 0);
    g.add(left);
    for (let i = 0; i < 7; i += 1) {
      g.add(box(0.002, 0.006, 0.12, darkMetal, -0.251, 0.22 + i * 0.026, 0.12));
    }

    // Dark acoustically-textured inset on the inner face of the left panel.
    // This gives the pale interior a layered backdrop instead of a flat wall.
    const ventTexture = meshTexture.clone();
    ventTexture.repeat.set(2.6, 2.6);
    ventTexture.needsUpdate = true;
    const ventMat = new THREE.MeshStandardMaterial({
      color: 0x2a3542,
      map: ventTexture,
      roughness: 0.78,
      metalness: 0.25,
    });
    const innerVent = mesh(new THREE.PlaneGeometry(0.35, 0.39), ventMat, { shadow: false, receive: true });
    innerVent.rotation.y = Math.PI / 2;
    innerVent.position.set(-0.2367, 0.33, 0.035);
    g.add(innerVent);
    for (const y of [0.17, 0.33, 0.49]) {
      g.add(box(0.004, 0.012, 0.36, whiteSatin, -0.233, y, 0.035));
    }
    for (const z of [-0.12, 0.19]) {
      g.add(box(0.004, 0.32, 0.012, whiteSatin, -0.233, 0.33, z));
    }
    // Soft interior LED wash strip
    const ledStrip = box(0.002, 0.005, 0.28, new THREE.MeshBasicMaterial({
      color: 0x9eefff,
      toneMapped: false,
      transparent: true,
      opacity: 0.8,
    }), -0.2335, 0.535, 0.02);
    g.add(ledStrip);

    // Rear panel
    const rear = rbox(0.5, 0.51, 0.012, 0.006, white);
    rear.position.set(0, 0.33, -0.231);
    g.add(rear);
    // rear fan opening illusion + ventilation
    g.add(box(0.16, 0.16, 0.002, darkMatte, -0.04, 0.415, -0.238));
    for (let i = 0; i < 11; i += 1) {
      g.add(box(0.11, 0.004, 0.002, black, 0.13, 0.14 + i * 0.018, -0.239));
    }
    // rear I/O cutout
    g.add(box(0.1, 0.075, 0.002, darkMetal, -0.12, 0.42, -0.2375));
    for (const y of [0.43, 0.418, 0.405]) {
      g.add(box(0.085, 0.008, 0.004, silver, -0.12, y, -0.238));
    }
    // rear expansion slots (below the vertical GPU)
    for (let i = 0; i < 7; i += 1) {
      g.add(box(0.12, 0.012, 0.004, silver, 0.12, 0.18 + i * 0.018, -0.239));
    }

    // Interior tray
    const tray = rbox(0.43, 0.49, 0.014, 0.005, trayMat);
    tray.position.set(0, 0.33, -0.112);
    g.add(tray);
    // Tray cut-outs / grommets
    for (const [x, y, w, h] of [[0.13, 0.09, 0.05, 0.12], [0.055, -0.12, 0.22, 0.04], [-0.14, 0.22, 0.03, 0.11]]) {
      g.add(box(w + 0.014, h + 0.014, 0.004, darkMetal, x, y, -0.103));
      g.add(box(w, h, 0.004, black, x, y, -0.101));
    }
    // Cable guides
    for (const y of [0.1, 0.24, 0.4]) {
      const guide = box(0.02, 0.035, 0.02, white, 0.17, y, -0.1);
      g.add(guide);
    }

    // A few routed white cables
    const cableMat = new THREE.MeshStandardMaterial({ color: 0xd7e1e9, roughness: 0.85 });
    g.add(tube([V(0.145, 0.29, -0.07), V(0.19, 0.24, -0.09), V(0.16, 0.18, -0.11), V(0.13, 0.12, -0.095)], 0.0045, cableMat, 26, 6));
    g.add(tube([V(0.15, 0.28, -0.075), V(0.205, 0.22, -0.095), V(0.18, 0.15, -0.11), V(0.14, 0.1, -0.09)], 0.004, cableMat, 26, 6));

    // Top front I/O
    const io = new THREE.Group();
    io.position.set(0.155, 0.585, 0.234);
    io.add(box(0.085, 0.02, 0.008, whiteSatin, 0, 0, 0));
    const power = mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.007, 24), silver);
    power.rotation.x = Math.PI / 2;
    power.position.set(-0.03, 0, 0.006);
    io.add(power);
    const powerRing = mesh(new THREE.TorusGeometry(0.011, 0.0015, 6, 28), cyanLED);
    powerRing.position.set(-0.03, 0, 0.009);
    io.add(powerRing);
    io.add(box(0.014, 0.008, 0.004, black, 0.005, 0, 0.007));
    io.add(box(0.014, 0.008, 0.004, black, 0.024, 0, 0.007));
    io.add(box(0.012, 0.007, 0.004, black, 0.041, 0, 0.007));
    g.add(io);

    // Front bottom trim badge
    const badge = box(0.07, 0.018, 0.003, silver, 0.155, 0.078, 0.232);
    g.add(badge);

    // Rear thumbscrew for the side glass
    const ts = screw(0.008, 0.005, silver);
    ts.position.set(0.247, 0.09, -0.19);
    ts.rotation.y = Math.PI / 2;
    g.add(ts);

    register('frame', g);
  }

  /* ------------------------------------------------------------------ */
  /* Ambient LED halos inside the case                                  */
  /* ------------------------------------------------------------------ */
  const haloA = glowSprite(0.55, 0x389dff, 0.1);
  haloA.position.set(-0.02, 0.3, 0.16);
  root.add(haloA);
  const haloB = glowSprite(0.45, 0xff42c4, 0.08);
  haloB.position.set(0.2, 0.32, 0.05);
  root.add(haloB);

  return { root, parts, anchors, fanRotors, CASE, materials: { glass, glassStreak } };
}
