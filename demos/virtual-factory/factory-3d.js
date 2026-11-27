import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const FACTORY_STATIONS = [
  {
    id: 'intake',
    order: 1,
    shortcut: '1',
    roomCode: 'ROOM 01',
    zoneLabel: 'ROOM 01 · RECEPTION & DIVERTER (SC-01, DV-01A/B)',
    name: '1. Raw Leaf Reception & Diverter',
    shortName: 'Room 01: Intake',
    x: -20,
    z: 0,
    cameraOffset: { x: -20, y: 3.6, z: 7.6 },
    lookAtOffset: { x: -20, y: 1.15, z: -0.3 },
  },
  {
    id: 'withering',
    order: 2,
    shortcut: '2',
    roomCode: 'ROOM 02',
    zoneLabel: 'ROOM 02 · WITHERING HALL · GOLDEN BUFFER (T-01..04)',
    name: '2. Climate-Controlled Withering Hall',
    shortName: 'Room 02: Withering',
    x: -12,
    z: 0,
    cameraOffset: { x: -12, y: 3.6, z: 7.6 },
    lookAtOffset: { x: -12, y: 1.15, z: -0.2 },
  },
  {
    id: 'rolling',
    order: 3,
    shortcut: '3',
    roomCode: 'ROOM 03',
    zoneLabel: 'ROOM 03 · FIXATION, ROLLING & OXIDATION (RL-01..02)',
    name: '3. Fixation, Rolling & Oxidation Room',
    shortName: 'Room 03: Rolling',
    x: -4,
    z: 0,
    cameraOffset: { x: -4, y: 3.6, z: 7.6 },
    lookAtOffset: { x: -4, y: 1.15, z: -0.2 },
  },
  {
    id: 'dryer',
    order: 4,
    shortcut: '4',
    roomCode: 'ROOM 04',
    zoneLabel: 'ROOM 04 · THERMAL DRYING · ATEX ZONE 22 (DR-01)',
    name: '4. Thermal Drying Room (ATEX Zone 22)',
    shortName: 'Room 04: Dryer',
    x: 4,
    z: 0,
    cameraOffset: { x: 4, y: 3.7, z: 7.6 },
    lookAtOffset: { x: 4, y: 1.25, z: -0.2 },
  },
  {
    id: 'sorting',
    order: 5,
    shortcut: '5',
    roomCode: 'ROOM 05',
    zoneLabel: 'ROOM 05 · GRADING & OPTICAL SORTING (GR-01, OS-01, RJ-01)',
    name: '5. Vibratory Grading & Optical Sorting',
    shortName: 'Room 05: Sorting',
    x: 12,
    z: 0,
    cameraOffset: { x: 12, y: 3.6, z: 7.6 },
    lookAtOffset: { x: 12, y: 1.15, z: 0.0 },
  },
  {
    id: 'warehouse',
    order: 6,
    shortcut: '6',
    roomCode: 'ROOM 06',
    zoneLabel: 'ROOM 06 · CLEANROOM WEIGH-FILL & PACKAGING (PK-01)',
    name: '6. Cleanroom Weigh-Fill & Foil Packaging',
    shortName: 'Room 06: Packaging',
    x: 20,
    z: 0,
    cameraOffset: { x: 20, y: 3.6, z: 7.8 },
    lookAtOffset: { x: 20, y: 1.2, z: -0.2 },
  },
];

// Elevated front-left corner bird's-eye view framing all 6 rooms diagonally
const OVERVIEW_CAMERA = {
  pos: new THREE.Vector3(-28, 17.5, 25),
  target: new THREE.Vector3(0, 1.0, -0.5),
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
    for (let i = 0; i < 110; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const len = size * (0.024 + rand() * 0.022) * mult;
      const ang = rand() * Math.PI * 2;
      drawSerratedLeaf(dCtx, x, y, len, len * 0.25, ang, '#c89d54', '#e0b872', false);
      drawSerratedLeaf(bCtx, x, y, len, len * 0.25, ang, '#e8e8e8', null, false);
    }
  }

  return { diffCanvas, bumpCanvas };
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

export function createFactory3D({ container, labelsContainer, onStationSelect, initialTheme = 'light' }) {
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

  // 6-Room Floor (64m x 28m), grids, walkway & dual conveyor spines
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.85, metalness: 0.08 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(64, 28), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const gridLight = new THREE.GridHelper(64, 64, 0x94a3b8, 0xb8c4d4);
  gridLight.position.y = 0.008;
  scene.add(gridLight);

  const gridDark = new THREE.GridHelper(64, 64, 0x334155, 0x243042);
  gridDark.position.y = 0.008;
  gridDark.visible = false;
  scene.add(gridDark);

  const walkwayMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.78 });
  const walkway = new THREE.Mesh(new THREE.BoxGeometry(48, 0.03, 1.6), walkwayMat);
  walkway.position.set(0, 0.015, 5.2);
  walkway.receiveShadow = true;
  scene.add(walkway);

  // Main Process Conveyor Spine (z = 0) across all 6 rooms
  const spineBeltMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5, roughness: 0.45 });
  const spineBelt = new THREE.Mesh(new THREE.BoxGeometry(44, 0.22, 0.72), spineBeltMat);
  spineBelt.position.set(0, 0.55, 0);
  spineBelt.castShadow = true;
  spineBelt.receiveShadow = true;
  scene.add(spineBelt);

  // Path 2: Green Tea Direct Bypass Conveyor (Room 01 -> Room 03 at z = -2.35, bypassing Room 02)
  const bypassBeltMat = new THREE.MeshStandardMaterial({ color: 0x15803d, metalness: 0.4, roughness: 0.5 });
  const bypassBelt = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.18, 0.56), bypassBeltMat);
  bypassBelt.position.set(-12, 0.72, -2.35);
  bypassBelt.castShadow = true;
  bypassBelt.receiveShadow = true;
  scene.add(bypassBelt);

  // Architectural 6-Room Cutaway Partition System
  const wallBackMat = new THREE.MeshStandardMaterial({ color: 0xdbe3ee, roughness: 0.88 });
  const wallPartitionMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.82 });
  const wallFrameMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.55, roughness: 0.4 });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.55, roughness: 0.42 });

  // Full-height back wall (z = -5.5, width 48.4m)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(48.4, 4.2, 0.24), wallBackMat);
  backWall.position.set(0, 2.1, -5.5);
  backWall.receiveShadow = true;
  backWall.castShadow = true;
  scene.add(backWall);

  // Low front cutaway curb walls (z = +4.2) with room entry gaps
  for (const st of FACTORY_STATIONS) {
    const leftCurb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.36, 0.2), wallPartitionMat);
    leftCurb.position.set(st.x - 2.65, 0.18, 4.2);
    leftCurb.castShadow = true;
    leftCurb.receiveShadow = true;
    scene.add(leftCurb);

    const rightCurb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.36, 0.2), wallPartitionMat);
    rightCurb.position.set(st.x + 2.65, 0.18, 4.2);
    rightCurb.castShadow = true;
    rightCurb.receiveShadow = true;
    scene.add(rightCurb);
  }

  // Side & inter-room cutaway partition walls at x = -24, -16, -8, 0, +8, +16, +24
  const partitionXs = [-24, -16, -8, 0, 8, 16, 24];
  partitionXs.forEach((px, idx) => {
    const isOuter = idx === 0 || idx === partitionXs.length - 1;
    const wallHeight = isOuter ? 2.4 : 2.1;

    const backCol = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.2, 0.32), pillarMat);
    backCol.position.set(px, 2.1, -5.5);
    backCol.castShadow = true;
    scene.add(backCol);

    const frontCol = new THREE.Mesh(new THREE.BoxGeometry(0.28, wallHeight, 0.28), pillarMat);
    frontCol.position.set(px, wallHeight / 2, 4.2);
    frontCol.castShadow = true;
    scene.add(frontCol);

    if (isOuter) {
      const solidSide = new THREE.Mesh(new THREE.BoxGeometry(0.18, wallHeight, 9.7), wallPartitionMat);
      solidSide.position.set(px, wallHeight / 2, -0.65);
      solidSide.castShadow = true;
      solidSide.receiveShadow = true;
      scene.add(solidSide);
    } else {
      // Back section (z = -5.5 to -0.85)
      const backSeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, wallHeight, 4.65), wallPartitionMat);
      backSeg.position.set(px, wallHeight / 2, -3.175);
      backSeg.castShadow = true;
      backSeg.receiveShadow = true;
      scene.add(backSeg);

      // Front section (z = +0.85 to +4.2)
      const frontSeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, wallHeight, 3.35), wallPartitionMat);
      frontSeg.position.set(px, wallHeight / 2, 2.525);
      frontSeg.castShadow = true;
      frontSeg.receiveShadow = true;
      scene.add(frontSeg);

      // Header lintel above main conveyor pass-through
      const lintelH = wallHeight - 1.45;
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.22, lintelH, 1.7), wallFrameMat);
      lintel.position.set(px, 1.45 + lintelH / 2, 0);
      lintel.castShadow = true;
      scene.add(lintel);
    }
  });

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
  const bypassBatches = [];
  const mainConveyorBatches = [];
  const dryerHeaters = [];
  const rejectDivertParticles = [];
  const warehouseBoxes = [];
  const stationBeacons = new Map();
  const labelAnchors = new Map();
  const tagAnchors = new Map();
  let diverterArmA = null;
  let diverterArmB = null;
  let rollingBedMesh = null;
  let rollerClumps = [];
  let graderDeckGroup = null;

  // Room Overhead Back-Wall Plaques & Front Floor Plaques
  FACTORY_STATIONS.forEach((st) => {
    const isDryer = st.id === 'dryer';
    const isSorting = st.id === 'sorting';
    const border = isDryer ? '#eab308' : isSorting ? '#0284c7' : '#0f766e';
    const textCol = isDryer ? '#fde047' : '#f8fafc';

    const wallPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 0.95),
      new THREE.MeshBasicMaterial({
        map: createPlaqueTexture(st.zoneLabel, border, textCol),
        transparent: true,
      })
    );
    wallPlaque.position.set(st.x, 3.35, -5.36);
    scene.add(wallPlaque);

    const floorPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 0.88),
      new THREE.MeshBasicMaterial({
        map: createPlaqueTexture(`${st.roomCode}: ${st.shortName.replace(/^Room \d+:\s*/, '').toUpperCase()}`, border, textCol),
        transparent: true,
      })
    );
    floorPlaque.rotation.x = -Math.PI / 2;
    floorPlaque.position.set(st.x, 0.025, 3.55);
    scene.add(floorPlaque);
  });

  // Safety-Yellow ATEX Zone 22 Floor Perimeter around Dryer DR-01 in Room 04 (x = 4)
  {
    const atexMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const dx = 4;
    const w = 6.2;
    const d = 4.2;
    const t = 0.14;
    const borders = [
      { x: dx, z: -d / 2, sx: w, sz: t },
      { x: dx, z: d / 2, sx: w, sz: t },
      { x: dx - w / 2, z: 0, sx: t, sz: d },
      { x: dx + w / 2, z: 0, sx: t, sz: d },
    ];
    borders.forEach((b) => {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(b.sx, b.sz), atexMat);
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(b.x, 0.025, b.z);
      scene.add(strip);
    });

    const atexSign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 0.62),
      new THREE.MeshBasicMaterial({
        map: createPlaqueTexture('ATEX ZONE 22 · DR-01', '#eab308', '#fde047'),
        transparent: true,
      })
    );
    atexSign.rotation.x = -Math.PI / 2;
    atexSign.position.set(dx, 0.028, -2.55);
    scene.add(atexSign);
  }

  function makeHotspot(station) {
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
    ring.position.set(station.x, 0.04, 5.2);
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
    disc.position.set(station.x, 0.035, 5.2);
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
      pole.position.set(st.x + 2.3, 0.78, 1.85);
      group.add(pole);

      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(st.x + 2.3, 1.62, 1.85);

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

  // Room 01: Raw Leaf Reception & Diverter (SC-01, DV-01A/B)
  {
    const st = FACTORY_STATIONS[0];
    const g = new THREE.Group();
    const dockPad = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.38, 4.2), darkSlateMat);
    dockPad.position.set(st.x, 0.19, 0);
    g.add(dockPad);

    const hopper = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.55, 1.5, 6), steelMat);
    hopper.position.set(st.x + 1.15, 1.55, 0);
    g.add(hopper);

    const scalePost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.9, 0.18), brushedIronMat);
    scalePost.position.set(st.x - 1.9, 1.15, 1.4);
    g.add(scalePost);

    // Pneumatic Diverter Gates DV-01A (Main -> Room 02) and DV-01B (Bypass -> Room 03)
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
    diverterArmA = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.85), gateMat);
    diverterArmA.position.set(st.x + 2.45, 0.95, 0);
    g.add(diverterArmA);

    diverterArmB = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.85), gateMat);
    diverterArmB.position.set(st.x + 2.45, 0.95, -2.35);
    g.add(diverterArmB);

    const wovenMat = new THREE.MeshStandardMaterial({ color: 0xb08952, roughness: 0.88, metalness: 0.04 });
    const basketGeo = new THREE.CylinderGeometry(0.46, 0.34, 0.48, 14);
    const heapGeo = createLeafClusterGeometry(0.4, 21);

    for (let i = 0; i < 4; i++) {
      const basketGroup = new THREE.Group();
      basketGroup.add(new THREE.Mesh(basketGeo, wovenMat));
      const leafHeap = new THREE.Mesh(heapGeo, stageLeafMaterials.intake);
      leafHeap.position.y = 0.24;
      basketGroup.add(leafHeap);

      basketGroup.position.set(st.x - 2.2 + i * 1.15, 0.92, 0);
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
      new THREE.Vector3(st.x, 2.75, 0),
      new THREE.Vector3(st.x - 1.9, 2.2, 1.4)
    );
  }

  // Room 02: Climate-Controlled Withering Hall — Golden Tea Buffer (T-01..04, FN-01..04)
  {
    const st = FACTORY_STATIONS[1];
    const g = new THREE.Group();
    let fanIdx = 0;
    const witheredBedGeo = createOrganicLeafBedGeometry(4.8, 1.28, 0.14, 0.14, 26, 10, 33);
    for (const tz of [-0.9, 1.55]) {
      const trough = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 1.5), steelMat);
      trough.position.set(st.x, 0.65, tz);
      g.add(trough);

      const leafBed = new THREE.Mesh(witheredBedGeo, stageLeafMaterials.withering);
      leafBed.position.set(st.x, 1.13, tz);
      g.add(leafBed);

      for (const fx of [-2.75, 2.75]) {
        const shroud = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 0.36, 18),
          darkSlateMat
        );
        shroud.rotation.z = Math.PI / 2;
        shroud.position.set(st.x + fx, 0.75, tz);
        g.add(shroud);

        const fanGroup = new THREE.Group();
        fanGroup.position.set(st.x + fx + (fx < 0 ? -0.22 : 0.22), 0.75, tz);
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

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 2.55, 0),
      new THREE.Vector3(st.x - 2.75, 1.75, 1.55)
    );
  }

  // Room 03: Fixation, Rolling & Oxidation Room (RL-01..02)
  {
    const st = FACTORY_STATIONS[2];
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 4.0), darkSlateMat);
    base.position.set(st.x, 0.175, 0);
    g.add(base);

    for (const rx of [-1.2, 1.2]) {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), steelMat);
      stand.position.set(st.x + rx, 0.9, -0.75);
      g.add(stand);

      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.15, 20), brassMat);
      drum.position.set(st.x + rx, 1.75, -0.75);
      g.add(drum);
      rollerDrums.push(drum);
    }

    const oxTable = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.7, 1.15), steelMat);
    oxTable.position.set(st.x, 0.7, 1.15);
    g.add(oxTable);

    const oxBedGeo = createOrganicLeafBedGeometry(3.75, 0.96, 0.1, 0.14, 24, 10, 44);
    rollingBedMesh = new THREE.Mesh(oxBedGeo, stageLeafMaterials.rolling_green);
    rollingBedMesh.position.set(st.x, 1.08, 1.15);
    g.add(rollingBedMesh);

    const clumpGeo = createLeafClusterGeometry(0.24, 55);
    for (let c = 0; c < 5; c++) {
      const clump = new THREE.Mesh(clumpGeo, stageLeafMaterials.rolling_green);
      clump.position.set(st.x - 1.3 + c * 0.65, 1.18, 1.15 + (c % 2 === 0 ? -0.14 : 0.14));
      g.add(clump);
      rollerClumps.push(clump);
    }

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 2.85, 0),
      new THREE.Vector3(st.x - 1.2, 2.45, -0.75)
    );
  }

  // Room 04: Thermal Drying Room — ATEX Zone 22 (DR-01, TT-401/402, FS-401)
  {
    const st = FACTORY_STATIONS[3];
    const g = new THREE.Group();
    const chamber = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.2, 2.4), darkSlateMat);
    chamber.position.set(st.x, 1.1, 0);
    g.add(chamber);

    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 2.6, 16), steelMat);
    stack.position.set(st.x + 1.2, 3.3, 0);
    g.add(stack);

    const chute = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.85), steelMat);
    chute.rotation.z = -0.32;
    chute.position.set(st.x + 2.75, 0.88, 0);
    g.add(chute);

    const driedBedGeo = createOrganicLeafBedGeometry(1.05, 0.72, 0.08, 0.12, 14, 10, 66);
    const driedBed = new THREE.Mesh(driedBedGeo, stageLeafMaterials.dryer);
    driedBed.position.set(st.x + 2.85, 0.94, 0);
    g.add(driedBed);

    for (let hx = -1.4; hx <= 1.4; hx += 0.7) {
      const coilMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 1.4,
        roughness: 0.3,
      });
      const coil = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.55, 2.46), coilMat);
      coil.position.set(st.x + hx, 1.05, 0);
      g.add(coil);
      dryerHeaters.push(coil);
    }

    const dryerGlow = new THREE.PointLight(0xf97316, 2.2, 9);
    dryerGlow.position.set(st.x, 1.4, 1.8);
    g.add(dryerGlow);
    dryerHeaters.push(dryerGlow);

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 3.25, 0),
      new THREE.Vector3(st.x - 1.8, 2.45, 1.1)
    );
  }

  // Room 05: Vibratory Grading & Optical Color Sorting (GR-01, OS-01, RJ-01 Reject Bin)
  {
    const st = FACTORY_STATIONS[4];
    const g = new THREE.Group();

    const basePad = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.25, 4.4), darkSlateMat);
    basePad.position.set(st.x, 0.125, 0);
    g.add(basePad);

    // Multi-deck Vibratory Grader (GR-01)
    graderDeckGroup = new THREE.Group();
    graderDeckGroup.position.set(st.x - 1.35, 1.05, 0);
    const deckFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.52, 1.35), steelMat);
    graderDeckGroup.add(deckFrame);
    const graderBed = new THREE.Mesh(
      createOrganicLeafBedGeometry(2.0, 1.15, 0.08, 0.09, 18, 10, 81),
      stageLeafMaterials.sorting
    );
    graderBed.position.y = 0.28;
    graderDeckGroup.add(graderBed);
    g.add(graderDeckGroup);

    // Optical Color Sorter Chute & RGB Camera Hood (OS-01)
    const sorterHousing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.75, 1.4), brushedIronMat);
    sorterHousing.position.set(st.x + 1.05, 1.1, 0);
    g.add(sorterHousing);

    const opticalBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.12, 1.46),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.5 })
    );
    opticalBar.position.set(st.x + 1.05, 1.65, 0);
    g.add(opticalBar);

    // Dedicated Reject Bin (RJ-01) in front of Optical Sorter with pale/scorched reject leaf pile
    const rejectBin = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.68, 1.15),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6, metalness: 0.3 })
    );
    rejectBin.position.set(st.x + 1.05, 0.56, 1.55);
    g.add(rejectBin);

    const rejectPile = new THREE.Mesh(
      createOrganicLeafBedGeometry(1.15, 0.95, 0.1, 0.16, 14, 12, 91),
      stageLeafMaterials.reject
    );
    rejectPile.position.set(st.x + 1.05, 0.88, 1.55);
    g.add(rejectPile);

    // Animated reject leaf particles diverting from OS-01 into RJ-01
    const rejGeo = createLeafClusterGeometry(0.14, 95);
    for (let r = 0; r < 4; r++) {
      const rej = new THREE.Mesh(rejGeo, stageLeafMaterials.reject);
      rej.position.set(st.x + 1.05, 1.25, 0.4 + r * 0.28);
      rej.userData.phase = r * 0.25;
      g.add(rej);
      rejectDivertParticles.push(rej);
    }

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 2.95, 0),
      new THREE.Vector3(st.x + 1.05, 2.35, 0.9)
    );
  }

  // Room 06: Cleanroom Weigh-Fill & Foil Packaging (PK-01)
  {
    const st = FACTORY_STATIONS[5];
    const g = new THREE.Group();
    const rackBase = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.22, 4.4), darkSlateMat);
    rackBase.position.set(st.x, 0.11, 0);
    g.add(rackBase);

    const packer = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.4), steelMat);
    packer.position.set(st.x - 1.8, 1.12, 0);
    g.add(packer);

    const trayFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.14, 0.95),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.55, roughness: 0.15 })
    );
    trayFrame.position.set(st.x - 1.7, 0.3, 1.35);
    g.add(trayFrame);

    const sampleTea = new THREE.Mesh(
      createOrganicLeafBedGeometry(1.1, 0.8, 0.08, 0.08, 16, 12, 77),
      stageLeafMaterials.warehouse
    );
    sampleTea.position.set(st.x - 1.7, 0.36, 1.35);
    g.add(sampleTea);

    const pouchGeo = new THREE.BoxGeometry(0.46, 0.62, 0.24);
    const kraftMat = new THREE.MeshStandardMaterial({ color: 0xc29b61, roughness: 0.82 });
    const foilBandMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.38, metalness: 0.25 });
    for (let idx = 0; idx < 18; idx++) {
      const col = idx % 3;
      const row = Math.floor(idx / 3) % 2;
      const tier = Math.floor(idx / 6);

      const pouchGroup = new THREE.Group();
      pouchGroup.add(new THREE.Mesh(pouchGeo, kraftMat));
      const labelBand = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.16, 0.25), foilBandMat);
      labelBand.position.y = 0.04;
      pouchGroup.add(labelBand);

      pouchGroup.position.set(st.x + 0.1 + col * 0.78, 0.54 + tier * 0.66, -0.55 + row * 0.82);
      pouchGroup.userData.index = idx;
      g.add(pouchGroup);
      warehouseBoxes.push(pouchGroup);
    }

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 2.95, 0),
      new THREE.Vector3(st.x - 1.8, 2.25, 0.7)
    );
  }

  // Moving Conveyor Batches:
  // Path 2 (Green Tea Direct Bypass: Room 01 -> Room 03 at z = -2.35)
  {
    const clusterGeo = createLeafClusterGeometry(0.28, 97);
    for (let i = 0; i < 6; i++) {
      const batch = new THREE.Mesh(clusterGeo, stageLeafMaterials.intake);
      batch.position.set(-20 + i * 2.8, 0.9, -2.35);
      batch.castShadow = true;
      batch.userData.phase = i / 6;
      scene.add(batch);
      bypassBatches.push(batch);
    }
  }

  // Main Process Conveyor Batches (Room 01 -> Room 06 at z = 0)
  {
    const clusterGeo = createLeafClusterGeometry(0.32, 99);
    const count = 14;
    for (let i = 0; i < count; i++) {
      const batch = new THREE.Mesh(clusterGeo, stageLeafMaterials.intake);
      batch.position.set(-20 + i * 3.0, 0.76, 0);
      batch.castShadow = true;
      batch.userData.phase = i / count;
      scene.add(batch);
      mainConveyorBatches.push(batch);
    }
  }

  // Floating 3D Station Labels
  const labelEls = new Map();
  FACTORY_STATIONS.forEach((st) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'station-3d-label';
    el.innerHTML = `<span class="label-name">${st.roomCode} · ${st.shortName.replace(/^Room \d+:\s*/, '')}</span><span class="label-metric" data-station="${st.id}">Ready</span>`;
    el.addEventListener('click', () => {
      focusStation(st.id);
      if (onStationSelect) onStationSelect(st.id);
    });
    labelsContainer.appendChild(el);
    labelEls.set(st.id, el);
  });

  // Toggleable ISA-5.1 Instrument Callout Badges (6 Rooms)
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
    goldenHandoverActive: false, // Path 3 (02->03) active when TRUE; Path 2 (01->03) active when FALSE
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

    // Update Diverter DV-01A / DV-01B gate positions
    if (diverterArmA && diverterArmB) {
      diverterArmA.rotation.y = simState.goldenHandoverActive ? 0.55 : -0.35;
      diverterArmB.rotation.y = simState.goldenHandoverActive ? 1.15 : 0.0;
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

      // Path 2: Green Tea Direct Bypass (01 -> 03) paused during Golden Handover (02 -> 03)
      const bypassActive = !isWinter && !simState.goldenHandoverActive && simState.plcSafe && !simState.stationAlarms.intake;
      bypassBatches.forEach((batch) => {
        batch.visible = !isWinter && !simState.goldenHandoverActive;
        if (bypassActive) {
          const cycle = (simTime * 0.14 + batch.userData.phase) % 1;
          batch.position.x = -20 + cycle * 16.0;
        }
      });

      // Main Process Conveyor (Room 01 -> Room 06)
      const conveyorActive = !isWinter && simState.plcSafe && !simState.stationAlarms.intake;
      mainConveyorBatches.forEach((batch) => {
        batch.visible = !isWinter;
        if (conveyorActive) {
          const cycle = (simTime * 0.045 + batch.userData.phase) % 1;
          batch.position.x = -20 + cycle * 40.0;
        }
        const bx = batch.position.x;
        const stageMat =
          bx < -16
            ? stageLeafMaterials.intake
            : bx < -8
              ? stageLeafMaterials.withering
              : bx < 0
                ? simState.goldenHandoverActive
                  ? stageLeafMaterials.rolling
                  : stageLeafMaterials.rolling_green
                : bx < 8
                  ? stageLeafMaterials.dryer
                  : stageLeafMaterials.sorting;
        if (batch.material !== stageMat) {
          batch.material = stageMat;
        }
      });

      // Room 05 Vibratory Grader (GR-01) oscillation + Reject Diversion into RJ-01
      if (graderDeckGroup && !isWinter) {
        graderDeckGroup.position.x = 12 - 1.35 + Math.sin(now * 0.045) * 0.035;
      }
      const rejectRateFactor = simState.rejectSpikeActive ? 1.9 : 1.0;
      rejectDivertParticles.forEach((rej) => {
        rej.visible = !isWinter;
        if (!isWinter) {
          const cycle = (simTime * 0.65 * rejectRateFactor + rej.userData.phase) % 1;
          rej.position.z = 0.25 + cycle * 1.3;
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

    if (showIsaTags) {
      tagEls.forEach(({ el, stationId }) => {
        const anchor = tagAnchors.get(stationId);
        if (!anchor) return;
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
