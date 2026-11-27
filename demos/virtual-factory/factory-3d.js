import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const FACTORY_STATIONS = [
  {
    id: 'intake',
    order: 1,
    shortcut: '1',
    roomCode: 'ROOM 01',
    zoneLabel: 'ROOM 01 · RECEPTION & WEIGHING (SC-01)',
    name: '1. Raw Leaf Reception & Weighing',
    shortName: 'Room 01: Intake',
    x: -16,
    z: 0,
    cameraOffset: { x: -16, y: 3.4, z: 7.4 },
    lookAtOffset: { x: -16, y: 1.15, z: -0.2 },
  },
  {
    id: 'withering',
    order: 2,
    shortcut: '2',
    roomCode: 'ROOM 02',
    zoneLabel: 'ROOM 02 · WITHERING HALL (T-01..04, FN-01..04)',
    name: '2. Climate-Controlled Withering Hall',
    shortName: 'Room 02: Withering',
    x: -8,
    z: 0,
    cameraOffset: { x: -8, y: 3.4, z: 7.4 },
    lookAtOffset: { x: -8, y: 1.15, z: -0.2 },
  },
  {
    id: 'rolling',
    order: 3,
    shortcut: '3',
    roomCode: 'ROOM 03',
    zoneLabel: 'ROOM 03 · ROLLING & OXIDATION (RL-01..02)',
    name: '3. Rolling & Oxidation Room',
    shortName: 'Room 03: Rolling',
    x: 0,
    z: 0,
    cameraOffset: { x: 0, y: 3.4, z: 7.4 },
    lookAtOffset: { x: 0, y: 1.15, z: -0.2 },
  },
  {
    id: 'dryer',
    order: 4,
    shortcut: '4',
    roomCode: 'ROOM 04',
    zoneLabel: 'ROOM 04 · THERMAL DRYING · ATEX ZONE 22 (DR-01)',
    name: '4. Thermal Drying Room (ATEX Zone 22)',
    shortName: 'Room 04: Dryer',
    x: 8,
    z: 0,
    cameraOffset: { x: 8, y: 3.6, z: 7.6 },
    lookAtOffset: { x: 8, y: 1.25, z: -0.2 },
  },
  {
    id: 'warehouse',
    order: 5,
    shortcut: '5',
    roomCode: 'ROOM 05',
    zoneLabel: 'ROOM 05 · GRADING & PACKAGING CLEANROOM (PK-01)',
    name: '5. Dry Grading & Export Packaging Cleanroom',
    shortName: 'Room 05: Packaging',
    x: 16,
    z: 0,
    cameraOffset: { x: 16, y: 3.5, z: 7.8 },
    lookAtOffset: { x: 16, y: 1.2, z: -0.2 },
  },
];

// Elevated front-left corner bird's-eye view framing all 5 rooms diagonally
const OVERVIEW_CAMERA = {
  pos: new THREE.Vector3(-24, 15.5, 22),
  target: new THREE.Vector3(0, 1.0, -0.5),
};

// Moisture-stage tea colors along conveyor (78% fresh -> 68% withered -> 65% oxidized -> 3% dried)
const STAGE_COLOR_FRESH = new THREE.Color(0x22c55e);
const STAGE_COLOR_WITHERED = new THREE.Color(0x84cc16);
const STAGE_COLOR_OXIDIZED = new THREE.Color(0xb45309);
const STAGE_COLOR_FINISHED = new THREE.Color(0x292524);

function sampleBatchColor(x) {
  const t = THREE.MathUtils.clamp((x + 18) / 33, 0, 1);
  const out = new THREE.Color();
  if (t < 0.33) {
    out.lerpColors(STAGE_COLOR_FRESH, STAGE_COLOR_WITHERED, t / 0.33);
  } else if (t < 0.66) {
    out.lerpColors(STAGE_COLOR_WITHERED, STAGE_COLOR_OXIDIZED, (t - 0.33) / 0.33);
  } else {
    out.lerpColors(STAGE_COLOR_OXIDIZED, STAGE_COLOR_FINISHED, (t - 0.66) / 0.34);
  }
  return out;
}

function createPlaqueTexture(title, borderColor = '#64748b', textColor = '#f8fafc', bgColor = 'rgba(15, 23, 42, 0.85)') {
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
  ctx.font = '700 28px "Segoe UI", Roboto, sans-serif';
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
  scene.fog = new THREE.FogExp2(0xe9eef5, 0.0085);

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 160);
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
  controls.maxDistance = 46;
  controls.update();

  // Neutral industrial lighting (adjusted dynamically by setTheme)
  const hemi = new THREE.HemisphereLight(0xf8fafc, 0xcbd5e1, 1.25);
  scene.add(hemi);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.55);
  dirLight.position.set(-16, 26, 18);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 2;
  dirLight.shadow.camera.far = 75;
  dirLight.shadow.camera.left = -28;
  dirLight.shadow.camera.right = 28;
  dirLight.shadow.camera.top = 18;
  dirLight.shadow.camera.bottom = -18;
  scene.add(dirLight);

  // Factory floor, grids, walkway & conveyor spine
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.85, metalness: 0.08 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(56, 28), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const gridLight = new THREE.GridHelper(56, 56, 0x94a3b8, 0xb8c4d4);
  gridLight.position.y = 0.008;
  scene.add(gridLight);

  const gridDark = new THREE.GridHelper(56, 56, 0x334155, 0x243042);
  gridDark.position.y = 0.008;
  gridDark.visible = false;
  scene.add(gridDark);

  const walkwayMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.78 });
  const walkway = new THREE.Mesh(new THREE.BoxGeometry(40, 0.03, 1.6), walkwayMat);
  walkway.position.set(0, 0.015, 5.2);
  walkway.receiveShadow = true;
  scene.add(walkway);

  const spineBeltMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5, roughness: 0.45 });
  const spineBelt = new THREE.Mesh(new THREE.BoxGeometry(36, 0.22, 0.72), spineBeltMat);
  spineBelt.position.set(0, 0.55, 0);
  spineBelt.castShadow = true;
  spineBelt.receiveShadow = true;
  scene.add(spineBelt);

  // Architectural 5-Room Cutaway Partition System
  const wallBackMat = new THREE.MeshStandardMaterial({ color: 0xdbe3ee, roughness: 0.88 });
  const wallPartitionMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.82 });
  const wallFrameMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.55, roughness: 0.4 });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.55, roughness: 0.42 });

  // Full-height back wall (z = -5.5, height 4.2m)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(40.4, 4.2, 0.24), wallBackMat);
  backWall.position.set(0, 2.1, -5.5);
  backWall.receiveShadow = true;
  backWall.castShadow = true;
  scene.add(backWall);

  // Low front cutaway curb wall (z = +4.2, height 0.36m) with room entry gaps
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

  // Side & inter-room cutaway partition walls at x = -20, -12, -4, +4, +12, +20
  // Inter-room partitions have a framed conveyor pass-through opening (z = -0.85 to +0.85, y = 0..1.45)
  const partitionXs = [-20, -12, -4, 4, 12, 20];
  partitionXs.forEach((px, idx) => {
    const isOuter = idx === 0 || idx === partitionXs.length - 1;
    const wallHeight = isOuter ? 2.4 : 2.1;

    // Structural column at back and front cutaway corner
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
      // Back section (z = -5.5 to -0.85 -> length 4.65)
      const backSeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, wallHeight, 4.65), wallPartitionMat);
      backSeg.position.set(px, wallHeight / 2, -3.175);
      backSeg.castShadow = true;
      backSeg.receiveShadow = true;
      scene.add(backSeg);

      // Front section (z = +0.85 to +4.2 -> length 3.35)
      const frontSeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, wallHeight, 3.35), wallPartitionMat);
      frontSeg.position.set(px, wallHeight / 2, 2.525);
      frontSeg.castShadow = true;
      frontSeg.receiveShadow = true;
      scene.add(frontSeg);

      // Header lintel above conveyor pass-through (z = -0.85 to +0.85, y = 1.45 to wallHeight)
      const lintelH = wallHeight - 1.45;
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.22, lintelH, 1.7), wallFrameMat);
      lintel.position.set(px, 1.45 + lintelH / 2, 0);
      lintel.castShadow = true;
      scene.add(lintel);
    }
  });

  // Neutral steel/slate machine materials
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.68, roughness: 0.34 });
  const darkSlateMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.55, roughness: 0.45 });
  const brushedIronMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.62, roughness: 0.38 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xb48a4e, metalness: 0.72, roughness: 0.3 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.85 });

  // Interactive & Animated Collections
  const clickableTargets = [];
  const hotspotRings = [];
  const witheringFans = [];
  const rollerDrums = [];
  const intakeCrates = [];
  const conveyorBatches = [];
  const dryerHeaters = [];
  const warehouseBoxes = [];
  const stationBeacons = new Map();
  const labelAnchors = new Map();
  const tagAnchors = new Map();

  // Room Overhead Back-Wall Plaques & Front Floor Plaques
  FACTORY_STATIONS.forEach((st) => {
    const isDryer = st.id === 'dryer';
    const border = isDryer ? '#eab308' : '#0f766e';
    const textCol = isDryer ? '#fde047' : '#f8fafc';

    // Back wall overhead room plaque
    const wallPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 0.95),
      new THREE.MeshBasicMaterial({
        map: createPlaqueTexture(st.zoneLabel, border, textCol),
        transparent: true,
      })
    );
    wallPlaque.position.set(st.x, 3.35, -5.36);
    scene.add(wallPlaque);

    // Front floor zone plaque
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

  // Safety-Yellow ATEX Zone 22 Floor Perimeter around Dryer DR-01 in Room 04
  {
    const atexMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const dx = 8;
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

  // Room 01: Raw Leaf Reception & Weighing (SC-01)
  {
    const st = FACTORY_STATIONS[0];
    const g = new THREE.Group();
    const dockPad = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.38, 4.2), darkSlateMat);
    dockPad.position.set(st.x, 0.19, 0);
    g.add(dockPad);

    const hopper = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.55, 1.5, 6), steelMat);
    hopper.position.set(st.x + 1.0, 1.55, 0);
    g.add(hopper);

    const scalePost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.9, 0.18), brushedIronMat);
    scalePost.position.set(st.x - 1.9, 1.15, 1.4);
    g.add(scalePost);

    const crateGeo = new THREE.BoxGeometry(0.7, 0.48, 0.7);
    for (let i = 0; i < 4; i++) {
      const crate = new THREE.Mesh(crateGeo, leafMat.clone());
      crate.position.set(st.x - 2.2 + i * 1.15, 0.92, 0);
      crate.userData.baseX = st.x - 2.3;
      crate.userData.phase = i * 0.25;
      g.add(crate);
      intakeCrates.push(crate);
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

  // Room 02: Climate-Controlled Withering Hall (T-01..04, FN-01..04)
  {
    const st = FACTORY_STATIONS[1];
    const g = new THREE.Group();
    let fanIdx = 0;
    for (const tz of [-1.4, 1.4]) {
      const trough = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 1.5), steelMat);
      trough.position.set(st.x, 0.65, tz);
      g.add(trough);

      const leafBed = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.14, 1.28),
        new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.85 })
      );
      leafBed.position.set(st.x, 1.15, tz);
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
      new THREE.Vector3(st.x - 2.75, 1.75, 1.4)
    );
  }

  // Room 03: Rolling & Oxidation Room (RL-01..02)
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

    const oxTable = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.7, 1.1), steelMat);
    oxTable.position.set(st.x, 0.7, 1.15);
    g.add(oxTable);

    const oxLayer = new THREE.Mesh(
      new THREE.BoxGeometry(3.7, 0.08, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 })
    );
    oxLayer.position.set(st.x, 1.09, 1.15);
    g.add(oxLayer);

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 2.85, 0),
      new THREE.Vector3(st.x - 1.2, 2.45, -0.75)
    );
  }

  // Room 04: Thermal Drying Room (ATEX Zone 22) (DR-01, TT-401/402, FS-401, exhaust stack)
  {
    const st = FACTORY_STATIONS[3];
    const g = new THREE.Group();
    const chamber = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.2, 2.4), darkSlateMat);
    chamber.position.set(st.x, 1.1, 0);
    g.add(chamber);

    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 2.6, 16), steelMat);
    stack.position.set(st.x + 1.2, 3.3, 0);
    g.add(stack);

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

  // Room 05: Dry Grading & Export Packaging Cleanroom (PK-01)
  {
    const st = FACTORY_STATIONS[4];
    const g = new THREE.Group();
    const rackBase = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.22, 4.4), darkSlateMat);
    rackBase.position.set(st.x, 0.11, 0);
    g.add(rackBase);

    const packer = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.4), steelMat);
    packer.position.set(st.x - 1.8, 1.12, 0);
    g.add(packer);

    const boxGeo = new THREE.BoxGeometry(0.68, 0.52, 0.68);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.75 });
    for (let idx = 0; idx < 18; idx++) {
      const col = idx % 3;
      const row = Math.floor(idx / 3) % 2;
      const tier = Math.floor(idx / 6);
      const box = new THREE.Mesh(boxGeo, boxMat.clone());
      box.position.set(st.x + 0.1 + col * 0.82, 0.48 + tier * 0.55, -0.55 + row * 0.85);
      box.userData.index = idx;
      g.add(box);
      warehouseBoxes.push(box);
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

  // Moving Conveyor Tea Batches (78% green -> 68% olive -> 65% copper -> 3% dark tea)
  {
    const batchGeo = new THREE.BoxGeometry(0.62, 0.22, 0.52);
    const count = 12;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });
      const batch = new THREE.Mesh(batchGeo, mat);
      batch.position.set(-16 + i * 2.75, 0.78, 0);
      batch.castShadow = true;
      batch.userData.phase = i / count;
      scene.add(batch);
      conveyorBatches.push(batch);
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

  // Toggleable ISA-5.1 Instrument Callout Badges
  const ISA_TAGS = [
    { id: 'SC-01', stationId: 'intake' },
    { id: 'FN-01', stationId: 'withering' },
    { id: 'RL-01', stationId: 'rolling' },
    { id: 'TT-401', stationId: 'dryer' },
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
      warehouse: false,
    },
    stationStandby: {
      intake: false,
      withering: false,
      rolling: false,
      dryer: false,
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

      const conveyorActive = !isWinter && simState.plcSafe && !simState.stationAlarms.intake;
      conveyorBatches.forEach((batch) => {
        batch.visible = !isWinter;
        if (conveyorActive) {
          const cycle = (simTime * 0.055 + batch.userData.phase) % 1;
          batch.position.x = -17.5 + cycle * 32.5;
        }
        batch.material.color.copy(sampleBatchColor(batch.position.x));
      });

      warehouseBoxes.forEach((box) => {
        if (box.visible && box.userData.index >= 12) {
          box.position.y =
            0.48 +
            Math.floor(box.userData.index / 6) * 0.55 +
            Math.sin(simTime * 2 + box.userData.index) * 0.012;
        }
      });
    }

    const strobe = 0.85 + 0.9 * Math.abs(Math.sin(now * 0.01));
    stationBeacons.forEach(({ group, mat }, id) => {
      const isAlarm = Boolean(simState.stationAlarms[id]) || (id === 'dryer' && !simState.plcSafe);
      const isStandby = Boolean(simState.stationStandby[id]) || !simState.playing;

      if (isAlarm) {
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
      scene.fog.density = 0.011;
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
      scene.fog.density = 0.0085;
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
