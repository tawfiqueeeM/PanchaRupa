import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const FACTORY_STATIONS = [
  {
    id: 'intake',
    order: 1,
    shortcut: '1',
    roomCode: 'ROOM 01',
    pillTitle: '01 · INTAKE',
    name: '1. Raw Leaf Reception & Diverter',
    shortName: 'Room 01: Intake',
    x: -16,
    z: -5.5,
    cameraOffset: { x: -16, y: 4.2, z: 3.2 },
    lookAtOffset: { x: -16, y: 1.1, z: -5.5 },
  },
  {
    id: 'withering',
    order: 2,
    shortcut: '2',
    roomCode: 'ROOM 02',
    pillTitle: '02 · WITHERING',
    name: '2. Climate-Controlled Withering Hall',
    shortName: 'Room 02: Withering',
    x: -8,
    z: -5.5,
    cameraOffset: { x: -8, y: 4.2, z: 3.2 },
    lookAtOffset: { x: -8, y: 1.1, z: -5.5 },
  },
  {
    id: 'rolling',
    order: 3,
    shortcut: '3',
    roomCode: 'ROOM 03',
    pillTitle: '03 · ROLLING',
    name: '3. Fixation, Rolling & Oxidation Room',
    shortName: 'Room 03: Rolling',
    x: -12,
    z: 4.5,
    cameraOffset: { x: -12, y: 4.2, z: 12.8 },
    lookAtOffset: { x: -12, y: 1.1, z: 4.5 },
  },
  {
    id: 'dryer',
    order: 4,
    shortcut: '4',
    roomCode: 'ROOM 04',
    pillTitle: '04 · DRYER',
    name: '4. Thermal Drying Room (ATEX Zone 22)',
    shortName: 'Room 04: Dryer',
    x: 0,
    z: -5.5,
    cameraOffset: { x: 0, y: 4.2, z: 3.2 },
    lookAtOffset: { x: 0, y: 1.2, z: -5.5 },
  },
  {
    id: 'sorting',
    order: 5,
    shortcut: '5',
    roomCode: 'ROOM 05',
    pillTitle: '05 · SORTING',
    name: '5. Vibratory Grading & Optical Sorting',
    shortName: 'Room 05: Sorting',
    x: 8,
    z: -5.5,
    cameraOffset: { x: 8, y: 4.2, z: 3.2 },
    lookAtOffset: { x: 8, y: 1.1, z: -5.5 },
  },
  {
    id: 'warehouse',
    order: 6,
    shortcut: '6',
    roomCode: 'ROOM 06',
    pillTitle: '06 · PACKAGING',
    name: '6. Cleanroom Weigh-Fill & Foil Packaging',
    shortName: 'Room 06: Packaging',
    x: 16,
    z: -5.5,
    cameraOffset: { x: 16, y: 4.2, z: 3.4 },
    lookAtOffset: { x: 16, y: 1.1, z: -5.5 },
  },
];

// Centered front-isometric Overview camera framing all 6 rooms with wide pill separation
const OVERVIEW_CAMERA = {
  pos: new THREE.Vector3(-12, 24, 25),
  target: new THREE.Vector3(0, 0, -1.5),
};

// Deterministic PRNG for repeatable procedural leaf textures
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawSerratedLeaf(ctx, x, y, len, wid, angle, fillStyle, veinStyle, serrated = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-len * 0.5, 0);
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const px = -len * 0.5 + len * t;
    const arch = Math.sin(t * Math.PI) * wid * 0.5;
    const tooth = serrated && i < steps ? (i % 2 === 0 ? 1.14 : 0.9) : 1.0;
    ctx.lineTo(px, -arch * tooth);
  }
  for (let i = steps - 1; i >= 0; i--) {
    const t = i / steps;
    const px = -len * 0.5 + len * t;
    const arch = Math.sin(t * Math.PI) * wid * 0.5;
    const tooth = serrated && i > 0 ? (i % 2 === 0 ? 1.14 : 0.9) : 1.0;
    ctx.lineTo(px, arch * tooth);
  }
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();

  if (veinStyle) {
    ctx.strokeStyle = veinStyle;
    ctx.lineWidth = Math.max(1, wid * 0.06);
    ctx.beginPath();
    ctx.moveTo(-len * 0.45, 0);
    ctx.lineTo(len * 0.44, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function generateLeafStageCanvases(stageId, size = 512) {
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = size;
  diffCanvas.height = size;
  const dCtx = diffCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  const seedMap = {
    intake: 101,
    withering: 202,
    rolling: 303,
    rolling_green: 353,
    dryer: 404,
    sorting: 505,
    reject: 555,
    warehouse: 606,
  };
  const rand = mulberry32(seedMap[stageId] || 101);

  if (stageId === 'intake') {
    dCtx.fillStyle = '#1b4d22';
    dCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#303030';
    bCtx.fillRect(0, 0, size, size);

    const greens = ['#2e7d32', '#388e3c', '#43a047', '#66bb6a'];
    for (let i = 0; i < 420; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const len = size * (0.09 + rand() * 0.08);
      const wid = len * (0.36 + rand() * 0.14);
      const ang = rand() * Math.PI * 2;
      drawSerratedLeaf(dCtx, x, y, len, wid, ang, greens[Math.floor(rand() * greens.length)], '#a5d6a7', true);
      const bVal = Math.floor(110 + rand() * 120);
      drawSerratedLeaf(bCtx, x, y, len, wid, ang, `rgb(${bVal},${bVal},${bVal})`, null, true);
    }
    for (let i = 0; i < 65; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const len = size * (0.05 + rand() * 0.03);
      const ang = rand() * Math.PI * 2;
      drawSerratedLeaf(dCtx, x, y, len, len * 0.24, ang, '#e8f5e9', '#c8e6c9', false);
      drawSerratedLeaf(bCtx, x, y, len, len * 0.24, ang, '#f0f0f0', null, false);
    }
  } else if (stageId === 'withering') {
    dCtx.fillStyle = '#3b4a20';
    dCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#404040';
    bCtx.fillRect(0, 0, size, size);

    const olives = ['#556b2f', '#6b8e23', '#4f6228', '#687834'];
    for (let i = 0; i < 460; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const len = size * (0.08 + rand() * 0.07);
      const wid = len * (0.28 + rand() * 0.12);
      const ang = rand() * Math.PI * 2;
      drawSerratedLeaf(dCtx, x, y, len, wid, ang, olives[Math.floor(rand() * olives.length)], '#8fa354', true);
      const bVal = Math.floor(95 + rand() * 105);
      drawSerratedLeaf(bCtx, x, y, len, wid, ang, `rgb(${bVal},${bVal},${bVal})`, null, true);
    }
  } else if (stageId === 'rolling_green') {
    // Steamed emerald rolled Green Tea leaves
    dCtx.fillStyle = '#0f3d26';
    dCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#353535';
    bCtx.fillRect(0, 0, size, size);

    const emeralds = ['#15803d', '#16a34a', '#047857', '#22c55e'];
    for (let i = 0; i < 500; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const len = size * (0.05 + rand() * 0.045);
      const wid = len * (0.24 + rand() * 0.14);
      const ang = rand() * Math.PI * 2;
      drawSerratedLeaf(dCtx, x, y, len, wid, ang, emeralds[Math.floor(rand() * emeralds.length)], '#86efac', false);
      const bVal = Math.floor(110 + rand() * 130);
      drawSerratedLeaf(bCtx, x, y, len, wid, ang, `rgb(${bVal},${bVal},${bVal})`, null, false);
    }
  } else if (stageId === 'rolling') {
    dCtx.fillStyle = '#3b2818';
    dCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#353535';
    bCtx.fillRect(0, 0, size, size);

    const oxidized = ['#6d4c2f', '#8d5524', '#3e4a2b', '#5c3c22'];
    for (let i = 0; i < 520; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const len = size * (0.05 + rand() * 0.05);
      const wid = len * (0.24 + rand() * 0.16);
      const ang = rand() * Math.PI * 2;
      drawSerratedLeaf(dCtx, x, y, len, wid, ang, oxidized[Math.floor(rand() * oxidized.length)], '#a47148', false);
      const bVal = Math.floor(110 + rand() * 135);
      drawSerratedLeaf(bCtx, x, y, len, wid, ang, `rgb(${bVal},${bVal},${bVal})`, null, false);
    }
  } else if (stageId === 'reject') {
    // Pale stalks, yellow/off-spec leaves, and scorched dust for Reject Bin RJ-01
    dCtx.fillStyle = '#3f3526';
    dCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#303030';
    bCtx.fillRect(0, 0, size, size);

    const rejects = ['#b4a06e', '#8c7a52', '#c7b889', '#4a3d2d', '#1c1917'];
    for (let i = 0; i < 540; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const len = size * (0.04 + rand() * 0.06);
      const wid = len * (0.14 + rand() * 0.18);
      const ang = rand() * Math.PI * 2;
      drawSerratedLeaf(dCtx, x, y, len, wid, ang, rejects[Math.floor(rand() * rejects.length)], null, false);
      const bVal = Math.floor(90 + rand() * 140);
      drawSerratedLeaf(bCtx, x, y, len, wid, ang, `rgb(${bVal},${bVal},${bVal})`, null, false);
    }
  } else {
    // dryer, sorting (clean), warehouse: crisp curled dark brownish-black leaves + golden-amber tips
    dCtx.fillStyle = '#14100e';
    dCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#282828';
    bCtx.fillRect(0, 0, size, size);

    const darks = ['#1f1a17', '#2c221e', '#241c18', '#181412'];
    const mult = stageId === 'warehouse' || stageId === 'sorting' ? 0.72 : 1.0;
    for (let i = 0; i < 620; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const len = size * (0.035 + rand() * 0.04) * mult;
      const wid = len * (0.22 + rand() * 0.12);
      const ang = rand() * Math.PI * 2;
      drawSerratedLeaf(dCtx, x, y, len, wid, ang, darks[Math.floor(rand() * darks.length)], null, false);
      const bVal = Math.floor(100 + rand() * 140);
      drawSerratedLeaf(bCtx, x, y, len, wid, ang, `rgb(${bVal},${bVal},${bVal})`, null, false);
    }
    // Metallic-gold tip highlights (#d4a24c)
    for (let i = 0; i < 120; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const len = size * (0.024 + rand() * 0.022) * mult;
      const ang = rand() * Math.PI * 2;
      drawSerratedLeaf(dCtx, x, y, len, len * 0.25, ang, '#d4a24c', '#f3d08a', false);
      drawSerratedLeaf(bCtx, x, y, len, len * 0.25, ang, '#f0f0f0', null, false);
    }
  }

  return { diffCanvas, bumpCanvas };
}

function createSingleLeafBladeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  drawSerratedLeaf(ctx, 64, 64, 112, 46, 0, '#43a047', '#a5d6a7', true);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWovenBambooTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#a47e48';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) {
    for (let x = 0; x < 256; x += 32) {
      const offset = (y / 16) % 2 === 0 ? 0 : 16;
      ctx.fillStyle = (x + y) % 32 === 0 ? '#c49b63' : '#8c6635';
      ctx.fillRect((x + offset) % 256, y + 2, 28, 12);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

function createCurvedLeafBladeGeometry(len = 0.34, wid = 0.16) {
  const geo = new THREE.PlaneGeometry(len, wid, 6, 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const nx = x / (len * 0.5);
    pos.setZ(i, -0.05 * nx * nx + 0.03);
  }
  geo.computeVertexNormals();
  return geo;
}

function createStandUpPouchGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.21, -0.31);
  shape.lineTo(0.21, -0.31);
  shape.lineTo(0.24, 0.23);
  shape.lineTo(0.20, 0.31);
  shape.lineTo(-0.20, 0.31);
  shape.lineTo(-0.24, 0.23);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  geo.center();
  return geo;
}

export function renderTeaLeafSwatch(targetCanvas, stageId) {
  if (!targetCanvas) return;
  const ctx = targetCanvas.getContext('2d');
  const { diffCanvas } = generateLeafStageCanvases(stageId, 256);
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  ctx.drawImage(diffCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
}

function createOrganicLeafBedGeometry(width, depth, baseH, moundAmp, segX = 24, segZ = 16, seed = 7) {
  const geo = new THREE.BoxGeometry(width, baseH, depth, segX, 2, segZ);
  const pos = geo.attributes.position;
  const rand = mulberry32(seed);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y > 0) {
      const nx = x / (width * 0.5);
      const nz = z / (depth * 0.5);
      const edgeFalloff = Math.max(0, (1 - nx * nx * 0.85) * (1 - nz * nz * 0.85));
      const wave =
        0.55 +
        0.25 * Math.sin(x * 3.1 + z * 2.2) +
        0.2 * Math.cos(x * 5.7 - z * 4.3) +
        (rand() - 0.5) * 0.22;
      pos.setY(i, y + moundAmp * edgeFalloff * Math.max(0.1, wave));
    }
  }
  geo.computeVertexNormals();
  return geo;
}

function createLeafClusterGeometry(radius = 0.34, seed = 11) {
  const geo = new THREE.IcosahedronGeometry(radius, 2);
  const pos = geo.attributes.position;
  const rand = mulberry32(seed);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const scaleY = y < 0 ? 0.3 : 0.58;
    const jitter = 0.84 + rand() * 0.32;
    pos.setXYZ(i, x * 1.15 * jitter, y * scaleY * jitter, z * 0.92 * jitter);
  }
  geo.computeVertexNormals();
  return geo;
}

function createPlaqueTexture(title, borderColor = '#64748b', textColor = '#f8fafc', bgColor = 'rgba(15, 23, 42, 0.86)') {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 768, 128);

  ctx.fillStyle = bgColor;
  ctx.fillRect(6, 6, 756, 116);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 756, 116);

  ctx.fillStyle = textColor;
  ctx.font = '700 26px "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 384, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function createFactory3D({
  container,
  labelsContainer,
  onStationSelect,
  onBufferTick,
  initialTheme = 'light',
}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9eef5);
  scene.fog = new THREE.FogExp2(0xe9eef5, 0.0075);

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 180);
  camera.position.copy(OVERVIEW_CAMERA.pos);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(OVERVIEW_CAMERA.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minPolarAngle = 0.12;
  controls.minDistance = 2.5;
  controls.maxDistance = 56;
  controls.update();

  // Neutral industrial lighting
  const hemi = new THREE.HemisphereLight(0xf8fafc, 0xcbd5e1, 1.25);
  scene.add(hemi);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.55);
  dirLight.position.set(-18, 28, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 2;
  dirLight.shadow.camera.far = 85;
  dirLight.shadow.camera.left = -32;
  dirLight.shadow.camera.right = 32;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;
  scene.add(dirLight);

  // L-Shaped Two-Tier Floor (60m x 32m), grids, walkway & zero-overlap conveyors
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.85, metalness: 0.08 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 32), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const gridLight = new THREE.GridHelper(60, 60, 0x94a3b8, 0xb8c4d4);
  gridLight.position.y = 0.008;
  scene.add(gridLight);

  const gridDark = new THREE.GridHelper(60, 60, 0x334155, 0x243042);
  gridDark.position.y = 0.008;
  gridDark.visible = false;
  scene.add(gridDark);

  const walkwayMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.78 });
  const walkway = new THREE.Mesh(new THREE.BoxGeometry(40, 0.03, 1.4), walkwayMat);
  walkway.position.set(0, 0.015, -0.2);
  walkway.receiveShadow = true;
  scene.add(walkway);

  // Conveyor Belts (L-Shaped / Two-Tier, zero overlap):
  const spineBeltMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5, roughness: 0.45 });
  // 1) Path 1 (01->02) East belt along z=-5.5 (x=-16 to x=-8)
  const path1Belt = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.22, 0.72), spineBeltMat);
  path1Belt.position.set(-12, 0.55, -5.5);
  path1Belt.castShadow = true;
  path1Belt.receiveShadow = true;
  scene.add(path1Belt);

  // 2) Path 2 (01->03) South belt along x=-16 (z=-5.5 to z=+3.5) — Green Tea Direct + Flow Rails/Chevrons
  const bypassBeltMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.95,
    roughness: 0.4,
  });
  const path2Belt = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 9.2), bypassBeltMat);
  path2Belt.position.set(-16, 0.55, -1.0);
  path2Belt.castShadow = true;
  path2Belt.receiveShadow = true;
  scene.add(path2Belt);

  const path2Chevrons = [];
  const chevronGeo = new THREE.ConeGeometry(0.18, 0.34, 3);
  for (let c = 0; c < 4; c++) {
    const chev = new THREE.Mesh(chevronGeo, bypassBeltMat);
    chev.rotation.x = Math.PI / 2;
    chev.position.set(-16, 0.68, -4.0 + c * 2.0);
    scene.add(chev);
    path2Chevrons.push(chev);
  }

  // 3) Path 3 (02->03) South belt along x=-8 (z=-5.5 to z=+3.5) — Golden Tea Handover + Flow Rails/Chevrons
  const goldenBeltMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    emissive: 0x000000,
    emissiveIntensity: 0.0,
    transparent: true,
    opacity: 0.35,
    roughness: 0.5,
  });
  const path3Belt = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 9.2), goldenBeltMat);
  path3Belt.position.set(-8, 0.55, -1.0);
  path3Belt.castShadow = true;
  path3Belt.receiveShadow = true;
  scene.add(path3Belt);

  const path3Chevrons = [];
  for (let c = 0; c < 4; c++) {
    const chev = new THREE.Mesh(chevronGeo, goldenBeltMat);
    chev.rotation.x = Math.PI / 2;
    chev.position.set(-8, 0.68, -4.0 + c * 2.0);
    scene.add(chev);
    path3Chevrons.push(chev);
  }

  // 4) Discharge (03->04) North-East belt from (-6, +3.5) to (0, -5.5)
  const dx34 = 6.0;
  const dz34 = -9.0;
  const len34 = Math.hypot(dx34, dz34);
  const path34Belt = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.2, len34), spineBeltMat);
  path34Belt.position.set(-3.0, 0.55, -1.0);
  path34Belt.rotation.y = Math.atan2(dx34, dz34);
  path34Belt.castShadow = true;
  path34Belt.receiveShadow = true;
  scene.add(path34Belt);

  // 5) Upper Process Belt (04->05->06) East along z=-5.5 (x=0 to x=+16)
  const upperEastBelt = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.22, 0.72), spineBeltMat);
  upperEastBelt.position.set(8, 0.55, -5.5);
  upperEastBelt.castShadow = true;
  upperEastBelt.receiveShadow = true;
  scene.add(upperEastBelt);

  // Architectural L-Shaped 6-Room Cutaway Partition System
  const wallBackMat = new THREE.MeshStandardMaterial({ color: 0xdbe3ee, roughness: 0.88 });
  const wallPartitionMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.82 });
  const wallFrameMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.55, roughness: 0.4 });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.55, roughness: 0.42 });

  // Upper Row Back Wall (z = -10.0, x = -20 to +20 -> width 40.4m)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(40.4, 4.2, 0.24), wallBackMat);
  backWall.position.set(0, 2.1, -10.0);
  backWall.receiveShadow = true;
  backWall.castShadow = true;
  scene.add(backWall);

  // Upper Row Low Front Cutaway Curbs (z = -1.0)
  for (const st of FACTORY_STATIONS.filter((s) => s.z < 0)) {
    const leftCurb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.36, 0.2), wallPartitionMat);
    leftCurb.position.set(st.x - 2.6, 0.18, -1.0);
    leftCurb.castShadow = true;
    scene.add(leftCurb);

    const rightCurb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.36, 0.2), wallPartitionMat);
    rightCurb.position.set(st.x + 2.6, 0.18, -1.0);
    rightCurb.castShadow = true;
    scene.add(rightCurb);
  }

  // Upper Row Partition Walls at x = -20, -12, -4, +4, +12, +20 (z = -10.0 to -1.0 -> 9m)
  const upperPartitionXs = [-20, -12, -4, 4, 12, 20];
  upperPartitionXs.forEach((px, idx) => {
    const isOuter = idx === 0 || idx === upperPartitionXs.length - 1;
    const isSolidBetween02and04 = px === -4; // Room 02 and Room 04 have no direct conveyor between them
    const wallHeight = isOuter ? 2.4 : 2.1;

    const backCol = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.2, 0.32), pillarMat);
    backCol.position.set(px, 2.1, -10.0);
    backCol.castShadow = true;
    scene.add(backCol);

    const frontCol = new THREE.Mesh(new THREE.BoxGeometry(0.28, wallHeight, 0.28), pillarMat);
    frontCol.position.set(px, wallHeight / 2, -1.0);
    frontCol.castShadow = true;
    scene.add(frontCol);

    if (isOuter || isSolidBetween02and04) {
      const solidSide = new THREE.Mesh(new THREE.BoxGeometry(0.18, wallHeight, 9.0), wallPartitionMat);
      solidSide.position.set(px, wallHeight / 2, -5.5);
      solidSide.castShadow = true;
      solidSide.receiveShadow = true;
      scene.add(solidSide);
    } else {
      const backSeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, wallHeight, 3.65), wallPartitionMat);
      backSeg.position.set(px, wallHeight / 2, -8.175);
      backSeg.castShadow = true;
      scene.add(backSeg);

      const frontSeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, wallHeight, 3.65), wallPartitionMat);
      frontSeg.position.set(px, wallHeight / 2, -2.825);
      frontSeg.castShadow = true;
      scene.add(frontSeg);

      const lintelH = wallHeight - 1.45;
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.22, lintelH, 1.7), wallFrameMat);
      lintel.position.set(px, 1.45 + lintelH / 2, -5.5);
      lintel.castShadow = true;
      scene.add(lintel);
    }
  });

  // Front Room 03 Bay Cutaway Enclosure (x = -18 to -6, z = +0.75 to +8.25)
  {
    const r3BackLeft = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.2), wallPartitionMat);
    r3BackLeft.position.set(-16.4, 1.1, 0.75);
    scene.add(r3BackLeft);
    const r3BackMid = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.2, 0.2), wallPartitionMat);
    r3BackMid.position.set(-12.0, 1.1, 0.75);
    scene.add(r3BackMid);
    const r3BackRight = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.2), wallPartitionMat);
    r3BackRight.position.set(-7.6, 1.1, 0.75);
    scene.add(r3BackRight);

    const r3Left = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.1, 7.5), wallPartitionMat);
    r3Left.position.set(-18.0, 1.05, 4.5);
    scene.add(r3Left);
    const r3Right = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.1, 5.2), wallPartitionMat);
    r3Right.position.set(-6.0, 1.05, 5.65);
    scene.add(r3Right);

    const r3FrontCurb = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.36, 0.2), wallPartitionMat);
    r3FrontCurb.position.set(-12.0, 0.18, 8.25);
    scene.add(r3FrontCurb);
  }

  // Machine & Procedural Tea Leaf Materials
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.68, roughness: 0.34 });
  const darkSlateMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.55, roughness: 0.45 });
  const brushedIronMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.62, roughness: 0.38 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xb48a4e, metalness: 0.72, roughness: 0.3 });

  const stageLeafMaterials = {};
  for (const [stageId, roughness] of [
    ['intake', 0.78],
    ['withering', 0.88],
    ['rolling', 0.36],
    ['rolling_green', 0.44],
    ['dryer', 0.74],
    ['sorting', 0.7],
    ['reject', 0.86],
    ['warehouse', 0.7],
  ]) {
    const { diffCanvas, bumpCanvas } = generateLeafStageCanvases(stageId, 512);
    const map = new THREE.CanvasTexture(diffCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 4;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.anisotropy = 4;

    stageLeafMaterials[stageId] = new THREE.MeshStandardMaterial({
      map,
      bumpMap,
      bumpScale: 0.045,
      roughness,
      metalness: stageId === 'rolling' ? 0.08 : 0.02,
    });
  }

  // Interactive & Animated Collections
  const clickableTargets = [];
  const hotspotRings = [];
  const witheringFans = [];
  const rollerDrums = [];
  const intakeCrates = [];
  const path1Batches = [];
  const bypassBatches = [];
  const goldenBatches = [];
  const discharge34Batches = [];
  const upperEastBatches = [];
  const dryerHeaters = [];
  const rejectDivertParticles = [];
  const warehouseBoxes = [];
  const stationBeacons = new Map();
  const labelAnchors = new Map();
  const tagAnchors = new Map();
  let diverterArmA = null;
  let diverterArmB = null;
  let gateDG02 = null;
  let rollingBedMesh = null;
  let rollerClumps = [];
  let graderDeckGroup = null;

  // Safety-Yellow ATEX Zone 22 Floor Perimeter around Dryer DR-01 in Room 04 (x = 0, z = -5.5)
  {
    const atexMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const dx = 0;
    const dz = -5.5;
    const w = 6.2;
    const d = 4.2;
    const t = 0.14;
    const borders = [
      { x: dx, z: dz - d / 2, sx: w, sz: t },
      { x: dx, z: dz + d / 2, sx: w, sz: t },
      { x: dx - w / 2, z: dz, sx: t, sz: d },
      { x: dx + w / 2, z: dz, sx: t, sz: d },
    ];
    borders.forEach((b) => {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(b.sx, b.sz), atexMat);
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(b.x, 0.025, b.z);
      scene.add(strip);
    });
  }

  function makeHotspot(station) {
    const hz = station.z > 0 ? station.z + 4.3 : -0.2;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.78, 36),
      new THREE.MeshBasicMaterial({
        color: 0x0f766e,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.78,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(station.x, 0.04, hz);
    ring.userData.stationId = station.id;
    scene.add(ring);
    hotspotRings.push(ring);
    clickableTargets.push(ring);

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.52, 24),
      new THREE.MeshBasicMaterial({
        color: 0x0f766e,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
      })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(station.x, 0.035, hz);
    disc.userData.stationId = station.id;
    scene.add(disc);
    clickableTargets.push(disc);
  }

  function registerStationHitbox(group, stationId, labelPos, tagPos) {
    const st = FACTORY_STATIONS.find((s) => s.id === stationId);
    if (st) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.55, 10),
        darkSlateMat
      );
      pole.position.set(st.x + 2.3, 0.78, st.z + 1.85);
      group.add(pole);

      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(st.x + 2.3, 1.62, st.z + 1.85);

      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x16a34a,
        emissiveIntensity: 1.4,
        roughness: 0.25,
      });
      const beaconMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.34, 8),
        beaconMat
      );
      beaconGroup.add(beaconMesh);

      const finMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.05), finMat);
      beaconGroup.add(fin);

      group.add(beaconGroup);
      stationBeacons.set(stationId, { group: beaconGroup, mesh: beaconMesh, mat: beaconMat });
    }

    group.traverse((child) => {
      if (child.isMesh) {
        child.userData.stationId = stationId;
        child.castShadow = true;
        child.receiveShadow = true;
        clickableTargets.push(child);
      }
    });
    labelAnchors.set(stationId, labelPos);
    if (tagPos) tagAnchors.set(stationId, tagPos);
  }

  // Room 01: Raw Leaf Reception & Diverter (SC-01, DV-01A/B) — Top-Left (x=-16, z=-5.5)
  {
    const st = FACTORY_STATIONS[0];
    const g = new THREE.Group();
    const dockPad = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.38, 4.2), darkSlateMat);
    dockPad.position.set(st.x, 0.19, st.z);
    g.add(dockPad);

    const hopper = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.55, 1.5, 6), steelMat);
    hopper.position.set(st.x + 1.15, 1.55, st.z);
    g.add(hopper);

    const scalePost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.9, 0.18), brushedIronMat);
    scalePost.position.set(st.x - 1.9, 1.15, st.z + 1.4);
    g.add(scalePost);

    const gateMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
    diverterArmA = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.85), gateMat);
    diverterArmA.position.set(st.x + 2.45, 0.95, st.z);
    g.add(diverterArmA);

    diverterArmB = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.14), gateMat);
    diverterArmB.position.set(st.x, 0.95, st.z + 2.1);
    g.add(diverterArmB);

    const wovenMat = new THREE.MeshStandardMaterial({
      map: createWovenBambooTexture(),
      roughness: 0.88,
      metalness: 0.04,
    });
    const basketGeo = new THREE.CylinderGeometry(0.48, 0.33, 0.48, 18);
    const heapGeo = createLeafClusterGeometry(0.42, 21);
    const bladeGeo = createCurvedLeafBladeGeometry(0.36, 0.17);
    const bladeMat = new THREE.MeshStandardMaterial({
      map: createSingleLeafBladeTexture(),
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.72,
    });

    for (let i = 0; i < 4; i++) {
      const basketGroup = new THREE.Group();
      basketGroup.add(new THREE.Mesh(basketGeo, wovenMat));
      const leafHeap = new THREE.Mesh(heapGeo, stageLeafMaterials.intake);
      leafHeap.position.y = 0.24;
      basketGroup.add(leafHeap);

      for (let b = 0; b < 7; b++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        const angle = (b / 7) * Math.PI * 2;
        blade.position.set(Math.cos(angle) * 0.22, 0.36 + (b % 2) * 0.06, Math.sin(angle) * 0.22);
        blade.rotation.set(0.45, angle, 0.25);
        basketGroup.add(blade);
      }

      basketGroup.position.set(st.x - 2.2 + i * 1.15, 0.92, st.z);
      basketGroup.userData.baseX = st.x - 2.3;
      basketGroup.userData.phase = i * 0.25;
      g.add(basketGroup);
      intakeCrates.push(basketGroup);
    }

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 2.75, st.z),
      new THREE.Vector3(st.x - 1.9, 2.2, st.z + 1.4)
    );
  }

  // Room 02: Climate-Controlled Withering Hall — Top-Center-Left (x=-8, z=-5.5)
  {
    const st = FACTORY_STATIONS[1];
    const g = new THREE.Group();
    let fanIdx = 0;
    const witheredBedGeo = createOrganicLeafBedGeometry(4.85, 1.32, 0.16, 0.22, 32, 14, 33);
    for (const tz of [-1.25, 1.25]) {
      const trough = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 1.5), steelMat);
      trough.position.set(st.x, 0.65, st.z + tz);
      g.add(trough);

      const leafBed = new THREE.Mesh(witheredBedGeo, stageLeafMaterials.withering);
      leafBed.position.set(st.x, 1.14, st.z + tz);
      g.add(leafBed);

      for (const fx of [-2.75, 2.75]) {
        const shroud = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 0.36, 18),
          darkSlateMat
        );
        shroud.rotation.z = Math.PI / 2;
        shroud.position.set(st.x + fx, 0.75, st.z + tz);
        g.add(shroud);

        const fanGroup = new THREE.Group();
        fanGroup.position.set(st.x + fx + (fx < 0 ? -0.22 : 0.22), 0.75, st.z + tz);
        for (let b = 0; b < 4; b++) {
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.82, 0.16),
            new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.55, roughness: 0.32 })
          );
          blade.rotation.x = (b * Math.PI) / 4;
          fanGroup.add(blade);
        }
        fanGroup.userData.fanIndex = fanIdx++;
        g.add(fanGroup);
        witheringFans.push(fanGroup);
      }
    }

    gateDG02 = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.55, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.55, roughness: 0.35 })
    );
    gateDG02.position.set(st.x, 0.92, -1.0);
    g.add(gateDG02);

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 2.55, st.z),
      new THREE.Vector3(st.x - 2.75, 1.75, st.z + 1.25)
    );
  }

  // Room 03: Fixation, Rolling & Oxidation Room — Front Bay (x=-12, z=+4.5)
  {
    const st = FACTORY_STATIONS[2];
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.35, 4.4), darkSlateMat);
    base.position.set(st.x, 0.175, st.z);
    g.add(base);

    for (const rx of [-2.0, 2.0]) {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 1.5), steelMat);
      stand.position.set(st.x + rx, 0.9, st.z - 0.75);
      g.add(stand);

      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 20), brassMat);
      drum.position.set(st.x + rx, 1.75, st.z - 0.75);
      g.add(drum);
      rollerDrums.push(drum);
    }

    const oxTable = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.7, 1.25), steelMat);
    oxTable.position.set(st.x, 0.7, st.z + 1.2);
    g.add(oxTable);

    const oxBedGeo = createOrganicLeafBedGeometry(5.8, 1.05, 0.1, 0.16, 28, 10, 44);
    rollingBedMesh = new THREE.Mesh(oxBedGeo, stageLeafMaterials.rolling_green);
    rollingBedMesh.position.set(st.x, 1.08, st.z + 1.2);
    g.add(rollingBedMesh);

    const clumpGeo = createLeafClusterGeometry(0.24, 55);
    for (let c = 0; c < 6; c++) {
      const clump = new THREE.Mesh(clumpGeo, stageLeafMaterials.rolling_green);
      clump.position.set(st.x - 2.1 + c * 0.84, 1.2, st.z + 1.2 + (c % 2 === 0 ? -0.14 : 0.14));
      g.add(clump);
      rollerClumps.push(clump);
    }

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 2.85, st.z),
      new THREE.Vector3(st.x - 2.0, 2.45, st.z - 0.75)
    );
  }

  // Room 04: Thermal Drying Room — ATEX Zone 22 — Top-Center-Right (x=0, z=-5.5)
  {
    const st = FACTORY_STATIONS[3];
    const g = new THREE.Group();
    const chamber = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.2, 2.4), darkSlateMat);
    chamber.position.set(st.x, 1.1, st.z);
    g.add(chamber);

    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 2.6, 16), steelMat);
    stack.position.set(st.x + 1.2, 3.3, st.z);
    g.add(stack);

    const chute = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.85), steelMat);
    chute.rotation.z = -0.32;
    chute.position.set(st.x + 2.75, 0.88, st.z);
    g.add(chute);

    const driedBedGeo = createOrganicLeafBedGeometry(1.05, 0.72, 0.08, 0.12, 14, 10, 66);
    const driedBed = new THREE.Mesh(driedBedGeo, stageLeafMaterials.dryer);
    driedBed.position.set(st.x + 2.85, 0.94, st.z);
    g.add(driedBed);

    for (let hx = -1.4; hx <= 1.4; hx += 0.7) {
      const coilMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 1.4,
        roughness: 0.3,
      });
      const coil = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.55, 2.46), coilMat);
      coil.position.set(st.x + hx, 1.05, st.z);
      g.add(coil);
      dryerHeaters.push(coil);
    }

    const dryerGlow = new THREE.PointLight(0xf97316, 2.2, 9);
    dryerGlow.position.set(st.x, 1.4, st.z + 1.8);
    g.add(dryerGlow);
    dryerHeaters.push(dryerGlow);

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 3.25, st.z),
      new THREE.Vector3(st.x - 1.8, 2.45, st.z + 1.1)
    );
  }

  // Room 05: Vibratory Grading & Optical Sorting — Top-Right-Center (x=8, z=-5.5)
  {
    const st = FACTORY_STATIONS[4];
    const g = new THREE.Group();

    const basePad = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.25, 4.4), darkSlateMat);
    basePad.position.set(st.x, 0.125, st.z);
    g.add(basePad);

    graderDeckGroup = new THREE.Group();
    graderDeckGroup.position.set(st.x - 1.35, 1.05, st.z);
    const deckFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.52, 1.35), steelMat);
    graderDeckGroup.add(deckFrame);
    const graderBed = new THREE.Mesh(
      createOrganicLeafBedGeometry(2.0, 1.15, 0.08, 0.09, 18, 10, 81),
      stageLeafMaterials.sorting
    );
    graderBed.position.y = 0.28;
    graderDeckGroup.add(graderBed);
    g.add(graderDeckGroup);

    const sorterHousing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.75, 1.4), brushedIronMat);
    sorterHousing.position.set(st.x + 1.05, 1.1, st.z);
    g.add(sorterHousing);

    const opticalBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.12, 1.46),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.5 })
    );
    opticalBar.position.set(st.x + 1.05, 1.65, st.z);
    g.add(opticalBar);

    const rejectBin = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.68, 1.15),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6, metalness: 0.3 })
    );
    rejectBin.position.set(st.x + 1.05, 0.56, st.z + 1.55);
    g.add(rejectBin);

    const rejectPile = new THREE.Mesh(
      createOrganicLeafBedGeometry(1.15, 0.95, 0.1, 0.16, 14, 12, 91),
      stageLeafMaterials.reject
    );
    rejectPile.position.set(st.x + 1.05, 0.88, st.z + 1.55);
    g.add(rejectPile);

    const rejGeo = createLeafClusterGeometry(0.14, 95);
    for (let r = 0; r < 4; r++) {
      const rej = new THREE.Mesh(rejGeo, stageLeafMaterials.reject);
      rej.position.set(st.x + 1.05, 1.25, st.z + 0.4 + r * 0.28);
      rej.userData.baseZ = st.z;
      rej.userData.phase = r * 0.25;
      g.add(rej);
      rejectDivertParticles.push(rej);
    }

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 2.95, st.z),
      new THREE.Vector3(st.x + 1.05, 2.35, st.z + 0.9)
    );
  }

  // Room 06: Cleanroom Weigh-Fill & Foil Packaging — Top-Far-Right (x=16, z=-5.5)
  {
    const st = FACTORY_STATIONS[5];
    const g = new THREE.Group();
    const rackBase = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.22, 4.4), darkSlateMat);
    rackBase.position.set(st.x, 0.11, st.z);
    g.add(rackBase);

    const packer = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.4), steelMat);
    packer.position.set(st.x - 1.8, 1.12, st.z);
    g.add(packer);

    const trayFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.14, 0.95),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.55, roughness: 0.15 })
    );
    trayFrame.position.set(st.x - 1.7, 0.3, st.z + 1.35);
    g.add(trayFrame);

    const sampleTea = new THREE.Mesh(
      createOrganicLeafBedGeometry(1.1, 0.8, 0.08, 0.08, 16, 12, 77),
      stageLeafMaterials.warehouse
    );
    sampleTea.position.set(st.x - 1.7, 0.36, st.z + 1.35);
    g.add(sampleTea);

    const pouchGeo = createStandUpPouchGeometry();
    const kraftMat = new THREE.MeshStandardMaterial({ color: 0xc8a97e, roughness: 0.82 });
    const foilBandMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.36, metalness: 0.25 });
    const windowMat = new THREE.MeshStandardMaterial({
      map: stageLeafMaterials.warehouse.map,
      roughness: 0.22,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92,
    });
    for (let idx = 0; idx < 18; idx++) {
      const col = idx % 3;
      const row = Math.floor(idx / 3) % 2;
      const tier = Math.floor(idx / 6);

      const pouchGroup = new THREE.Group();
      pouchGroup.add(new THREE.Mesh(pouchGeo, kraftMat));
      const labelBand = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.19), foilBandMat);
      labelBand.position.y = 0.08;
      pouchGroup.add(labelBand);
      const viewWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.16), windowMat);
      viewWindow.position.set(0, -0.1, 0.098);
      pouchGroup.add(viewWindow);

      pouchGroup.position.set(st.x + 0.1 + col * 0.78, 0.54 + tier * 0.68, st.z - 0.55 + row * 0.82);
      pouchGroup.userData.index = idx;
      g.add(pouchGroup);
      warehouseBoxes.push(pouchGroup);
    }

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 2.95, st.z),
      new THREE.Vector3(st.x - 1.8, 2.25, st.z + 0.7)
    );
  }

  // Moving Conveyor Batches across the L-Shaped Two-Tier Floorplan:
  const clusterGeoGreen = createLeafClusterGeometry(0.28, 97);
  const clusterGeoMain = createLeafClusterGeometry(0.32, 99);
  const bladeGeoConv = createCurvedLeafBladeGeometry(0.3, 0.14);
  const bladeMatConv = new THREE.MeshStandardMaterial({
    map: createSingleLeafBladeTexture(),
    alphaTest: 0.35,
    side: THREE.DoubleSide,
    roughness: 0.72,
  });

  function makeGreenLeafBatchGroup() {
    const batch = new THREE.Group();
    batch.add(new THREE.Mesh(clusterGeoGreen, stageLeafMaterials.intake));
    for (let b = 0; b < 5; b++) {
      const blade = new THREE.Mesh(bladeGeoConv, bladeMatConv);
      const angle = (b / 5) * Math.PI * 2;
      blade.position.set(Math.cos(angle) * 0.14, 0.1, Math.sin(angle) * 0.14);
      blade.rotation.set(0.4, angle, 0.2);
      batch.add(blade);
    }
    return batch;
  }

  // Path 1 (01->02 East at z=-5.5)
  for (let i = 0; i < 4; i++) {
    const b = makeGreenLeafBatchGroup();
    b.position.set(-16 + i * 2.0, 0.76, -5.5);
    b.userData.phase = i / 4;
    scene.add(b);
    path1Batches.push(b);
  }

  // Path 2 (01->03 South along x=-16) — Green Tea Direct
  for (let i = 0; i < 5; i++) {
    const b = makeGreenLeafBatchGroup();
    b.position.set(-16, 0.76, -5.5 + i * 2.0);
    b.userData.phase = i / 5;
    scene.add(b);
    bypassBatches.push(b);
  }

  // Path 3 (02->03 South along x=-8) — Golden Tea Handover (XOR with Path 2)
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(clusterGeoMain, stageLeafMaterials.withering);
    b.position.set(-8, 0.76, -5.5 + i * 2.0);
    b.castShadow = true;
    b.visible = false;
    b.userData.phase = i / 5;
    scene.add(b);
    goldenBatches.push(b);
  }

  // Discharge (03->04 North-East from (-6, +3.5) to (0, -5.5))
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(clusterGeoMain, stageLeafMaterials.rolling_green);
    b.position.set(-3, 0.76, -1);
    b.castShadow = true;
    b.userData.phase = i / 5;
    scene.add(b);
    discharge34Batches.push(b);
  }

  // Upper Process Belt (04->05->06 East along z=-5.5)
  for (let i = 0; i < 8; i++) {
    const b = new THREE.Mesh(clusterGeoMain, stageLeafMaterials.dryer);
    b.position.set(i * 2.0, 0.76, -5.5);
    b.castShadow = true;
    b.userData.phase = i / 8;
    scene.add(b);
    upperEastBatches.push(b);
  }

  // Single High-Contrast Dark Pill Per Room
  const labelEls = new Map();
  FACTORY_STATIONS.forEach((st) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'station-3d-label';
    el.innerHTML = `<span class="label-name">${st.pillTitle}</span><span class="label-metric" data-station="${st.id}">Ready</span>`;
    el.addEventListener('click', () => {
      focusStation(st.id);
      if (onStationSelect) onStationSelect(st.id);
    });
    labelsContainer.appendChild(el);
    labelEls.set(st.id, el);
  });

  // Toggleable ISA-5.1 Instrument Callout Badges (Hidden in Overview, shown only when zoomed into a room)
  const ISA_TAGS = [
    { id: 'SC-01', stationId: 'intake' },
    { id: 'FN-01', stationId: 'withering' },
    { id: 'RL-01', stationId: 'rolling' },
    { id: 'TT-401', stationId: 'dryer' },
    { id: 'OS-01', stationId: 'sorting' },
    { id: 'PK-01', stationId: 'warehouse' },
  ];
  const tagEls = new Map();
  let showIsaTags = true;
  let focusedStationId = 'overview';

  ISA_TAGS.forEach((tag) => {
    const el = document.createElement('div');
    el.className = 'isa-tag-badge';
    el.innerHTML = `<span class="isa-tag-id">${tag.id}</span><span class="isa-tag-val" data-tag="${tag.id}">—</span>`;
    labelsContainer.appendChild(el);
    tagEls.set(tag.id, { el, stationId: tag.stationId });
  });

  function setIsaTagsVisible(visible) {
    showIsaTags = Boolean(visible);
    tagEls.forEach(({ el }) => {
      el.style.display = showIsaTags ? 'inline-flex' : 'none';
    });
  }

  // Camera Tween State
  let tweenState = null;

  function startTween(destPos, destTarget) {
    tweenState = {
      startPos: camera.position.clone(),
      startTarget: controls.target.clone(),
      endPos: destPos.clone(),
      endTarget: destTarget.clone(),
      startTime: performance.now(),
      durationMs: 750,
    };
  }

  function focusStation(stationId) {
    focusedStationId = stationId || 'overview';
    if (stationId === 'overview') {
      startTween(OVERVIEW_CAMERA.pos, OVERVIEW_CAMERA.target);
      return;
    }
    const st = FACTORY_STATIONS.find((s) => s.id === stationId);
    if (!st) return;
    startTween(
      new THREE.Vector3(st.cameraOffset.x, st.cameraOffset.y, st.cameraOffset.z),
      new THREE.Vector3(st.lookAtOffset.x, st.lookAtOffset.y, st.lookAtOffset.z)
    );
  }

  // Raycasting for 3D clicks
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDownPos = { x: 0, y: 0 };

  renderer.domElement.addEventListener('pointerdown', (e) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
  });

  renderer.domElement.addEventListener('pointerup', (e) => {
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    if (Math.hypot(dx, dy) > 6) return;

    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(clickableTargets, false);
    if (hits.length > 0) {
      const stId = hits[0].object.userData.stationId;
      if (stId) {
        focusStation(stId);
        if (onStationSelect) onStationSelect(stId);
      }
    }
  });

  // Simulation animation state
  const simState = {
    playing: true,
    speed: 1.0,
    throughputScale: 1.0,
    operatingMode: 'normal',
    goldenHandoverActive: false, // XOR interlock: TRUE = Path 3 (02->03) ONLY; FALSE = Path 2 (01->03)
    witheringBufferKg: 145.0,
    rejectSpikeActive: false,
    rejectRatePct: 3.2,
    dryerUtilPct: 41.4,
    dryerTempSpDegC: 95.0,
    witheringFanSpeedPct: 75.0,
    rollingSpeedScale: 1.0,
    intakeSpeedScale: 1.0,
    plcSafe: true,
    bufferMode: true,
    stationAlarms: {
      intake: false,
      withering: false,
      rolling: false,
      dryer: false,
      sorting: false,
      warehouse: false,
    },
    stationStandby: {
      intake: false,
      withering: false,
      rolling: false,
      dryer: false,
      sorting: false,
      warehouse: false,
    },
    labelMetrics: {},
    isaTagValues: {},
  };

  function updateSimulationState(next) {
    Object.assign(simState, next);
    if (next.stationAlarms) {
      simState.stationAlarms = { ...simState.stationAlarms, ...next.stationAlarms };
    }
    if (next.stationStandby) {
      simState.stationStandby = { ...simState.stationStandby, ...next.stationStandby };
    }

    // Update Room 03 Rolling material based on Golden Tea vs Green Tea active line
    const rollMat = simState.goldenHandoverActive
      ? stageLeafMaterials.rolling
      : stageLeafMaterials.rolling_green;
    if (rollingBedMesh && rollingBedMesh.material !== rollMat) {
      rollingBedMesh.material = rollMat;
      rollerClumps.forEach((c) => {
        c.material = rollMat;
      });
    }

    // Update Diverter DV-01A / DV-01B and Room 02 Gate DG-02
    if (diverterArmA && diverterArmB) {
      diverterArmA.rotation.y = simState.goldenHandoverActive ? 0.55 : -0.35;
      diverterArmB.rotation.y = simState.goldenHandoverActive ? 1.55 : 0.0;
    }
    if (gateDG02) {
      gateDG02.position.y = simState.goldenHandoverActive ? 1.45 : 0.92;
    }

    for (const [id, text] of Object.entries(simState.labelMetrics)) {
      const el = labelEls.get(id)?.querySelector('.label-metric');
      if (el) el.textContent = text;
    }
    for (const [tagId, valText] of Object.entries(simState.isaTagValues || {})) {
      const entry = tagEls.get(tagId);
      if (entry) {
        const valEl = entry.el.querySelector('.isa-tag-val');
        if (valEl) valEl.textContent = valText;
        const isAlarm = Boolean(simState.stationAlarms[entry.stationId]);
        const isStandby = Boolean(simState.stationStandby[entry.stationId]);
        entry.el.classList.toggle('isa-tag-badge--alarm', isAlarm);
        entry.el.classList.toggle('isa-tag-badge--standby', !isAlarm && isStandby);
      }
    }
    const visibleBoxes = simState.bufferMode ? 18 : 11;
    warehouseBoxes.forEach((box) => {
      box.visible = box.userData.index < visibleBoxes;
    });
  }

  function handleResize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', handleResize);

  let simTime = 0;
  let lastFrame = performance.now();
  let rafId = 0;
  const projVec = new THREE.Vector3();

  function animate(now) {
    rafId = requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    const isWinter = simState.operatingMode === 'winter';

    if (simState.playing) {
      simTime += dt * simState.speed * simState.throughputScale;

      const intakeFactor = simState.stationAlarms.intake || isWinter ? 0.0 : simState.intakeSpeedScale;
      intakeCrates.forEach((crate) => {
        if (intakeFactor > 0) {
          const cycle = (simTime * 0.35 * intakeFactor + crate.userData.phase) % 1;
          crate.position.x = crate.userData.baseX + cycle * 4.4;
        }
        crate.visible = !isWinter;
      });

      const fanFactor =
        simState.stationAlarms.withering || isWinter
          ? 0.0
          : simState.witheringFanSpeedPct / 75.0;
      witheringFans.forEach((fan, idx) => {
        fan.rotation.x +=
          dt * 8.5 * simState.speed * simState.throughputScale * fanFactor * (idx % 2 === 0 ? 1 : -1);
      });

      const rollFactor = simState.stationAlarms.rolling || isWinter ? 0.0 : simState.rollingSpeedScale;
      rollerDrums.forEach((drum, idx) => {
        drum.rotation.y +=
          dt * 2.8 * simState.speed * simState.throughputScale * rollFactor * (idx === 0 ? 1 : -1);
      });

      const dryerSafe = simState.plcSafe && !simState.stationAlarms.dryer && !isWinter;
      const tempFactor = Math.max(0.3, simState.dryerTempSpDegC / 95.0);
      const utilFactor = Math.max(0.25, simState.dryerUtilPct / 50) * tempFactor;
      const pulse = 0.8 + 0.4 * Math.sin(simTime * 4.0);
      dryerHeaters.forEach((item) => {
        if (item.isPointLight) {
          item.intensity = dryerSafe ? 2.1 * utilFactor * pulse : 0.15;
        } else if (item.material) {
          item.material.emissiveIntensity = dryerSafe ? 1.15 * utilFactor * pulse : 0.08;
        }
      });

      // Live Room 02 Golden Buffer accumulation (0->250 kg) & XOR discharge (250->0 kg)
      if (!isWinter && !simState.stationAlarms.intake && !simState.stationAlarms.withering) {
        if (!simState.goldenHandoverActive) {
          simState.witheringBufferKg += dt * 10.5 * simState.speed;
          if (simState.witheringBufferKg >= 250.0) {
            simState.witheringBufferKg = 250.0;
            simState.goldenHandoverActive = true;
          }
        } else {
          simState.witheringBufferKg -= dt * 28.0 * simState.speed;
          if (simState.witheringBufferKg <= 0.0) {
            simState.witheringBufferKg = 0.0;
            simState.goldenHandoverActive = false;
          }
        }
        if (onBufferTick) {
          onBufferTick(simState.witheringBufferKg, simState.goldenHandoverActive);
        }
      }

      // Path 1 (01 -> 02 East at z=-5.5)
      const path1Active = !isWinter && simState.plcSafe && !simState.stationAlarms.intake;
      path1Batches.forEach((b) => {
        b.visible = !isWinter;
        if (path1Active) {
          const cycle = (simTime * 0.16 + b.userData.phase) % 1;
          b.position.x = -16 + cycle * 8.0;
        }
      });

      // Path 2 (01 -> 03 South at x=-16) — STRICTLY PAUSED when goldenHandoverActive === true
      const path2Active = !isWinter && !simState.goldenHandoverActive && simState.plcSafe && !simState.stationAlarms.intake;
      bypassBatches.forEach((b) => {
        b.visible = !isWinter && !simState.goldenHandoverActive;
        if (path2Active) {
          const cycle = (simTime * 0.16 + b.userData.phase) % 1;
          b.position.z = -5.5 + cycle * 9.0;
        }
      });

      // Path 3 (02 -> 03 South at x=-8) — ACTIVE ONLY when goldenHandoverActive === true
      const path3Active = !isWinter && simState.goldenHandoverActive && simState.plcSafe && !simState.stationAlarms.withering;
      goldenBatches.forEach((b) => {
        b.visible = !isWinter && simState.goldenHandoverActive;
        if (path3Active) {
          const cycle = (simTime * 0.18 + b.userData.phase) % 1;
          b.position.z = -5.5 + cycle * 9.0;
        }
      });

      // Discharge (03 -> 04 North-East from (-6, +3.5) to (0, -5.5))
      const convActive = !isWinter && simState.plcSafe && !simState.stationAlarms.intake;
      discharge34Batches.forEach((b) => {
        b.visible = !isWinter;
        const targetMat = simState.goldenHandoverActive
          ? stageLeafMaterials.rolling
          : stageLeafMaterials.rolling_green;
        if (b.material !== targetMat) b.material = targetMat;
        if (convActive) {
          const cycle = (simTime * 0.15 + b.userData.phase) % 1;
          b.position.x = -6.0 + cycle * 6.0;
          b.position.z = 3.5 - cycle * 9.0;
        }
      });

      // Upper Process Belt (04 -> 05 -> 06 East at z=-5.5)
      upperEastBatches.forEach((b) => {
        b.visible = !isWinter;
        if (convActive) {
          const cycle = (simTime * 0.09 + b.userData.phase) % 1;
          b.position.x = cycle * 16.0;
        }
        const stageMat = b.position.x < 8 ? stageLeafMaterials.dryer : stageLeafMaterials.sorting;
        if (b.material !== stageMat) b.material = stageMat;
      });

      // Room 05 Vibratory Grader (GR-01) oscillation + Reject Diversion into RJ-01
      if (graderDeckGroup && !isWinter) {
        graderDeckGroup.position.x = 8 - 1.35 + Math.sin(now * 0.045) * 0.035;
      }
      const rejectRateFactor = simState.rejectSpikeActive ? 1.9 : 1.0;
      rejectDivertParticles.forEach((rej) => {
        rej.visible = !isWinter;
        if (!isWinter) {
          const cycle = (simTime * 0.65 * rejectRateFactor + rej.userData.phase) % 1;
          rej.position.z = (rej.userData.baseZ ?? -5.5) + 0.25 + cycle * 1.3;
          rej.position.y = 1.32 - cycle * cycle * 0.42;
        }
      });

      warehouseBoxes.forEach((box) => {
        if (box.visible && box.userData.index >= 12) {
          box.position.y =
            0.54 +
            Math.floor(box.userData.index / 6) * 0.66 +
            Math.sin(simTime * 2 + box.userData.index) * 0.012;
        }
      });
    }

    const strobe = 0.85 + 0.9 * Math.abs(Math.sin(now * 0.01));
    stationBeacons.forEach(({ group, mat }, id) => {
      const isAlarm = Boolean(simState.stationAlarms[id]) || (id === 'dryer' && !simState.plcSafe);
      const isAmberWarning = id === 'sorting' && simState.rejectSpikeActive;
      const isStandby = Boolean(simState.stationStandby[id]) || !simState.playing;

      if (isAmberWarning) {
        group.rotation.y += dt * 6.0;
        mat.color.setHex(0xf59e0b);
        mat.emissive.setHex(0xd97706);
        mat.emissiveIntensity = strobe * 2.0;
      } else if (isAlarm) {
        group.rotation.y += dt * 7.5;
        mat.color.setHex(0xef4444);
        mat.emissive.setHex(0xdc2626);
        mat.emissiveIntensity = strobe * 2.1;
      } else if (isStandby) {
        group.rotation.y += dt * 1.4;
        mat.color.setHex(0xf59e0b);
        mat.emissive.setHex(0xd97706);
        mat.emissiveIntensity = 1.15;
      } else {
        group.rotation.y += dt * 2.4;
        mat.color.setHex(0x22c55e);
        mat.emissive.setHex(0x16a34a);
        mat.emissiveIntensity = 1.25;
      }
    });

    hotspotRings.forEach((ring, idx) => {
      const s = 1 + 0.06 * Math.sin(now * 0.004 + idx);
      ring.scale.set(s, s, 1);
    });

    if (tweenState) {
      const u = Math.min(1, (now - tweenState.startTime) / tweenState.durationMs);
      const k = easeInOutCubic(u);
      camera.position.lerpVectors(tweenState.startPos, tweenState.endPos, k);
      controls.target.lerpVectors(tweenState.startTarget, tweenState.endTarget, k);
      if (u >= 1) tweenState = null;
    }

    controls.update();
    renderer.render(scene, camera);

    const cw = container.clientWidth || window.innerWidth;
    const ch = container.clientHeight || window.innerHeight;

    labelAnchors.forEach((worldPos, id) => {
      const el = labelEls.get(id);
      if (!el) return;
      projVec.copy(worldPos).project(camera);
      if (projVec.z > 1) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        return;
      }
      const x = (projVec.x * 0.5 + 0.5) * cw;
      const y = (-projVec.y * 0.5 + 0.5) * ch;
      el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
    });

      // Visual Flow Highlighting on Path 2 (01->03) vs Path 3 (02->03)
      if (!isWinter && simState.goldenHandoverActive) {
        bypassBeltMat.color.setHex(0x94a3b8);
        bypassBeltMat.emissive.setHex(0x000000);
        bypassBeltMat.emissiveIntensity = 0.0;
        bypassBeltMat.opacity = 0.35;

        goldenBeltMat.color.setHex(0xf59e0b);
        goldenBeltMat.emissive.setHex(0xd97706);
        goldenBeltMat.emissiveIntensity = 0.65;
        goldenBeltMat.opacity = 0.95;
      } else if (!isWinter) {
        bypassBeltMat.color.setHex(0x10b981);
        bypassBeltMat.emissive.setHex(0x059669);
        bypassBeltMat.emissiveIntensity = 0.55;
        bypassBeltMat.opacity = 0.95;

        goldenBeltMat.color.setHex(0x94a3b8);
        goldenBeltMat.emissive.setHex(0x000000);
        goldenBeltMat.emissiveIntensity = 0.0;
        goldenBeltMat.opacity = 0.35;
      } else {
        bypassBeltMat.color.setHex(0x94a3b8);
        bypassBeltMat.emissiveIntensity = 0.0;
        bypassBeltMat.opacity = 0.35;
        goldenBeltMat.color.setHex(0x94a3b8);
        goldenBeltMat.emissiveIntensity = 0.0;
        goldenBeltMat.opacity = 0.35;
      }

      // Live Room 02 Pill Counter & Room 03 Active Source Pill Border
      const r2Pill = labelEls.get('withering');
      if (r2Pill) {
        const kgStr = Math.round(simState.witheringBufferKg);
        const metricEl = r2Pill.querySelector('.label-metric');
        if (metricEl && !simState.stationAlarms.withering && !isWinter) {
          metricEl.textContent = simState.goldenHandoverActive
            ? `${kgStr} / 250 kg · FEEDING R03 · 01→03 PAUSED`
            : `${kgStr} / 250 kg`;
        }
        r2Pill.classList.toggle('station-3d-label--emerald', !simState.goldenHandoverActive && !simState.stationAlarms.withering);
        r2Pill.classList.toggle('station-3d-label--gold', simState.goldenHandoverActive && !simState.stationAlarms.withering);
        r2Pill.classList.toggle('station-3d-label--alarm', Boolean(simState.stationAlarms.withering));
      }
      const r3Pill = labelEls.get('rolling');
      if (r3Pill) {
        r3Pill.classList.toggle('station-3d-label--emerald', !simState.goldenHandoverActive && !isWinter);
        r3Pill.classList.toggle('station-3d-label--gold', simState.goldenHandoverActive && !isWinter);
      }

      // Hide ISA-5.1 sensor tags in Overview (0); show only when zoomed into that specific room (1-6)
      tagEls.forEach(({ el, stationId }) => {
        const anchor = tagAnchors.get(stationId);
        const visibleInRoom = showIsaTags && focusedStationId === stationId;
        if (!anchor || !visibleInRoom) {
          el.style.opacity = '0';
          return;
        }
        projVec.copy(anchor).project(camera);
        if (projVec.z > 1) {
          el.style.opacity = '0';
          return;
        }
        const x = (projVec.x * 0.5 + 0.5) * cw;
        const y = (-projVec.y * 0.5 + 0.5) * ch;
        el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        el.style.opacity = '1';
      });
  }

  function setTheme(mode = 'light') {
    const isDark = mode === 'dark';
    if (isDark) {
      scene.background.setHex(0x0b1120);
      scene.fog.color.setHex(0x0b1120);
      scene.fog.density = 0.01;
      hemi.color.setHex(0xe2e8f0);
      hemi.groundColor.setHex(0x1e293b);
      hemi.intensity = 0.9;
      dirLight.color.setHex(0xf8fafc);
      dirLight.intensity = 1.3;
      floorMat.color.setHex(0x1e293b);
      walkwayMat.color.setHex(0x334155);
      spineBeltMat.color.setHex(0x475569);
      pillarMat.color.setHex(0x334155);
      wallBackMat.color.setHex(0x172030);
      wallPartitionMat.color.setHex(0x233044);
      wallFrameMat.color.setHex(0x475569);
      gridLight.visible = false;
      gridDark.visible = true;
    } else {
      scene.background.setHex(0xe9eef5);
      scene.fog.color.setHex(0xe9eef5);
      scene.fog.density = 0.0075;
      hemi.color.setHex(0xf8fafc);
      hemi.groundColor.setHex(0xcbd5e1);
      hemi.intensity = 1.25;
      dirLight.color.setHex(0xffffff);
      dirLight.intensity = 1.55;
      floorMat.color.setHex(0xcbd5e1);
      walkwayMat.color.setHex(0x94a3b8);
      spineBeltMat.color.setHex(0x64748b);
      pillarMat.color.setHex(0x94a3b8);
      wallBackMat.color.setHex(0xdbe3ee);
      wallPartitionMat.color.setHex(0xe2e8f0);
      wallFrameMat.color.setHex(0x64748b);
      gridLight.visible = true;
      gridDark.visible = false;
    }
  }

  setTheme(initialTheme);

  rafId = requestAnimationFrame(animate);

  return {
    focusStation,
    updateSimulationState,
    setIsaTagsVisible,
    setTheme,
    dispose() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    },
  };
}
