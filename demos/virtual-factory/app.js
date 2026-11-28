import { initDemoTour } from '../../shared/js/demo-tour.js?v=20261202';

const DEFAULT_STATIONS = [
  { id: 'intake', name: '1. Raw Leaf Reception & Diverter', shortName: 'Room 01: Intake' },
  { id: 'withering', name: '2. Climate-Controlled Withering Hall', shortName: 'Room 02: Withering' },
  { id: 'rolling', name: '3. Fixation, Rolling & Oxidation Room', shortName: 'Room 03: Rolling' },
  { id: 'dryer', name: '4. Thermal Drying Room (ATEX Zone 22)', shortName: 'Room 04: Dryer' },
  { id: 'sorting', name: '5. Vibratory Grading & Optical Sorting', shortName: 'Room 05: Sorting' },
  { id: 'warehouse', name: '6. Cleanroom Weigh-Fill & Foil Packaging', shortName: 'Room 06: Packaging' },
];
let stationsList = DEFAULT_STATIONS;

const STATION_SPECS = {
  intake: {
    guide: 'Room 01 (SC-01, DV-01A/B): Weighs raw shoots and splits flow between Path 1 (01→02 Golden Tea buffer) and Path 2 (01→03 Green Tea direct bypass).',
    equipmentSpec: [
      { k: 'PLC / I/O', v: 'Siemens S7-1214C DC/DC/DC · SM 1231 AI' },
      { k: 'Load Cell & Diverters', v: 'Mettler Toledo SC-01 · Pneumatic DV-01A/B' },
      { k: 'Drive / Motor', v: '1.5 kW Intake Conveyor + Bypass Belt' },
      { k: 'Electrical', v: '400V 3-Ph / 24V DC Solenoids · IP65' },
    ],
    hardware: ['PROFINET / Modbus TCP', 'SQLite Lot Genealogy'],
    language: 'Ladder Logic (LAD) + SQL Recursive CTE',
    codeLabel: 'Intake Weighbridge & DV-01A/B Diverter Logic',
    fallbackCode: `(* Dual-Path Diverter DV-01A/B Priority Interlock *)\nIF bGateClosed AND (rGrossKg > rTareKg) THEN\n  rNetLeafKg := rGrossKg - rTareKg;\n  bDiverterDV01A := TRUE; (* Feed Room 02 Golden Buffer *)\n  bDiverterDV01B := NOT bGoldenBatchReady; (* Pause Bypass on Handover *)\nEND_IF;`,
  },
  withering: {
    guide: 'Room 02 (T-01..04, FN-01..04): Accumulates Golden Tea leaf up to 250 kg (rWitheringBufferKg). Click "Force Golden Batch Ready (02→03)" to trigger priority handover.',
    equipmentSpec: [
      { k: 'PLC / I/O', v: 'Siemens S7-1511-1 PN · ET200SP Remote I/O' },
      { k: 'VFD & Motors', v: '4× SINAMICS G120 (FN-01..04, 2.2 kW Axial)' },
      { k: 'Sensors', v: 'Capacitive Moisture (%IW70) · Load Buffer (250 kg)' },
      { k: 'Electrical', v: '400V 3-Ph · PROFINET %QW64' },
    ],
    hardware: ['SINAMICS G120 (%QW64)', 'PROFINET IO'],
    language: 'IEC 61131-3 Structured Text (ST)',
    codeLabel: 'plc/FB_WitheringAirflowControl.st',
    stPath: '../../plc/FB_WitheringAirflowControl.st',
    fallbackCode: `FUNCTION_BLOCK FB_WitheringAirflowControl\n(* Scaled %IW70 moisture -> %QW64 VFD cutoff at 65% target *)\nIF rWitheringBufferKg >= 250.0 THEN\n  bGoldenBatchReady := TRUE;\nEND_IF;`,
  },
  rolling: {
    guide: 'Room 03 (RL-01..02): Processes Green Tea bypass (Path 2) continuously until Room 02 signals bGoldenBatchReady (Path 3 priority handover).',
    equipmentSpec: [
      { k: 'PLC / I/O', v: 'Siemens S7-1511-1 PN · Safety Relay 3SK1' },
      { k: 'Drives & Motors', v: '2× 5.5 kW Orthodox Brass Roller Geared Motors' },
      { k: 'Instrumentation', v: 'Pneumatic Pressure Regulator (0–6 bar) + RH%' },
      { k: 'Electrical', v: '400V 3-Ph · 6 bar Compressed Air · IP54' },
    ],
    hardware: ['OPC UA / SFC', 'Priority Handover Interlock'],
    language: 'Sequential Function Chart (SFC) / ST',
    codeLabel: 'Rolling & Oxidation Priority Sequence (SFC/ST)',
    fallbackCode: `(* Priority Handover: Pause Path 2 (01->03) when bGoldenBatchReady *)\nIF bGoldenBatchReady THEN\n  eActiveLine := LINE_GOLDEN_HANDOVER;\n  bDiverterDV01B := FALSE;\nELSE\n  eActiveLine := LINE_GREEN_BYPASS;\nEND_IF;`,
  },
  dryer: {
    guide: 'Room 04 (DR-01, ATEX Zone 22): Fires leaves to 3% moisture. Test Over-Temp (>115°C) or Airflow Loss (FS-401) to verify %Q3.1 safety trip.',
    equipmentSpec: [
      { k: 'Fail-Safe PLC', v: 'Siemens S7-1512SP F-1 PN (SIL 2 / PL d)' },
      { k: 'Sensors', v: '2× PT100 RTD (TT-401/402, %IW60) · FS-401 (%I3.0)' },
      { k: 'Heater Control', v: '3-Ph SCR Thyristor (%QW60, 36 kW) + Exhaust Stack' },
      { k: 'ATEX Rating', v: 'ATEX Zone 22 (Ex tc IIIB T135°C Dc) · Dust-Tight' },
    ],
    hardware: ['PROFINET PROFIsafe', 'Hardwired E-Stop Loop'],
    language: 'IEC 61131-3 Structured Text (ST)',
    codeLabel: 'plc/FB_DryerSafetyControl.st',
    stPath: '../../plc/FB_DryerSafetyControl.st',
    fallbackCode: `FUNCTION_BLOCK FB_DryerSafetyControl\n(* Enforces %I3.0 fan proof & 115C/140C runaway cut *)\nIF bSafetyFaultActive THEN\n  bAlarmLatched := TRUE; rHeatCmdPercent := 0.0;\nEND_IF;`,
  },
  sorting: {
    guide: 'Room 05 (GR-01, OS-01, RJ-01): Multi-deck vibratory grader and RGB optical color sorter divert stalks and scorched dust into Reject Bin RJ-01.',
    equipmentSpec: [
      { k: 'PLC / Vision', v: 'Siemens S7-1215C · Optical Sorter OS-01 Controller' },
      { k: 'Grader & Sorter', v: 'GR-01 4-Deck Vibratory + RGB Line-Scan & Air-Jet Manifold' },
      { k: 'Reject Handling', v: 'RJ-01 Pneumatic Reject Bin · Load Cell Weigher' },
      { k: 'Electrical', v: '400V 3-Ph + 7 bar Dry Instrument Air · IP65' },
    ],
    hardware: ['PROFINET Vision', 'High-Speed Air-Jet Ejectors'],
    language: 'IEC 61131-3 ST · Quality Gate',
    codeLabel: 'Optical Sorter OS-01 & Reject Alarm ALM-502',
    fallbackCode: `(* Room 05 Optical Color Sorter Quality Gate *)\nrRejectRatePct := (rRejectedKg / MAX(1.0, rAcceptedKg + rRejectedKg)) * 100.0;\nIF rRejectRatePct > 8.0 THEN\n  bAlm502OpticalSpike := TRUE; (* ISA-18.2 Warning *)\nEND_IF;`,
  },
  warehouse: {
    guide: 'Room 06 (PK-01): Cleanroom weigh-fill seals clean graded tea into 250g kraft-and-foil pouches. Toggle Pre-Winter Buffer (400 kg) or dispatch orders.',
    equipmentSpec: [
      { k: 'PLC / Cell', v: 'Siemens S7-1215C · Weigh-Fill & Foil Sealer PK-01' },
      { k: 'Instrumentation', v: 'Checkweigher PK-01 · Barcode/RFID Lot Scanner' },
      { k: 'Environment', v: 'Cleanroom Dehumidifier (<55% RH) · HEPA Intake' },
      { k: 'Electrical', v: '230V/400V · OPC UA / REST + SimPy DES' },
    ],
    hardware: ['OPC UA / REST Telemetry', 'SimPy DES Engine'],
    language: 'Python DES + SQL Recursive CTE',
    codeLabel: 'sim/factory_des.py · Winter Buffer & Dispatch',
    fallbackCode: `# Pre-winter buffer protection (Aug-Oct build)\nif not in_winter and inv_mode == "buffer":\n    reserved = max(safety_stock, buffer_target * progress)\n    available_for_sale = max(0.0, state.finished_goods_kg - reserved)\nfulfilled_kg = min(demand_kg, available_for_sale)`,
  },
};

const FALLBACK_SNAPSHOT = {
  generatedAt: null,
  overallStatus: 'FALLBACK',
  checks: {
    db: {
      command: 'python db/verify.py',
      passed: true,
      durationSeconds: 0,
      output: ['Local mock fallback: SQLite schema, recursive CTE genealogy, and FK/CHECK constraints.'],
    },
    plc: {
      command: 'python plc/plc_verify.py',
      passed: true,
      durationSeconds: 0,
      output: ['Local mock fallback: FB_DryerSafetyControl.st & FB_WitheringAirflowControl.st verified.'],
    },
    sim: {
      command: 'python sim/policies.py --seed 42 --replications 1000',
      passed: true,
      durationSeconds: 0,
    },
  },
  simulation: {
    benchmarkMetadata: { seed: 42, replications: 1000 },
    policies: {
      fixed_standard: {
        label: 'Policy A1: Fixed Staffing + Standard Inventory (Baseline)',
        kpis: {
          operationalKpis: { annualFreshLeafProcessedKg: 41775.6, annualFinishedTeaProducedKg: 10443.9, averageDryerUtilizationPct: 41.4 },
          winterDormancyResilience: { winterStockoutDays: 59, winterOrderFulfillmentPct: 50.8, minimumWinterCashBalanceBdt: -1933542 },
          laborAndCostingKpis: { totalWorkerIdleHours: 14480.4, averageAbsorptionCostBdtPerKg: 402.06 },
        },
      },
      fixed_buffer: {
        label: 'Policy A2: Fixed Staffing + Pre-Winter Buffer (400 kg)',
        kpis: {
          operationalKpis: { annualFreshLeafProcessedKg: 41775.6, annualFinishedTeaProducedKg: 10443.9, averageDryerUtilizationPct: 41.4 },
          winterDormancyResilience: { winterStockoutDays: 59, winterOrderFulfillmentPct: 50.8, minimumWinterCashBalanceBdt: -1946542 },
          laborAndCostingKpis: { totalWorkerIdleHours: 14480.4, averageAbsorptionCostBdtPerKg: 402.06 },
        },
      },
      seasonal_standard: {
        label: 'Policy B1: Seasonal Staffing + Standard Inventory',
        kpis: {
          operationalKpis: { annualFreshLeafProcessedKg: 41775.6, annualFinishedTeaProducedKg: 10443.9, averageDryerUtilizationPct: 41.4 },
          winterDormancyResilience: { winterStockoutDays: 59, winterOrderFulfillmentPct: 50.8, minimumWinterCashBalanceBdt: -1470002 },
          laborAndCostingKpis: { totalWorkerIdleHours: 9664.4, averageAbsorptionCostBdtPerKg: 357.68 },
        },
      },
      seasonal_buffer: {
        label: 'Policy B2: Seasonal Staffing + Pre-Winter Buffer (400 kg)',
        kpis: {
          operationalKpis: { annualFreshLeafProcessedKg: 41775.6, annualFinishedTeaProducedKg: 10443.9, averageDryerUtilizationPct: 41.4 },
          winterDormancyResilience: { winterStockoutDays: 59, winterOrderFulfillmentPct: 50.8, minimumWinterCashBalanceBdt: -1483002 },
          laborAndCostingKpis: { totalWorkerIdleHours: 9664.4, averageAbsorptionCostBdtPerKg: 357.68 },
        },
      },
    },
  },
};

let factorySnapshot = FALLBACK_SNAPSHOT;
let snapshotIsLive = false;
let activePolicyKey = 'seasonal_buffer';
let activeStationId = 'overview';
let isPlaying = true;
let simSpeed = 1.0;
let isaTagsVisible = true;
const THEME_STORAGE_KEY = 'pancharupa-hmi-theme';
let currentTheme = (() => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
})();
let scene3d = null;
let renderLeafSwatchFn = null;
const stCodeCache = {};

const LEAF_STAGE_SPECS = {
  intake: {
    moisture: '78% (Fresh)',
    texture: 'Turgid serrated leaf + silvery bud',
    state: 'DV-01A/B Dual-Path Split',
  },
  withering: {
    moisture: '68% (Withered)',
    texture: 'Limp, folded olive-green',
    state: 'Golden Tea Buffer (250 kg)',
  },
  rolling: {
    moisture: '65% (Oxidized)',
    texture: 'Twisted glossy copper-brown / emerald',
    state: 'Path 2 Green / Path 3 Golden',
  },
  dryer: {
    moisture: '3% (Fired)',
    texture: 'Crisp curled black + golden tips',
    state: 'Hot-air fired · TT-401',
  },
  sorting: {
    moisture: '3.0% (Sorted)',
    texture: 'Clean tea vs. pale/scorched rejects',
    state: 'GR-01 + OS-01 → RJ-01 Bin',
  },
  warehouse: {
    moisture: '3.0% (Packaged)',
    texture: 'Graded BOP/OP + golden tips',
    state: 'Sealed 250g Kraft-Foil',
  },
};

function applyTheme(mode, persist = true) {
  currentTheme = mode === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = currentTheme === 'light' ? 'Dark Mode' : 'Light Mode';
  }
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    } catch {
      // Ignore storage errors
    }
  }
  if (scene3d?.setTheme) {
    scene3d.setTheme(currentTheme);
  }
}

// Interactive Operator HMI, Dual-Path Routing, Optical Sorting & ISA-18.2 Alarm State
const hmiState = {
  operatingMode: 'normal', // 'normal' | 'winter'
  controlMode: 'AUTO', // 'AUTO' | 'MANUAL'
  intakeDeltaKg: 0,
  intakeQuarantine: false,
  witheringBufferKg: 145.0, // Accumulates to 250 kg threshold for Golden Tea handover
  bGoldenBatchActive: false, // XOR interlock: TRUE = Path 3 (02->03) ONLY, Path 2 (01->03) PAUSED
  witherFanSpeedPct: 75,
  witherTargetMoisturePct: 65,
  witherSensorFault: false,
  rollPressureBar: 2.8,
  rollTimerMin: 35,
  dryerTempSpDegC: 95,
  rInletTempDegC: 95.0,
  dryerTripped: false,
  airflowLossFault: false,
  bSafetyTrip: false,
  rRejectRatePct: 3.2,
  rRejectedKg: 14.4,
  rAcceptedKg: 435.6,
  rejectSpikeActive: false,
  warehouseDispatchedKg: 0,
};

// ISA-18.2 Alarm Registry
const alarmList = new Map();

function formatTime(date = new Date()) {
  return date.toTimeString().slice(0, 8);
}

function syncAlarms() {
  const manageAlarm = (tag, active, severity, message) => {
    if (active) {
      if (!alarmList.has(tag)) {
        alarmList.set(tag, {
          tag,
          severity,
          message,
          timestamp: formatTime(),
          acked: false,
        });
      }
    } else {
      alarmList.delete(tag);
    }
  };

  manageAlarm(
    'TT-401',
    hmiState.dryerTripped,
    'CRITICAL',
    `Dryer DR-01 Over-Temp Trip (${hmiState.rInletTempDegC.toFixed(1)} °C > 115 °C) · %QW60=0%`
  );
  manageAlarm(
    'FS-401',
    hmiState.airflowLossFault,
    'CRITICAL',
    'Dryer Airflow Proof Loss (%I3.0=FALSE) · Safety Latch Engaged'
  );
  manageAlarm(
    'MT-201',
    hmiState.witherSensorFault,
    'HIGH',
    'Withering Moisture Probe Out-of-Range (%Q3.3) · VFD Fan %QW64=0'
  );
  manageAlarm(
    'ALM-502',
    hmiState.rejectSpikeActive,
    'WARNING',
    `ALM-502: Optical Sorter Reject Rate > 8.0% (${hmiState.rRejectRatePct.toFixed(1)}%) · Diverting to RJ-01`
  );
  manageAlarm(
    'QI-101',
    hmiState.intakeQuarantine,
    'WARNING',
    'Intake Quarantine Gate Active (%Q1.0=FALSE) · Hopper Locked'
  );

  renderAlarmBanner();
}

function renderAlarmBanner() {
  const strip = document.getElementById('isaAlarmStrip');
  const pill = document.getElementById('alarmPriorityPill');
  const tagEl = document.getElementById('alarmTagId');
  const tsEl = document.getElementById('alarmTimestamp');
  const msgEl = document.getElementById('alarmMessage');
  const countEl = document.getElementById('alarmCountBadge');
  const ackBtn = document.getElementById('btnAckAlarm');
  if (!strip) return;

  const alarms = Array.from(alarmList.values());
  if (alarms.length === 0) {
    strip.className = 'isa-alarm-strip isa-alarm-strip--nominal';
    pill.className = 'alarm-pill alarm-pill--nominal';
    pill.textContent = hmiState.operatingMode === 'winter' ? 'STANDBY · WINTER' : 'ISA-18.2 NOMINAL';
    tagEl.textContent = 'SYS-00';
    tsEl.textContent = '--:--:--';
    msgEl.textContent =
      hmiState.operatingMode === 'winter'
        ? 'Winter Dormancy (Jan–Feb) · Rooms 01–05 in standby · Drawing from 400 kg buffer'
        : 'All safety & quality interlocks satisfied · Click any room or press 1–6 to inspect';
    countEl.textContent = '0 Active';
    ackBtn.disabled = true;
    return;
  }

  const priorityRank = { CRITICAL: 3, HIGH: 2, WARNING: 1 };
  alarms.sort((a, b) => (priorityRank[b.severity] || 0) - (priorityRank[a.severity] || 0));
  const top = alarms[0];
  const anyUnacked = alarms.some((a) => !a.acked);

  strip.className = `isa-alarm-strip ${
    anyUnacked ? 'isa-alarm-strip--unacked' : 'isa-alarm-strip--acked'
  }`;
  pill.className = `alarm-pill alarm-pill--${top.severity.toLowerCase()}`;
  pill.textContent = `${top.severity}${top.acked ? ' · ACK' : ' · UNACK'}`;
  tagEl.textContent = top.tag;
  tsEl.textContent = top.timestamp;
  msgEl.textContent = top.message;
  countEl.textContent = `${alarms.length} Active`;
  ackBtn.disabled = !anyUnacked;
}

async function loadFactorySnapshot() {
  try {
    const res = await fetch('../../shared/data/factory-snapshot.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = await res.json();
    if (!parsed?.checks || !parsed?.simulation?.policies) {
      throw new Error('Incomplete factory-snapshot.json payload');
    }
    factorySnapshot = parsed;
    snapshotIsLive = true;
  } catch (err) {
    console.warn('Using local fallback snapshot (factory-snapshot.json unavailable):', err);
    factorySnapshot = FALLBACK_SNAPSHOT;
    snapshotIsLive = false;
  }
}

async function loadStCode(stationId) {
  const spec = STATION_SPECS[stationId];
  if (!spec?.stPath) return spec?.fallbackCode || '';
  if (stCodeCache[stationId]) return stCodeCache[stationId];
  try {
    const res = await fetch(spec.stPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    stCodeCache[stationId] = text;
    return text;
  } catch {
    return spec.fallbackCode;
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightStCode(raw) {
  const escaped = escapeHtml(raw);
  return escaped
    .replace(/(\(\*[\s\S]*?\*\))/g, '<span class="st-comment">$1</span>')
    .replace(/(%[IQM][XBWD]?\d+(?:\.\d+)?)/g, '<span class="st-addr">$1</span>')
    .replace(/\b(FUNCTION_BLOCK|END_FUNCTION_BLOCK|VAR_INPUT|VAR_OUTPUT|VAR_TEMP|VAR|END_VAR|IF|THEN|ELSE|ELSIF|END_IF|CASE|OF|END_CASE|AT|AND|OR|NOT|TRUE|FALSE)\b/g, '<span class="st-kw">$1</span>')
    .replace(/\b(BOOL|INT|REAL|WORD|TIME|TON)\b/g, '<span class="st-type">$1</span>');
}

function getActivePolicyData() {
  const policies = factorySnapshot.simulation?.policies || {};
  return policies[activePolicyKey] || policies.seasonal_buffer || Object.values(policies)[0];
}

function computeDerivedPlcTags() {
  const isWinter = hmiState.operatingMode === 'winter';
  hmiState.bSafetyTrip = hmiState.dryerTripped || hmiState.airflowLossFault;

  const effectiveFanPct =
    isWinter || hmiState.witherSensorFault || hmiState.airflowLossFault
      ? 0
      : hmiState.witherFanSpeedPct;
  const nFanSpeedRef = Math.round((effectiveFanPct / 100) * 27648);

  if (hmiState.dryerTripped) {
    hmiState.rInletTempDegC = Math.max(122.4, hmiState.dryerTempSpDegC + 25);
  } else if (isWinter) {
    hmiState.rInletTempDegC = 22.0;
  } else {
    hmiState.rInletTempDegC = Number(hmiState.dryerTempSpDegC);
  }

  return { isWinter, effectiveFanPct, nFanSpeedRef };
}

function renderHudAnd3D() {
  const policy = getActivePolicyData();
  const op = policy?.kpis?.operationalKpis || {};
  const wr = policy?.kpis?.winterDormancyResilience || {};
  const { isWinter, effectiveFanPct, nFanSpeedRef } = computeDerivedPlcTags();
  const plcPassed = Boolean(factorySnapshot.checks?.plc?.passed) && !hmiState.bSafetyTrip;

  const leafKg = isWinter
    ? 0
    : Number(op.annualFreshLeafProcessedKg ?? 41775.6) + hmiState.intakeDeltaKg;
  const dryKg = Number(op.annualFinishedTeaProducedKg ?? 10443.9);
  const dryerUtil = isWinter ? 0.0 : Number(op.averageDryerUtilizationPct ?? 41.4);
  const isBuffer = activePolicyKey.includes('buffer');
  const stockKg = Math.max(
    0,
    (isBuffer ? 400 + Math.round(dryKg * 0.04) : Math.round(dryKg * 0.02)) -
      hmiState.warehouseDispatchedKg
  );

  const routeSummary = isWinter
    ? 'STANDBY (Winter)'
    : hmiState.bGoldenBatchActive
      ? 'Path 3 · Golden (02→03) [01→03 PAUSED]'
      : 'Path 1+2 · Green Bypass (01→03)';

  const station = stationsList.find((s) => s.id === activeStationId);
  document.getElementById('hudActiveRoute').textContent = routeSummary;
  document.getElementById('hudLeafIntake').textContent = isWinter
    ? '0 kg/day (Dormancy)'
    : `${Math.round(leafKg).toLocaleString()} kg/yr`;
  document.getElementById('hudActiveStage').textContent = station
    ? station.shortName
    : 'Plant Overview (6 Rooms)';

  // Mode & tactile buttons state
  const btnNormal = document.getElementById('btnModeNormal');
  const btnWinter = document.getElementById('btnModeWinter');
  if (btnNormal && btnWinter) {
    btnNormal.classList.toggle('hmi-btn-primary', !isWinter);
    btnWinter.classList.toggle('hmi-btn-primary', isWinter);
  }
  const btnRun = document.getElementById('btnCmdRun');
  const btnStop = document.getElementById('btnCmdStop');
  if (btnRun && btnStop) {
    btnRun.classList.toggle('hmi-btn-primary', isPlaying);
    btnStop.classList.toggle('hmi-btn-danger', !isPlaying);
  }
  const btnAutoManual = document.getElementById('btnCmdAutoManual');
  if (btnAutoManual) {
    btnAutoManual.textContent = `MODE: ${hmiState.controlMode}`;
  }

  // Telemetry inside left panel
  if (station) {
    document.getElementById('leftPanelTitle').textContent = station.name;
    document.getElementById('leafSpecRoute').textContent =
      activeStationId === 'sorting'
        ? `Reject ${hmiState.rRejectRatePct.toFixed(1)}% (${hmiState.rRejectedKg.toFixed(1)} kg)`
        : routeSummary;
    document.getElementById('inspWitherBuffer').textContent = `${hmiState.witheringBufferKg.toFixed(0)} / 250 kg`;
    document.getElementById('inspRouteState').textContent = routeSummary;
    document.getElementById('inspRejectRate').textContent = `${hmiState.rRejectRatePct.toFixed(1)}% (${hmiState.rRejectedKg.toFixed(1)} kg rej)`;
    document.getElementById('inspPlcState').textContent =
      plcPassed && !hmiState.witherSensorFault ? 'SAFE · INTERLOCK OK' : 'TRIP / FAULT LATCHED';
    document.getElementById('inspFinishedStock').textContent = `${stockKg.toLocaleString()} kg`;
  }

  // Header status pill
  const headerPill = document.getElementById('snapshotHeaderPill');
  if (snapshotIsLive && factorySnapshot.overallStatus === 'PASS') {
    headerPill.textContent = 'ALL LAYERS PASS';
    headerPill.className = 'status-pill status-pill--pass';
  } else if (!snapshotIsLive) {
    headerPill.textContent = 'FALLBACK';
    headerPill.className = 'status-pill status-pill--fallback';
  } else {
    headerPill.textContent = factorySnapshot.overallStatus || 'FAIL';
    headerPill.className = 'status-pill status-pill--fail';
  }

  syncAlarms();

  // Update 3D Scene
  if (scene3d) {
    const throughputScale = activePolicyKey.startsWith('seasonal') ? 1.15 : 0.95;
    const dailyIntake = isWinter ? 0 : Math.round(leafKg / 306);
    scene3d.updateSimulationState({
      playing: isPlaying,
      speed: simSpeed,
      throughputScale,
      operatingMode: hmiState.operatingMode,
      goldenHandoverActive: hmiState.bGoldenBatchActive,
      witheringBufferKg: hmiState.witheringBufferKg,
      rejectSpikeActive: hmiState.rejectSpikeActive,
      rejectRatePct: hmiState.rRejectRatePct,
      dryerUtilPct: dryerUtil,
      dryerTempSpDegC: hmiState.rInletTempDegC,
      witheringFanSpeedPct: effectiveFanPct,
      rollingSpeedScale: hmiState.rollPressureBar / 2.8,
      intakeSpeedScale: hmiState.intakeQuarantine || isWinter ? 0 : 1.0,
      plcSafe: plcPassed,
      bufferMode: isBuffer,
      stationAlarms: {
        intake: hmiState.intakeQuarantine,
        withering: hmiState.witherSensorFault || hmiState.airflowLossFault,
        rolling: false,
        dryer: hmiState.bSafetyTrip,
        sorting: false,
        warehouse: false,
      },
      stationStandby: {
        intake: isWinter,
        withering: isWinter,
        rolling: isWinter,
        dryer: isWinter,
        sorting: isWinter,
        warehouse: false,
      },
      labelMetrics: {
        intake: hmiState.intakeQuarantine
          ? 'QUARANTINE HOLD'
          : isWinter
            ? 'WINTER STANDBY · 0 kg/d'
            : `${dailyIntake} kg/d · GREEN/GOLDEN SPLIT`,
        withering: hmiState.witherSensorFault
          ? '%Q3.3 SENSOR FAULT'
          : isWinter
            ? 'STANDBY · Fan 0%'
            : hmiState.bGoldenBatchActive
              ? `${Math.round(hmiState.witheringBufferKg)} / 250 kg · FEEDING R03 · 01→03 PAUSED`
              : `${Math.round(hmiState.witheringBufferKg)} / 250 kg`,
        rolling: isWinter
          ? 'STANDBY · Idle'
          : hmiState.bGoldenBatchActive
            ? 'ACTIVE: GOLDEN (02→03)'
            : 'ACTIVE: GREEN (01→03)',
        dryer: hmiState.bSafetyTrip
          ? '%Q3.1 SAFETY TRIP'
          : isWinter
            ? 'STANDBY · 22°C'
            : `${hmiState.rInletTempDegC.toFixed(0)}°C · 3% MOISTURE`,
        sorting: hmiState.rejectSpikeActive
          ? `ALM-502 · ${hmiState.rRejectRatePct.toFixed(1)}% REJECT → RJ-01`
          : `${hmiState.rRejectRatePct.toFixed(1)}% REJECT → RJ-01`,
        warehouse: `${stockKg.toLocaleString()} kg · 250g POUCHES`,
      },
      isaTagValues: {
        'SC-01': hmiState.intakeQuarantine ? 'HOLD' : `${dailyIntake} kg/d`,
        'FN-01': `${effectiveFanPct}% (${nFanSpeedRef})`,
        'RL-01': isWinter ? '0.0 bar' : `${hmiState.rollPressureBar.toFixed(1)} bar`,
        'TT-401': `${hmiState.rInletTempDegC.toFixed(1)} °C`,
        'OS-01': `${hmiState.rRejectRatePct.toFixed(1)}% Rej`,
        'PK-01': `${stockKg.toLocaleString()} kg`,
      },
    });
  }

  renderLivePlcVars();
}

function triggerGoldenHandover() {
  hmiState.witheringBufferKg = 250.0;
  hmiState.bGoldenBatchActive = true;
  renderHudAnd3D();
}

function triggerRejectSpike() {
  hmiState.rejectSpikeActive = true;
  hmiState.rRejectRatePct = 11.4;
  hmiState.rRejectedKg += 18.5;
  renderHudAnd3D();
}

function renderStationPanels() {
  if (activeStationId === 'overview') return;
  const spec = STATION_SPECS[activeStationId] || STATION_SPECS.intake;
  const leafSpec = LEAF_STAGE_SPECS[activeStationId] || LEAF_STAGE_SPECS.intake;
  document.getElementById('leafSpecMoisture').textContent = leafSpec.moisture;
  document.getElementById('leafSpecTexture').textContent = leafSpec.texture;
  document.getElementById('leafSpecState').textContent = leafSpec.state;
  if (renderLeafSwatchFn) {
    const swatchId =
      activeStationId === 'rolling' && !hmiState.bGoldenBatchActive
        ? 'rolling_green'
        : activeStationId;
    renderLeafSwatchFn(document.getElementById('leafStageSwatch'), swatchId);
  }
  document.getElementById('operatorGuideText').textContent = spec.guide;

  const hmiBox = document.getElementById('hmiControlsContainer');
  if (activeStationId === 'intake') {
    hmiBox.innerHTML = `
      <div class="hmi-btn-row">
        <button id="btnTriggerWeighIn" class="hmi-btn hmi-btn-primary" type="button">+40 kg Batch Weigh-In</button>
      </div>
      <label class="hmi-toggle-label">
        <span>Quarantine Gate Interlock (%Q1.0)</span>
        <input id="chkIntakeFault" type="checkbox" ${hmiState.intakeQuarantine ? 'checked' : ''}>
      </label>
    `;
    document.getElementById('btnTriggerWeighIn').addEventListener('click', () => {
      hmiState.intakeDeltaKg += 40;
      hmiState.witheringBufferKg = Math.min(250, hmiState.witheringBufferKg + 25);
      if (hmiState.witheringBufferKg >= 250) {
        triggerGoldenHandover();
      } else {
        renderHudAnd3D();
      }
    });
    document.getElementById('chkIntakeFault').addEventListener('change', (e) => {
      hmiState.intakeQuarantine = e.target.checked;
      renderHudAnd3D();
    });
  } else if (activeStationId === 'withering') {
    hmiBox.innerHTML = `
      <div class="hmi-control-row">
        <div class="hmi-control-row-header"><span>VFD Fan Speed (%QW64)</span><strong id="valWitherFan">${hmiState.witherFanSpeedPct}%</strong></div>
        <input id="sliderWitherFan" type="range" min="0" max="100" step="5" value="${hmiState.witherFanSpeedPct}">
      </div>
      <div class="hmi-control-row">
        <div class="hmi-control-row-header"><span>Target Moisture (rTargetMoisture)</span><strong id="valWitherTarget">${hmiState.witherTargetMoisturePct}%</strong></div>
        <input id="sliderWitherTarget" type="range" min="45" max="75" step="1" value="${hmiState.witherTargetMoisturePct}">
      </div>
      <div class="hmi-btn-row">
        <button id="btnRoomForceGolden" class="hmi-btn hmi-btn-primary" type="button">Force Golden Batch Ready (02→03)</button>
      </div>
      <label class="hmi-toggle-label">
        <span>Simulate Probe Fault (%Q3.3)</span>
        <input id="chkWitherFault" type="checkbox" ${hmiState.witherSensorFault ? 'checked' : ''}>
      </label>
    `;
    document.getElementById('sliderWitherFan').addEventListener('input', (e) => {
      hmiState.witherFanSpeedPct = Number(e.target.value);
      document.getElementById('valWitherFan').textContent = `${hmiState.witherFanSpeedPct}%`;
      renderHudAnd3D();
    });
    document.getElementById('sliderWitherTarget').addEventListener('input', (e) => {
      hmiState.witherTargetMoisturePct = Number(e.target.value);
      document.getElementById('valWitherTarget').textContent = `${hmiState.witherTargetMoisturePct}%`;
      renderHudAnd3D();
    });
    document.getElementById('btnRoomForceGolden').addEventListener('click', triggerGoldenHandover);
    document.getElementById('chkWitherFault').addEventListener('change', (e) => {
      hmiState.witherSensorFault = e.target.checked;
      renderHudAnd3D();
    });
  } else if (activeStationId === 'rolling') {
    hmiBox.innerHTML = `
      <div class="hmi-control-row">
        <div class="hmi-control-row-header"><span>Roller Pressure</span><strong id="valRollPressure">${hmiState.rollPressureBar.toFixed(1)} bar</strong></div>
        <input id="sliderRollPressure" type="range" min="1.0" max="5.0" step="0.2" value="${hmiState.rollPressureBar}">
      </div>
      <div class="hmi-control-row">
        <div class="hmi-control-row-header"><span>Cycle Timer</span><strong id="valRollTimer">${hmiState.rollTimerMin} min</strong></div>
        <input id="sliderRollTimer" type="range" min="15" max="60" step="5" value="${hmiState.rollTimerMin}">
      </div>
    `;
    document.getElementById('sliderRollPressure').addEventListener('input', (e) => {
      hmiState.rollPressureBar = Number(e.target.value);
      document.getElementById('valRollPressure').textContent = `${hmiState.rollPressureBar.toFixed(1)} bar`;
      renderHudAnd3D();
    });
    document.getElementById('sliderRollTimer').addEventListener('input', (e) => {
      hmiState.rollTimerMin = Number(e.target.value);
      document.getElementById('valRollTimer').textContent = `${hmiState.rollTimerMin} min`;
      renderHudAnd3D();
    });
  } else if (activeStationId === 'dryer') {
    hmiBox.innerHTML = `
      <div class="hmi-control-row">
        <div class="hmi-control-row-header"><span>Inlet Temp Setpoint (rTempSpDegC)</span><strong id="valDryerSp">${hmiState.dryerTempSpDegC} °C</strong></div>
        <input id="sliderDryerTempSp" type="range" min="50" max="130" step="5" value="${hmiState.dryerTempSpDegC}">
      </div>
      <div class="hmi-btn-row">
        <button id="btnFaultOverTemp" class="hmi-btn hmi-btn-danger" type="button">Over-Temp (&gt;115°C)</button>
        <button id="btnFaultAirflow" class="hmi-btn hmi-btn-danger" type="button">Airflow Loss FS-401</button>
      </div>
    `;
    document.getElementById('sliderDryerTempSp').addEventListener('input', (e) => {
      hmiState.dryerTempSpDegC = Number(e.target.value);
      document.getElementById('valDryerSp').textContent = `${hmiState.dryerTempSpDegC} °C`;
      renderHudAnd3D();
    });
    document.getElementById('btnFaultOverTemp').addEventListener('click', () => {
      hmiState.dryerTripped = true;
      hmiState.rInletTempDegC = 122.5;
      renderHudAnd3D();
    });
    document.getElementById('btnFaultAirflow').addEventListener('click', () => {
      hmiState.airflowLossFault = true;
      renderHudAnd3D();
    });
  } else if (activeStationId === 'sorting') {
    hmiBox.innerHTML = `
      <div class="hmi-btn-row">
        <button id="btnRoomRejectSpike" class="hmi-btn hmi-btn-warn" type="button">Simulate High Reject Spike (&gt;8%)</button>
      </div>
      <div class="hmi-control-row">
        <div class="hmi-control-row-header"><span>Accepted / Rejected</span><strong>${hmiState.rAcceptedKg.toFixed(1)} kg / ${hmiState.rRejectedKg.toFixed(1)} kg</strong></div>
      </div>
    `;
    document.getElementById('btnRoomRejectSpike').addEventListener('click', triggerRejectSpike);
  } else if (activeStationId === 'warehouse') {
    const isBuffer = activePolicyKey.includes('buffer');
    hmiBox.innerHTML = `
      <label class="hmi-toggle-label">
        <span>Pre-Winter Buffer (400 kg)</span>
        <input id="chkWarehouseBuffer" type="checkbox" ${isBuffer ? 'checked' : ''}>
      </label>
      <div class="hmi-btn-row">
        <button id="btnWarehouseDispatch" class="hmi-btn hmi-btn-primary" type="button">Dispatch 10 kg Order</button>
      </div>
    `;
    document.getElementById('chkWarehouseBuffer').addEventListener('change', (e) => {
      const prefix = activePolicyKey.startsWith('seasonal') ? 'seasonal' : 'fixed';
      activePolicyKey = `${prefix}_${e.target.checked ? 'buffer' : 'standard'}`;
      document.getElementById('policySelect').value = activePolicyKey;
      renderHudAnd3D();
      renderDrawer();
    });
    document.getElementById('btnWarehouseDispatch').addEventListener('click', () => {
      hmiState.warehouseDispatchedKg += 10;
      renderHudAnd3D();
    });
  }

  // Right panel: Physical Equipment & Instrumentation + PLC code
  const equipEl = document.getElementById('physicalEquipmentSpec');
  if (equipEl) {
    equipEl.innerHTML = (spec.equipmentSpec || [])
      .map((row) => `<div class="equip-spec-row"><dt>${row.k}</dt><dd>${row.v}</dd></div>`)
      .join('');
  }

  const hwEl = document.getElementById('plcHardwareMeta');
  hwEl.innerHTML = `
    <span class="hw-chip hw-chip--lang">${spec.language}</span>
    ${spec.hardware.map((h) => `<span class="hw-chip">${h}</span>`).join('')}
  `;
  document.getElementById('plcCodeSourceLabel').textContent = spec.codeLabel;
  loadStCode(activeStationId).then((code) => {
    document.getElementById('plcCodeViewer').innerHTML = highlightStCode(code);
  });

  renderLivePlcVars();
}

function renderLivePlcVars() {
  const varsEl = document.getElementById('plcLiveVars');
  if (!varsEl || activeStationId === 'overview') return;
  const { isWinter, effectiveFanPct, nFanSpeedRef } = computeDerivedPlcTags();

  const coreVars = [
    { k: 'bSafetyTrip', v: String(hmiState.bSafetyTrip), alarm: hmiState.bSafetyTrip },
    { k: 'bGoldenBatchActive', v: String(hmiState.bGoldenBatchActive) },
    { k: 'bDiverterDV01B (01→03)', v: String(!hmiState.bGoldenBatchActive && !isWinter) },
    { k: 'bGateDG02 (02→03)', v: String(hmiState.bGoldenBatchActive && !isWinter) },
    { k: 'nFanSpeedRef (%QW64)', v: `${nFanSpeedRef} (${effectiveFanPct}%)`, alarm: hmiState.airflowLossFault || hmiState.witherSensorFault },
    { k: 'rInletTemp (TT-401)', v: `${hmiState.rInletTempDegC.toFixed(1)} °C`, alarm: hmiState.dryerTripped },
  ];

  let stationVars = [];
  if (activeStationId === 'intake') {
    stationVars = [
      { k: 'rDeltaIntakeKg', v: `+${hmiState.intakeDeltaKg} kg` },
      { k: 'bHopperRelease AT %Q1.0', v: String(!hmiState.intakeQuarantine && !isWinter), alarm: hmiState.intakeQuarantine },
    ];
  } else if (activeStationId === 'withering') {
    stationVars = [
      { k: 'rWitheringBufferKg', v: `${hmiState.witheringBufferKg.toFixed(1)} / 250.0 kg` },
      { k: 'bSensorFault AT %Q3.3', v: String(hmiState.witherSensorFault), alarm: hmiState.witherSensorFault },
    ];
  } else if (activeStationId === 'rolling') {
    stationVars = [
      { k: 'rPressureBar', v: `${hmiState.rollPressureBar.toFixed(1)} bar` },
      { k: 'eActiveLine', v: hmiState.bGoldenBatchActive ? 'GOLDEN_HANDOVER (02→03)' : 'GREEN_BYPASS (01→03)' },
    ];
  } else if (activeStationId === 'dryer') {
    const heatCmd =
      hmiState.bSafetyTrip || isWinter
        ? 0.0
        : Math.min(100, Math.round((hmiState.dryerTempSpDegC / 130) * 100));
    stationVars = [
      { k: 'rHeatCmdPercent (%QW60)', v: `${heatCmd.toFixed(1)} %` },
      { k: 'bAirflowProof (FS-401)', v: String(!hmiState.airflowLossFault), alarm: hmiState.airflowLossFault },
      { k: 'bAlarmBeacon AT %Q3.1', v: hmiState.bSafetyTrip ? 'TRUE (TRIPPED)' : 'FALSE', alarm: hmiState.bSafetyTrip },
    ];
  } else if (activeStationId === 'sorting') {
    stationVars = [
      { k: 'rRejectRatePct (OS-01)', v: `${hmiState.rRejectRatePct.toFixed(1)} %`, alarm: hmiState.rejectSpikeActive },
      { k: 'rRejectedKg / rAcceptedKg', v: `${hmiState.rRejectedKg.toFixed(1)} / ${hmiState.rAcceptedKg.toFixed(1)} kg` },
      { k: 'bAlm502OpticalSpike', v: String(hmiState.rejectSpikeActive), alarm: hmiState.rejectSpikeActive },
    ];
  } else if (activeStationId === 'warehouse') {
    stationVars = [
      { k: 'inv_mode', v: activePolicyKey.includes('buffer') ? '"buffer" (400 kg)' : '"standard"' },
      { k: 'dispatched_session_kg', v: `${hmiState.warehouseDispatchedKg} kg` },
    ];
  }

  varsEl.innerHTML = [...coreVars, ...stationVars]
    .map((it) => `<div class="plc-var-item ${it.alarm ? 'plc-var-item--alarm' : ''}"><span>${it.k}</span><strong>${it.v}</strong></div>`)
    .join('');
}

function renderDrawer() {
  const snap = factorySnapshot;
  const badgeEl = document.getElementById('snapshotSourceBadge');
  if (snapshotIsLive) {
    const ts = snap.generatedAt ? new Date(snap.generatedAt).toLocaleString() : 'verified';
    badgeEl.textContent = `LIVE SNAPSHOT · ${snap.overallStatus} (${ts})`;
    badgeEl.className = 'badge-founder';
  } else {
    badgeEl.textContent = 'LOCAL MOCK FALLBACK (SNAPSHOT UNAVAILABLE)';
    badgeEl.className = 'badge-simulated';
  }

  const statusGrid = document.getElementById('snapshotStatusGrid');
  const db = snap.checks?.db || {};
  const plc = snap.checks?.plc || {};
  const sim = snap.checks?.sim || {};
  const meta = snap.simulation?.benchmarkMetadata || {};
  const cards = [
    {
      title: 'Database Traceability (db/verify.py)',
      passed: Boolean(db.passed),
      meta: snapshotIsLive ? `${db.durationSeconds ?? 0}s · SQLite + Recursive CTE` : 'Local mock fallback',
      detail: (db.output && db.output[db.output.length - 1]) || 'Schema & FK/CHECK verified',
    },
    {
      title: 'PLC Safety Verification (plc/plc_verify.py)',
      passed: Boolean(plc.passed),
      meta: snapshotIsLive ? `${plc.durationSeconds ?? 0}s · IEC 61131-3 ST` : 'Local mock fallback',
      detail: (plc.output && plc.output[plc.output.length - 1]) || 'Dryer & Withering FBs verified',
    },
    {
      title: 'Monte Carlo DES (sim/policies.py)',
      passed: Boolean(sim.passed),
      meta: `Seed ${meta.seed ?? 42} · ${meta.replications ?? 1000} replications (${sim.durationSeconds ?? 0}s)`,
      detail: '4 crossed staffing × inventory policies aggregated',
    },
  ];
  statusGrid.innerHTML = cards
    .map(
      (c) => `
      <div class="drawer-status-card" style="border-left: 4px solid ${c.passed ? '#22c55e' : '#ef4444'};">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <span style="font-size:0.78rem; font-weight:700; color:var(--text-muted);">${c.title}</span>
          <span style="font-size:0.75rem; font-weight:700; color:${c.passed ? '#16a34a' : '#dc2626'};">${c.passed ? 'PASS' : 'FAIL'}</span>
        </div>
        <div style="font-weight:600; font-size:0.85rem; margin-top:4px; color:var(--text);">${c.meta}</div>
        <div style="font-size:0.76rem; color:var(--text-muted); margin-top:2px;">${c.detail}</div>
      </div>
    `
    )
    .join('');

  const tbody = document.getElementById('snapshotPolicyTableBody');
  const policies = Object.entries(snap.simulation?.policies || {});
  tbody.innerHTML = policies
    .map(([key, p]) => {
      const op = p.kpis?.operationalKpis || {};
      const wr = p.kpis?.winterDormancyResilience || {};
      const lc = p.kpis?.laborAndCostingKpis || {};
      const minCash = Number(wr.minimumWinterCashBalanceBdt ?? 0);
      const isSelected = key === activePolicyKey;
      return `
        <tr style="${isSelected ? 'background: var(--accent-soft);' : ''}">
          <td><strong>${p.label}</strong></td>
          <td>${Number(op.annualFinishedTeaProducedKg ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</td>
          <td>${Number(op.averageDryerUtilizationPct ?? 0).toFixed(1)}%</td>
          <td>${Number(wr.winterOrderFulfillmentPct ?? 0).toFixed(1)}%</td>
          <td>${wr.winterStockoutDays ?? 0} days</td>
          <td>BDT ${Number(lc.averageAbsorptionCostBdtPerKg ?? 0).toFixed(2)}</td>
          <td style="color:${minCash < 0 ? '#dc2626' : '#16a34a'}; font-weight:600;">BDT ${Math.round(minCash).toLocaleString()}</td>
        </tr>
      `;
    })
    .join('');
}

function selectStation(stationId) {
  activeStationId = stationId;
  const isOverview = stationId === 'overview';
  document.getElementById('leftHmiPanel').hidden = isOverview;
  document.getElementById('rightPlcPanel').hidden = isOverview;
  document.getElementById('btnExitRoom').hidden = isOverview;

  if (!isOverview) {
    renderStationPanels();
  }
  document.querySelectorAll('.zone-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.station === stationId);
  });
  renderHudAnd3D();
}

function exitRoomToOverview() {
  if (scene3d) scene3d.focusStation('overview');
  selectStation('overview');
}

function triggerActiveRoomFault() {
  if (activeStationId === 'intake') {
    hmiState.intakeQuarantine = true;
  } else if (activeStationId === 'withering') {
    hmiState.witherSensorFault = true;
  } else if (activeStationId === 'sorting') {
    triggerRejectSpike();
    return;
  } else if (activeStationId === 'dryer') {
    hmiState.dryerTripped = true;
    hmiState.rInletTempDegC = 122.5;
  } else {
    hmiState.airflowLossFault = true;
  }
  renderStationPanels();
  renderHudAnd3D();
}

function ackAllAlarms() {
  alarmList.forEach((alarm) => {
    alarm.acked = true;
  });
  renderAlarmBanner();
}

function bindEvents() {
  document.getElementById('policySelect').addEventListener('change', (e) => {
    activePolicyKey = e.target.value;
    renderHudAnd3D();
    renderStationPanels();
    renderDrawer();
  });

  document.getElementById('btnToggleIsaTags').addEventListener('click', (e) => {
    isaTagsVisible = !isaTagsVisible;
    e.currentTarget.textContent = `ISA-5.1 Tags: ${isaTagsVisible ? 'ON' : 'OFF'}`;
    e.currentTarget.setAttribute('aria-pressed', String(isaTagsVisible));
    e.currentTarget.classList.toggle('hud-btn-active', isaTagsVisible);
    if (scene3d) scene3d.setIsaTagsVisible(isaTagsVisible);
  });

  document.getElementById('theme-toggle').addEventListener('click', () => {
    applyTheme(currentTheme === 'light' ? 'dark' : 'light', true);
  });

  document.getElementById('btnPlayPause').addEventListener('click', (e) => {
    isPlaying = !isPlaying;
    e.currentTarget.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    renderHudAnd3D();
  });

  document.getElementById('speedSelect').addEventListener('change', (e) => {
    simSpeed = parseFloat(e.target.value) || 1.0;
    renderHudAnd3D();
  });

  document.getElementById('btnExitRoom').addEventListener('click', exitRoomToOverview);

  document.getElementById('btnAckAlarm').addEventListener('click', ackAllAlarms);
  document.getElementById('btnHmiAckAlarm').addEventListener('click', ackAllAlarms);

  document.getElementById('btnCmdRun').addEventListener('click', () => {
    isPlaying = true;
    document.getElementById('btnPlayPause').textContent = '⏸ Pause';
    renderHudAnd3D();
  });
  document.getElementById('btnCmdStop').addEventListener('click', () => {
    isPlaying = false;
    document.getElementById('btnPlayPause').textContent = '▶ Play';
    renderHudAnd3D();
  });
  document.getElementById('btnCmdAutoManual').addEventListener('click', () => {
    hmiState.controlMode = hmiState.controlMode === 'AUTO' ? 'MANUAL' : 'AUTO';
    renderHudAnd3D();
  });
  document.getElementById('btnForceGoldenBatch').addEventListener('click', triggerGoldenHandover);
  document.getElementById('btnSimRejectSpike').addEventListener('click', triggerRejectSpike);
  document.getElementById('btnCmdTestFault').addEventListener('click', triggerActiveRoomFault);

  document.getElementById('btnModeNormal').addEventListener('click', () => {
    hmiState.operatingMode = 'normal';
    renderHudAnd3D();
  });
  document.getElementById('btnModeWinter').addEventListener('click', () => {
    hmiState.operatingMode = 'winter';
    renderHudAnd3D();
  });
  document.getElementById('btnResetSafetyLatch').addEventListener('click', () => {
    hmiState.dryerTripped = false;
    hmiState.airflowLossFault = false;
    hmiState.witherSensorFault = false;
    hmiState.intakeQuarantine = false;
    hmiState.rejectSpikeActive = false;
    hmiState.rRejectRatePct = 3.2;
    hmiState.bSafetyTrip = false;
    renderStationPanels();
    renderHudAnd3D();
  });

  document.querySelectorAll('.zone-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const stId = btn.dataset.station;
      if (scene3d) scene3d.focusStation(stId);
      selectStation(stId);
    });
  });

  document.getElementById('btnCloseLeftPanel').addEventListener('click', () => {
    document.getElementById('leftHmiPanel').hidden = true;
  });
  document.getElementById('btnCloseRightPanel').addEventListener('click', () => {
    document.getElementById('rightPlcPanel').hidden = true;
  });

  const drawer = document.getElementById('verificationDrawer');
  const toggleBtn = document.getElementById('btnToggleDrawer');
  const setDrawerOpen = (open) => {
    drawer.hidden = !open;
    toggleBtn.setAttribute('aria-expanded', String(open));
  };
  toggleBtn.addEventListener('click', () => setDrawerOpen(drawer.hidden));
  document.getElementById('btnCloseDrawer').addEventListener('click', () => setDrawerOpen(false));

  // Horizontal wheel, touch swipe, and keyboard navigation (0..6, Escape, ArrowLeft/Right)
  let lastStationStepAt = 0;
  const STATION_STEP_COOLDOWN_MS = 350;

  function stepStation(delta) {
    const now = performance.now();
    if (now - lastStationStepAt < STATION_STEP_COOLDOWN_MS) return;
    lastStationStepAt = now;

    const currentIdx = stationsList.findIndex((s) => s.id === activeStationId);
    const baseIdx = currentIdx >= 0 ? currentIdx : 0;
    const nextIdx = (baseIdx + delta + stationsList.length) % stationsList.length;
    const nextId = stationsList[nextIdx].id;
    if (scene3d) scene3d.focusStation(nextId);
    selectStation(nextId);
  }

  function isInsideSideUi(target) {
    return Boolean(target?.closest?.('#leftHmiPanel, #rightPlcPanel, #verificationDrawer'));
  }

  const viewport = document.getElementById('factory3dViewport');
  viewport.addEventListener(
    'wheel',
    (e) => {
      if (isInsideSideUi(e.target)) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 25) {
        e.preventDefault();
        stepStation(e.deltaX > 0 ? 1 : -1);
      }
    },
    { passive: false }
  );

  let touchStart = null;
  viewport.addEventListener(
    'touchstart',
    (e) => {
      if (isInsideSideUi(e.target) || e.touches.length !== 1) {
        touchStart = null;
        return;
      }
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    { passive: true }
  );

  viewport.addEventListener(
    'touchend',
    (e) => {
      if (!touchStart || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        stepStation(dx < 0 ? 1 : -1);
      }
    },
    { passive: true }
  );

  const SHORTCUT_MAP = {
    '0': 'overview',
    '1': 'intake',
    '2': 'withering',
    '3': 'rolling',
    '4': 'dryer',
    '5': 'sorting',
    '6': 'warehouse',
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!drawer.hidden) {
        setDrawerOpen(false);
        return;
      }
      if (activeStationId !== 'overview') {
        e.preventDefault();
        exitRoomToOverview();
      }
      return;
    }

    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (!drawer.hidden) return;

    if (SHORTCUT_MAP[e.key]) {
      e.preventDefault();
      const targetId = SHORTCUT_MAP[e.key];
      if (scene3d) scene3d.focusStation(targetId);
      selectStation(targetId);
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      stepStation(e.key === 'ArrowRight' ? 1 : -1);
    }
  });
}

async function init() {
  applyTheme(currentTheme, false);
  await loadFactorySnapshot();
  bindEvents();
  selectStation('overview');
  renderDrawer();

  try {
    const { createFactory3D, FACTORY_STATIONS, renderTeaLeafSwatch } = await import('./factory-3d.js?v=20261202');
    renderLeafSwatchFn = renderTeaLeafSwatch;
    if (Array.isArray(FACTORY_STATIONS) && FACTORY_STATIONS.length > 0) {
      stationsList = FACTORY_STATIONS;
    }
    scene3d = createFactory3D({
      container: document.getElementById('factory3dViewport'),
      labelsContainer: document.getElementById('labelsOverlay'),
      onStationSelect: (stId) => selectStation(stId),
      onBufferTick: (nextKg, nextGoldenActive) => {
        hmiState.witheringBufferKg = nextKg;
        const changed = hmiState.bGoldenBatchActive !== nextGoldenActive;
        hmiState.bGoldenBatchActive = nextGoldenActive;
        if (activeStationId === 'withering' || activeStationId === 'rolling' || activeStationId === 'intake') {
          const bufEl = document.getElementById('inspWitherBuffer');
          if (bufEl) bufEl.textContent = `${nextKg.toFixed(0)} / 250 kg`;
        }
        if (changed) renderHudAnd3D();
      },
      initialTheme: currentTheme,
    });
    scene3d.setIsaTagsVisible(isaTagsVisible);
    scene3d.setTheme(currentTheme);
    renderHudAnd3D();
  } catch (err) {
    console.warn('3D WebGL scene unavailable; HUD and snapshot data hydrated:', err);
  }

  initDemoTour({
    storageKey: 'pancharupa-tour-virtual-factory',
    headerTargetSelector: '.hud-controls',
    steps: [
      {
        title: 'Explore the 6-Room Tea Factory',
        description:
          'Drag to orbit, scroll to zoom, and right-drag to pan across all 6 compartmentalized rooms from Raw Leaf Reception (01) to Foil Packaging (06).',
        highlightSelector: '#factory3dViewport',
      },
      {
        title: 'Inspect Any Room (Click or 1–6)',
        description:
          'Click any room or press keys 1–6 to zoom in and open the Left Operator HMI Controls alongside the Right PLC Logic & Hardware Specs. Press Esc or Exit Room to return to Overview (0).',
        highlightSelector: '.hud-bottom-bar',
      },
      {
        title: 'Green vs. Golden Tea Priority Routing',
        description:
          'Path 01→03 runs Green Tea continuously while Room 02 accumulates withered leaf. Once Room 02 hits 250 kg (or you click Force Golden Batch), 01→03 pauses while Golden Tea feeds 02→03.',
        highlightSelector: '#hudActiveRoute',
      },
      {
        title: 'Controls, Alarms & Theme',
        description:
          'Use Play/Pause, 1×/2×/4× speed, Light/Dark mode, and DB/PLC/DES benchmarks in the top bar—or open any room to test safety interlocks and optical reject spikes (>8%).',
        highlightSelector: '.hud-controls',
      },
    ],
  });
}

document.addEventListener('DOMContentLoaded', init);
