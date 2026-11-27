import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const FACTORY_STATIONS = [
  {
    id: 'intake',
    order: 1,
    shortcut: '1',
    zoneLabel: 'ZONE 01 INTAKE',
    name: '1. Leaf Intake Dock',
    shortName: 'Intake Dock',
    x: -16,
    z: 0,
    cameraOffset: { x: -16, y: 2.1, z: 7.8 },
    lookAtOffset: { x: -16, y: 1.25, z: 0 },
    accent: 0x64748b,
  },
  {
    id: 'withering',
    order: 2,
    shortcut: '2',
    zoneLabel: 'ZONE 02 WITHERING',
    name: '2. Withering Troughs',
    shortName: 'Withering',
    x: -8,
    z: 0,
    cameraOffset: { x: -8, y: 2.1, z: 7.8 },
    lookAtOffset: { x: -8, y: 1.25, z: 0 },
    accent: 0x64748b,
  },
  {
    id: 'rolling',
    order: 3,
    shortcut: '3',
    zoneLabel: 'ZONE 03 ROLLING',
    name: '3. Rolling & Oxidation',
    shortName: 'Rolling',
    x: 0,
    z: 0,
    cameraOffset: { x: 0, y: 2.1, z: 7.8 },
    lookAtOffset: { x: 0, y: 1.25, z: 0 },
    accent: 0x64748b,
  },
  {
    id: 'dryer',
    order: 4,
    shortcut: '4',
    zoneLabel: 'ZONE 04 DRYING',
    name: '4. Dryer Line',
    shortName: 'Dryer Line',
    x: 8,
    z: 0,
    cameraOffset: { x: 8, y: 2.2, z: 7.8 },
    lookAtOffset: { x: 8, y: 1.35, z: 0 },
    accent: 0x64748b,
  },
  {
    id: 'warehouse',
    order: 5,
    shortcut: '5',
    zoneLabel: 'ZONE 05 PACKAGING',
    name: '5. Packaging & Warehouse',
    shortName: 'Warehouse',
    x: 16,
    z: 0,
    cameraOffset: { x: 16, y: 2.2, z: 8.2 },
    lookAtOffset: { x: 16, y: 1.35, z: 0 },
    accent: 0x64748b,
  },
];

const OVERVIEW_CAMERA = {
  pos: new THREE.Vector3(0, 6.2, 23.5),
  target: new THREE.Vector3(0, 1.3, 0),
};

// Moisture-stage tea colors along conveyor (78% fresh -> 68% withered -> 65% oxidized -> 3% dried)
const STAGE_COLOR_FRESH = new THREE.Color(0x22c55e);
const STAGE_COLOR_WITHERED = new THREE.Color(0x84cc16);
const STAGE_COLOR_OXIDIZED = new THREE.Color(0xb45309);
const STAGE_COLOR_FINISHED = new THREE.Color(0x292524);

function sampleBatchColor(x) {
  // x spans roughly -18 (intake) to +15 (packaging)
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

function createFloorLabelTexture(text, borderColor = '#64748b', textColor = '#cbd5e1') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 112);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fillRect(11, 11, 490, 106);

  ctx.fillStyle = textColor;
  ctx.font = '700 34px "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function createFactory3D({ container, labelsContainer, onStationSelect }) {
  const scene = new THREE.Scene();
  // ISA-101 High-Performance HMI neutral dark slate backdrop
  scene.background = new THREE.Color(0x0f172a);
  scene.fog = new THREE.FogExp2(0x0f172a, 0.013);

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 140);
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
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minPolarAngle = 0.12;
  controls.minDistance = 2.5;
  controls.maxDistance = 38;
  controls.update();

  // Neutral industrial lighting
  const hemi = new THREE.HemisphereLight(0xe2e8f0, 0x1e293b, 0.9);
  scene.add(hemi);

  const dirLight = new THREE.DirectionalLight(0xf8fafc, 1.3);
  dirLight.position.set(14, 24, 14);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 2;
  dirLight.shadow.camera.far = 65;
  dirLight.shadow.camera.left = -26;
  dirLight.shadow.camera.right = 26;
  dirLight.shadow.camera.top = 18;
  dirLight.shadow.camera.bottom = -18;
  scene.add(dirLight);

  // Neutral slate factory floor & grid
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(56, 28),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.88, metalness: 0.1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(56, 56, 0x334155, 0x243042);
  grid.position.y = 0.008;
  scene.add(grid);

  // Operator walkway (neutral slate)
  const walkway = new THREE.Mesh(
    new THREE.BoxGeometry(38, 0.03, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.78 })
  );
  walkway.position.set(0, 0.015, 3.4);
  walkway.receiveShadow = true;
  scene.add(walkway);

  // Conveyor spine connecting all 5 stations
  const spineBelt = new THREE.Mesh(
    new THREE.BoxGeometry(34, 0.22, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.55, roughness: 0.45 })
  );
  spineBelt.position.set(0, 0.55, 0);
  spineBelt.castShadow = true;
  spineBelt.receiveShadow = true;
  scene.add(spineBelt);

  // Structural steel bay pillars & back wall
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.42 });
  for (let px = -22; px <= 22; px += 8) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 7.5, 0.45), pillarMat);
    pillar.position.set(px, 3.75, -6.5);
    pillar.castShadow = true;
    scene.add(pillar);
  }
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(52, 7.5, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x172030, roughness: 0.92 })
  );
  backWall.position.set(0, 3.75, -6.8);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Neutral steel/slate materials (ISA-101)
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

  // Floor Zone Markings (ZONE 01 INTAKE .. ZONE 05 PACKAGING)
  FACTORY_STATIONS.forEach((st) => {
    const zoneMat = new THREE.MeshBasicMaterial({
      map: createFloorLabelTexture(st.zoneLabel),
      transparent: true,
    });
    const zonePlate = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.15), zoneMat);
    zonePlate.rotation.x = -Math.PI / 2;
    zonePlate.position.set(st.x, 0.02, 5.15);
    scene.add(zonePlate);
  });

  // Safety-Yellow ATEX Zone 22 Floor Perimeter around Dryer DR-01 (x=8, z=0)
  {
    const atexMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const dx = 8;
    const w = 6.2;
    const d = 4.2;
    const t = 0.12;
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
      new THREE.PlaneGeometry(3.2, 0.65),
      new THREE.MeshBasicMaterial({
        map: createFloorLabelTexture('ATEX ZONE 22 · DR-01', '#eab308', '#fde047'),
        transparent: true,
      })
    );
    atexSign.rotation.x = -Math.PI / 2;
    atexSign.position.set(dx, 0.028, -2.55);
    scene.add(atexSign);
  }

  function makeHotspot(station) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 0.86, 36),
      new THREE.MeshBasicMaterial({
        color: 0x94a3b8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(station.x, 0.04, 3.4);
    ring.userData.stationId = station.id;
    scene.add(ring);
    hotspotRings.push(ring);
    clickableTargets.push(ring);

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.58, 24),
      new THREE.MeshBasicMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
      })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(station.x, 0.035, 3.4);
    disc.userData.stationId = station.id;
    scene.add(disc);
    clickableTargets.push(disc);
  }

  function registerStationHitbox(group, stationId, labelPos, tagPos) {
    const st = FACTORY_STATIONS.find((s) => s.id === stationId);
    if (st) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.45, 10),
        darkSlateMat
      );
      pole.position.set(st.x + 2.15, 0.72, 1.75);
      group.add(pole);

      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(st.x + 2.15, 1.52, 1.75);

      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x16a34a,
        emissiveIntensity: 1.4,
        roughness: 0.25,
      });
      // Octagonal rotating stack beacon head so rotation is visually apparent
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

  // 1. Leaf Intake Dock (SC-01)
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
      new THREE.Vector3(st.x, 2.85, 0),
      new THREE.Vector3(st.x - 1.9, 2.25, 1.4)
    );
  }

  // 2. Withering Troughs (FN-01..04)
  {
    const st = FACTORY_STATIONS[1];
    const g = new THREE.Group();
    let fanIdx = 0;
    for (const tz of [-1.25, 1.25]) {
      const trough = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 1.5), steelMat);
      trough.position.set(st.x, 0.65, tz);
      g.add(trough);

      const leafBed = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.14, 1.28),
        new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.85 })
      );
      leafBed.position.set(st.x, 1.15, tz);
      g.add(leafBed);

      // Two VFD fan shrouds per trough = FN-01..04
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
      new THREE.Vector3(st.x - 2.75, 1.65, 1.25)
    );
  }

  // 3. Rolling & Oxidation (RL-01)
  {
    const st = FACTORY_STATIONS[2];
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 4.0), darkSlateMat);
    base.position.set(st.x, 0.175, 0);
    g.add(base);

    for (const rx of [-1.2, 1.2]) {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), steelMat);
      stand.position.set(st.x + rx, 0.9, -0.7);
      g.add(stand);

      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.15, 20), brassMat);
      drum.position.set(st.x + rx, 1.75, -0.7);
      g.add(drum);
      rollerDrums.push(drum);
    }

    const oxTable = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.7, 1.1), steelMat);
    oxTable.position.set(st.x, 0.7, 1.1);
    g.add(oxTable);

    const oxLayer = new THREE.Mesh(
      new THREE.BoxGeometry(3.7, 0.08, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 })
    );
    oxLayer.position.set(st.x, 1.09, 1.1);
    g.add(oxLayer);

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(
      g,
      st.id,
      new THREE.Vector3(st.x, 2.85, 0),
      new THREE.Vector3(st.x - 1.2, 2.45, -0.7)
    );
  }

  // 4. Dryer Line (TT-401 / DR-01)
  {
    const st = FACTORY_STATIONS[3];
    const g = new THREE.Group();
    const chamber = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.2, 2.4), darkSlateMat);
    chamber.position.set(st.x, 1.1, 0);
    g.add(chamber);

    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 2.4, 16), steelMat);
    stack.position.set(st.x + 1.2, 3.2, 0);
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
      new THREE.Vector3(st.x, 3.2, 0),
      new THREE.Vector3(st.x - 1.8, 2.45, 1.1)
    );
  }

  // 5. Packaging & Warehouse (PK-01)
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

  // Moving Conveyor Tea Batches (color transitions 78% -> 68% -> 65% -> 3% moisture)
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
    el.innerHTML = `<span class="label-name">${st.name}</span><span class="label-metric" data-station="${st.id}">Ready</span>`;
    el.addEventListener('click', () => {
      focusStation(st.id);
      if (onStationSelect) onStationSelect(st.id);
    });
    labelsContainer.appendChild(el);
    labelEls.set(st.id, el);
  });

  // Toggleable ISA-5.1 Instrument Callout Badges (SC-01, FN-01, RL-01, TT-401, PK-01)
  const ISA_TAGS = [
    { id: 'SC-01', stationId: 'intake', desc: 'Load Cell' },
    { id: 'FN-01', stationId: 'withering', desc: 'VFD Fan' },
    { id: 'RL-01', stationId: 'rolling', desc: 'Roll Press' },
    { id: 'TT-401', stationId: 'dryer', desc: 'Dryer Temp' },
    { id: 'PK-01', stationId: 'warehouse', desc: 'Pack Stock' },
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
      durationMs: 700,
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
    operatingMode: 'normal', // 'normal' | 'winter'
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

      // 1. Leaf crates sliding into Intake Dock
      const intakeFactor = simState.stationAlarms.intake || isWinter ? 0.0 : simState.intakeSpeedScale;
      intakeCrates.forEach((crate) => {
        if (intakeFactor > 0) {
          const cycle = (simTime * 0.35 * intakeFactor + crate.userData.phase) % 1;
          crate.position.x = crate.userData.baseX + cycle * 4.4;
        }
        crate.visible = !isWinter;
      });

      // 2. Withering fans spinning (FN-01..04 scaled to %QW64 speed)
      const fanFactor =
        simState.stationAlarms.withering || isWinter
          ? 0.0
          : simState.witheringFanSpeedPct / 75.0;
      witheringFans.forEach((fan, idx) => {
        fan.rotation.x +=
          dt * 8.5 * simState.speed * simState.throughputScale * fanFactor * (idx % 2 === 0 ? 1 : -1);
      });

      // 3. Orthodox rollers rotating
      const rollFactor = simState.stationAlarms.rolling || isWinter ? 0.0 : simState.rollingSpeedScale;
      rollerDrums.forEach((drum, idx) => {
        drum.rotation.y +=
          dt * 2.8 * simState.speed * simState.throughputScale * rollFactor * (idx === 0 ? 1 : -1);
      });

      // 4. Dryer heating elements pulsing
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

      // 5. Moving conveyor batches transitioning 78% green -> 68% olive -> 65% copper -> 3% dark tea
      const conveyorActive = !isWinter && simState.plcSafe && !simState.stationAlarms.intake;
      conveyorBatches.forEach((batch) => {
        batch.visible = !isWinter;
        if (conveyorActive) {
          const cycle = (simTime * 0.055 + batch.userData.phase) % 1;
          batch.position.x = -17.5 + cycle * 32.5;
        }
        batch.material.color.copy(sampleBatchColor(batch.position.x));
      });

      // 6. Warehouse boxes subtle arrival pulse
      warehouseBoxes.forEach((box) => {
        if (box.visible && box.userData.index >= 12) {
          box.position.y =
            0.48 +
            Math.floor(box.userData.index / 6) * 0.55 +
            Math.sin(simTime * 2 + box.userData.index) * 0.012;
        }
      });
    }

    // Status-driven rotating stack beacons (green=running, amber=standby/warning, flashing red=safety trip)
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

    // Pulse floor hotspot rings
    hotspotRings.forEach((ring, idx) => {
      const s = 1 + 0.06 * Math.sin(now * 0.004 + idx);
      ring.scale.set(s, s, 1);
    });

    // Camera tween
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

    // Project floating 3D station labels
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

    // Project ISA-5.1 instrument callout badges
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

  rafId = requestAnimationFrame(animate);

  return {
    focusStation,
    updateSimulationState,
    setIsaTagsVisible,
    dispose() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    },
  };
}
