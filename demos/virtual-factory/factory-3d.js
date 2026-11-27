import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const FACTORY_STATIONS = [
  {
    id: 'intake',
    order: 1,
    name: '1. Leaf Intake Dock',
    shortName: 'Intake Dock',
    x: -16,
    z: 0,
    cameraOffset: { x: -16, y: 1.7, z: 7.5 },
    lookAtOffset: { x: -16, y: 1.3, z: 0 },
    accent: 0x22c55e,
  },
  {
    id: 'withering',
    order: 2,
    name: '2. Withering Troughs',
    shortName: 'Withering',
    x: -8,
    z: 0,
    cameraOffset: { x: -8, y: 1.7, z: 7.5 },
    lookAtOffset: { x: -8, y: 1.3, z: 0 },
    accent: 0x38bdf8,
  },
  {
    id: 'rolling',
    order: 3,
    name: '3. Rolling & Oxidation',
    shortName: 'Rolling',
    x: 0,
    z: 0,
    cameraOffset: { x: 0, y: 1.7, z: 7.5 },
    lookAtOffset: { x: 0, y: 1.3, z: 0 },
    accent: 0xf59e0b,
  },
  {
    id: 'dryer',
    order: 4,
    name: '4. Dryer Line',
    shortName: 'Dryer Line',
    x: 8,
    z: 0,
    cameraOffset: { x: 8, y: 1.7, z: 7.5 },
    lookAtOffset: { x: 8, y: 1.4, z: 0 },
    accent: 0xef4444,
  },
  {
    id: 'warehouse',
    order: 5,
    name: '5. Packaging & Warehouse',
    shortName: 'Warehouse',
    x: 16,
    z: 0,
    cameraOffset: { x: 16, y: 1.7, z: 8.0 },
    lookAtOffset: { x: 16, y: 1.4, z: 0 },
    accent: 0xa855f7,
  },
];

const OVERVIEW_CAMERA = {
  pos: new THREE.Vector3(0, 4.2, 22),
  target: new THREE.Vector3(0, 1.4, 0),
};

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function createFactory3D({ container, labelsContainer, onStationSelect }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1510);
  scene.fog = new THREE.FogExp2(0x0b1510, 0.015);

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 140);
  camera.position.set(0, 1.7, 15.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.35, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minPolarAngle = 0.12;
  controls.minDistance = 2.5;
  controls.maxDistance = 36;
  controls.update();

  // Lighting
  const hemi = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.85);
  scene.add(hemi);

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
  dirLight.position.set(14, 22, 14);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 2;
  dirLight.shadow.camera.far = 65;
  dirLight.shadow.camera.left = -26;
  dirLight.shadow.camera.right = 26;
  dirLight.shadow.camera.top = 18;
  dirLight.shadow.camera.bottom = -18;
  scene.add(dirLight);

  // Factory Floor & Architectural Framing
  const floorGeo = new THREE.PlaneGeometry(56, 28);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x18231d,
    roughness: 0.85,
    metalness: 0.12,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(56, 56, 0x2d4a3a, 0x1e3328);
  grid.position.y = 0.01;
  scene.add(grid);

  // Safety walkway & conveyor spine connecting all 5 stations
  const walkway = new THREE.Mesh(
    new THREE.BoxGeometry(38, 0.03, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x26382e, roughness: 0.7 })
  );
  walkway.position.set(0, 0.015, 3.4);
  walkway.receiveShadow = true;
  scene.add(walkway);

  const spineBelt = new THREE.Mesh(
    new THREE.BoxGeometry(34, 0.25, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.4 })
  );
  spineBelt.position.set(0, 0.55, 0);
  spineBelt.castShadow = true;
  spineBelt.receiveShadow = true;
  scene.add(spineBelt);

  // Structural steel bay pillars along back wall
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x24342c, metalness: 0.6, roughness: 0.4 });
  for (let px = -22; px <= 22; px += 8) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 7.5, 0.45), pillarMat);
    pillar.position.set(px, 3.75, -6.5);
    pillar.castShadow = true;
    scene.add(pillar);
  }
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(52, 7.5, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x111c16, roughness: 0.9 })
  );
  backWall.position.set(0, 3.75, -6.8);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Interactive & Animated Mesh Collections
  const clickableTargets = [];
  const hotspotRings = [];
  const witheringFans = [];
  const rollerDrums = [];
  const intakeCrates = [];
  const dryerHeaters = [];
  const warehouseBoxes = [];
  const stationBeacons = new Map();
  const labelAnchors = new Map();

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.72, roughness: 0.28 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.35 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.78, roughness: 0.24 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.85 });

  function makeHotspot(station) {
    const ringGeo = new THREE.RingGeometry(0.65, 0.92, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: station.accent,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(station.x, 0.04, 3.4);
    ring.userData.stationId = station.id;
    scene.add(ring);
    hotspotRings.push(ring);
    clickableTargets.push(ring);

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 24),
      new THREE.MeshBasicMaterial({
        color: station.accent,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
      })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(station.x, 0.035, 3.4);
    disc.userData.stationId = station.id;
    scene.add(disc);
    clickableTargets.push(disc);
  }

  function registerStationHitbox(group, stationId, labelPos) {
    // Add industrial stack-light beacon (green normal / red alarm trip)
    const st = FACTORY_STATIONS.find((s) => s.id === stationId);
    if (st) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.35, 10),
        darkMetalMat
      );
      pole.position.set(st.x + 2.1, 0.7, 1.7);
      group.add(pole);

      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x16a34a,
        emissiveIntensity: 1.4,
        roughness: 0.25,
      });
      const beaconMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.34, 16),
        beaconMat
      );
      beaconMesh.position.set(st.x + 2.1, 1.48, 1.7);
      group.add(beaconMesh);
      stationBeacons.set(stationId, { mesh: beaconMesh, mat: beaconMat });
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
  }

  // 1. Leaf Intake Dock
  {
    const st = FACTORY_STATIONS[0];
    const g = new THREE.Group();
    const dockPad = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.4, 4.2), darkMetalMat);
    dockPad.position.set(st.x, 0.2, 0);
    g.add(dockPad);

    const hopper = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.55, 1.5, 6), metalMat);
    hopper.position.set(st.x + 1.0, 1.55, 0);
    g.add(hopper);

    const scalePost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.9, 0.18), metalMat);
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
    registerStationHitbox(g, st.id, new THREE.Vector3(st.x, 2.75, 0));
  }

  // 2. Withering Troughs
  {
    const st = FACTORY_STATIONS[1];
    const g = new THREE.Group();
    for (const tz of [-1.25, 1.25]) {
      const trough = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 1.5), metalMat);
      trough.position.set(st.x, 0.65, tz);
      g.add(trough);

      const leafBed = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.14, 1.28), leafMat);
      leafBed.position.set(st.x, 1.15, tz);
      g.add(leafBed);

      const shroud = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 0.4, 18),
        darkMetalMat
      );
      shroud.rotation.z = Math.PI / 2;
      shroud.position.set(st.x - 2.75, 0.75, tz);
      g.add(shroud);

      const fanGroup = new THREE.Group();
      fanGroup.position.set(st.x - 2.98, 0.75, tz);
      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.85, 0.16),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.4, roughness: 0.3 })
        );
        blade.rotation.x = (b * Math.PI) / 4;
        fanGroup.add(blade);
      }
      g.add(fanGroup);
      witheringFans.push(fanGroup);
    }

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(g, st.id, new THREE.Vector3(st.x, 2.45, 0));
  }

  // 3. Rolling & Oxidation
  {
    const st = FACTORY_STATIONS[2];
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 4.0), darkMetalMat);
    base.position.set(st.x, 0.175, 0);
    g.add(base);

    for (const rx of [-1.2, 1.2]) {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), metalMat);
      stand.position.set(st.x + rx, 0.9, -0.7);
      g.add(stand);

      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.15, 20), brassMat);
      drum.position.set(st.x + rx, 1.75, -0.7);
      g.add(drum);
      rollerDrums.push(drum);
    }

    const oxTable = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.7, 1.1), metalMat);
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
    registerStationHitbox(g, st.id, new THREE.Vector3(st.x, 2.75, 0));
  }

  // 4. Dryer Line
  {
    const st = FACTORY_STATIONS[3];
    const g = new THREE.Group();
    const chamber = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.2, 2.4), darkMetalMat);
    chamber.position.set(st.x, 1.1, 0);
    g.add(chamber);

    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 2.4, 16), metalMat);
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

    const dryerGlow = new THREE.PointLight(0xf97316, 2.4, 9);
    dryerGlow.position.set(st.x, 1.4, 1.8);
    g.add(dryerGlow);
    dryerHeaters.push(dryerGlow);

    scene.add(g);
    makeHotspot(st);
    registerStationHitbox(g, st.id, new THREE.Vector3(st.x, 3.1, 0));
  }

  // 5. Packaging & Warehouse
  {
    const st = FACTORY_STATIONS[4];
    const g = new THREE.Group();
    const rackBase = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.22, 4.4), darkMetalMat);
    rackBase.position.set(st.x, 0.11, 0);
    g.add(rackBase);

    const packer = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.4), metalMat);
    packer.position.set(st.x - 1.8, 1.12, 0);
    g.add(packer);

    const boxGeo = new THREE.BoxGeometry(0.68, 0.52, 0.68);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xc28e5c, roughness: 0.75 });
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
    registerStationHitbox(g, st.id, new THREE.Vector3(st.x, 2.85, 0));
  }

  // Floating 3D HTML Labels
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
    if (Math.hypot(dx, dy) > 6) return; // Ignore camera drag

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
    labelMetrics: {},
  };

  function updateSimulationState(next) {
    Object.assign(simState, next);
    if (next.stationAlarms) {
      simState.stationAlarms = { ...simState.stationAlarms, ...next.stationAlarms };
    }
    for (const [id, text] of Object.entries(simState.labelMetrics)) {
      const el = labelEls.get(id)?.querySelector('.label-metric');
      if (el) el.textContent = text;
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

    if (simState.playing) {
      simTime += dt * simState.speed * simState.throughputScale;

      // 1. Leaf crates sliding into Intake Dock
      const intakeFactor = simState.stationAlarms.intake ? 0.0 : simState.intakeSpeedScale;
      intakeCrates.forEach((crate) => {
        const cycle = (simTime * 0.35 * intakeFactor + crate.userData.phase) % 1;
        crate.position.x = crate.userData.baseX + cycle * 4.4;
      });

      // 2. Withering fans spinning
      const fanFactor = simState.stationAlarms.withering ? 0.0 : (simState.witheringFanSpeedPct / 75.0);
      witheringFans.forEach((fan, idx) => {
        fan.rotation.x += dt * 7.5 * simState.speed * simState.throughputScale * fanFactor * (idx === 0 ? 1 : -1);
      });

      // 3. Orthodox rollers rotating
      const rollFactor = simState.stationAlarms.rolling ? 0.0 : simState.rollingSpeedScale;
      rollerDrums.forEach((drum, idx) => {
        drum.rotation.y += dt * 2.8 * simState.speed * simState.throughputScale * rollFactor * (idx === 0 ? 1 : -1);
      });

      // 4. Dryer heating elements pulsing
      const dryerSafe = simState.plcSafe && !simState.stationAlarms.dryer;
      const tempFactor = Math.max(0.3, simState.dryerTempSpDegC / 95.0);
      const utilFactor = Math.max(0.25, simState.dryerUtilPct / 50) * tempFactor;
      const pulse = 0.8 + 0.4 * Math.sin(simTime * 4.0);
      dryerHeaters.forEach((item) => {
        if (item.isPointLight) {
          item.intensity = dryerSafe ? 2.2 * utilFactor * pulse : 0.2;
        } else if (item.material) {
          item.material.emissiveIntensity = dryerSafe ? 1.2 * utilFactor * pulse : 0.08;
        }
      });

      // 5. Warehouse boxes subtle breathing / conveyor stack arrival
      warehouseBoxes.forEach((box) => {
        if (box.visible && box.userData.index >= 12) {
          box.position.y = 0.48 + Math.floor(box.userData.index / 6) * 0.55 + Math.sin(simTime * 2 + box.userData.index) * 0.012;
        }
      });
    }

    // Update station stack-light beacons (green normal / flashing red alarm trip)
    const strobe = 0.9 + 0.8 * Math.abs(Math.sin(now * 0.009));
    stationBeacons.forEach(({ mat }, id) => {
      const isAlarm = Boolean(simState.stationAlarms[id]) || (id === 'dryer' && !simState.plcSafe);
      if (isAlarm) {
        mat.color.setHex(0xef4444);
        mat.emissive.setHex(0xdc2626);
        mat.emissiveIntensity = strobe * 2.0;
      } else {
        mat.color.setHex(0x22c55e);
        mat.emissive.setHex(0x16a34a);
        mat.emissiveIntensity = 1.25;
      }
    });

    // Pulse floor hotspot rings
    hotspotRings.forEach((ring, idx) => {
      const s = 1 + 0.08 * Math.sin(now * 0.004 + idx);
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

    // Project floating 3D station labels
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
  }

  rafId = requestAnimationFrame(animate);

  return {
    focusStation,
    updateSimulationState,
    dispose() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    },
  };
}
