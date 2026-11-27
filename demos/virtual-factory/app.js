const DEFAULT_STATIONS = [
  { id: 'intake', name: '1. Leaf Intake Dock', shortName: 'Intake Dock' },
  { id: 'withering', name: '2. Withering Troughs', shortName: 'Withering' },
  { id: 'rolling', name: '3. Rolling & Oxidation', shortName: 'Rolling' },
  { id: 'dryer', name: '4. Dryer Line', shortName: 'Dryer Line' },
  { id: 'warehouse', name: '5. Packaging & Warehouse', shortName: 'Warehouse' },
];
let stationsList = DEFAULT_STATIONS;

const STATION_SPECS = {
  intake: {
    guide: 'Click "Trigger Batch Weigh-In (+40 kg)" to advance a fresh green-leaf lot across the digital weighbridge into the intake hopper. Toggle the Quarantine Gate to simulate a quality rejection interlock.',
    hardware: ['Siemens SIMATIC S7-1200', 'Mettler Toledo Load Cell (4-20mA)', 'PROFINET / Modbus TCP', 'SQLite Lot Genealogy'],
    language: 'Ladder Logic (LAD) + SQL Recursive CTE',
    codeLabel: 'Intake Weighbridge & Genealogy Logic (LAD/SQL)',
    fallbackCode: `(* Leaf Intake Weighbridge & Genealogy Edge *)\nIF bGateClosed AND (rGrossKg > rTareKg) THEN\n  rNetLeafKg := rGrossKg - rTareKg;\n  bHopperRelease AT %Q1.0 := NOT bQuarantineHold;\nEND_IF;\n\n-- db/queries.sql: Trace SUPPLIER -> DELIVERY\nINSERT INTO genealogy_edges (parent_entity_type, child_entity_type)\nVALUES ('SUPPLIER', 'DELIVERY');`,
  },
  withering: {
    guide: 'Adjust the VFD Fan Speed slider and Target Moisture setpoint to regulate trough airflow across FN-01..04. Toggle "Simulate Probe Fault" to test the %Q3.3 capacitive sensor out-of-range cutoff.',
    hardware: ['Siemens SIMATIC S7-1500', 'SINAMICS G120 VFD (%QW64)', 'Capacitive Moisture Probe (%IW70)', 'PROFINET IO'],
    language: 'IEC 61131-3 Structured Text (ST)',
    codeLabel: 'plc/FB_WitheringAirflowControl.st',
    stPath: '../../plc/FB_WitheringAirflowControl.st',
    fallbackCode: `FUNCTION_BLOCK FB_WitheringAirflowControl\n(* Scaled %IW70 moisture -> %QW64 VFD cutoff at 65% target *)\nIF bSensorFault THEN\n  rFanSpeedPct := 0.0; nFanSpeedRef := 0;\nEND_IF;`,
  },
  rolling: {
    guide: 'Adjust Roller Pressure (bar) and Cycle Timer (min) to control orthodox leaf maceration speed and oxidation exposure. Higher pressure increases roller drum RPM in the 3D line.',
    hardware: ['Siemens SIMATIC S7-1500', 'Orthodox Brass Roller Drives', 'Pneumatic Pressure Regulator', 'OPC UA / SFC'],
    language: 'Sequential Function Chart (SFC) / ST',
    codeLabel: 'Rolling & Oxidation Sequence (SFC/ST)',
    fallbackCode: `(* Mutual-Exclusion Roller & Oxidation Timer *)\nCASE eRollStep OF\n  STEP_LOAD: IF bRollerFree THEN bClampActive := TRUE; END_IF;\n  STEP_ROLL: tonRollTimer(IN := TRUE, PT := tRollDuration);\n             rDrumRpm := rPressureBar * 12.0;\n  STEP_OXIDIZE: bOxidationMist := TRUE;\nEND_CASE;`,
  },
  dryer: {
    guide: 'Set the Inlet Temp Setpoint (50–130 °C) to modulate SCR thyristor heater glow, or trigger Dryer Over-Temp (>115°C) / Airflow Loss (FS-401) to test %Q3.1 safety interlocks. Use Reset Safety Latch to clear latched trips.',
    hardware: ['Siemens SIMATIC S7-1500F', 'PT100 RTD (%IW60)', 'SCR Thyristor (%QW60)', 'ATEX Zone 22 Interlocks', 'PROFINET'],
    language: 'IEC 61131-3 Structured Text (ST)',
    codeLabel: 'plc/FB_DryerSafetyControl.st',
    stPath: '../../plc/FB_DryerSafetyControl.st',
    fallbackCode: `FUNCTION_BLOCK FB_DryerSafetyControl\n(* Enforces %I3.0 fan proof & 115C/140C runaway cut *)\nIF bSafetyFaultActive THEN\n  bAlarmLatched := TRUE; rHeatCmdPercent := 0.0;\nEND_IF;`,
  },
  warehouse: {
    guide: 'Toggle the Pre-Winter Buffer (400 kg) policy to dynamically stack or release reserve tea pallets in the 3D warehouse. Switch to Winter Dormancy (Jan-Feb) to observe buffer drawdown.',
    hardware: ['Robotic Palletizer Cell', 'Barcode / RFID Lot Scanner', 'OPC UA / REST Telemetry', 'SimPy DES Engine'],
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
let activeStationId = 'intake';
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
const stCodeCache = {};

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
      // Ignore storage errors in restricted contexts
    }
  }
  if (scene3d?.setTheme) {
    scene3d.setTheme(currentTheme);
  }
}

// Interactive Operator HMI & ISA-18.2 Alarm State
const hmiState = {
  operatingMode: 'normal', // 'normal' | 'winter'
  intakeDeltaKg: 0,
  intakeQuarantine: false,
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
        ? 'Winter Dormancy (Jan–Feb) · Intake & drying in standby · Drawing from 400 kg buffer'
        : 'All safety interlocks satisfied · No active plant alarms';
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

  const station = stationsList.find((s) => s.id === activeStationId) || stationsList[0];
  document.getElementById('hudLeafIntake').textContent = isWinter
    ? '0 kg/day (Dormancy)'
    : `${Math.round(leafKg).toLocaleString()} kg/yr`;
  document.getElementById('hudActiveStage').textContent = station.name;

  // Mode buttons state
  const btnNormal = document.getElementById('btnModeNormal');
  const btnWinter = document.getElementById('btnModeWinter');
  if (btnNormal && btnWinter) {
    btnNormal.classList.toggle('hmi-btn-primary', !isWinter);
    btnWinter.classList.toggle('hmi-btn-primary', isWinter);
  }

  // Telemetry inside left panel
  document.getElementById('leftPanelTitle').textContent = station.name;
  document.getElementById('inspLeafArrived').textContent = isWinter
    ? '0 kg/day (Jan–Feb)'
    : `${Math.round(leafKg).toLocaleString()} kg/yr`;
  const anyAlarm = hmiState.bSafetyTrip || hmiState.witherSensorFault || hmiState.intakeQuarantine;
  document.getElementById('inspBatchStatus').textContent = anyAlarm
    ? `ALARM HOLD · ${station.shortName}`
    : isWinter
      ? `STANDBY · WINTER DORMANCY`
      : isPlaying
        ? `ACTIVE · ${station.shortName}`
        : `PAUSED · ${station.shortName}`;
  document.getElementById('inspPlcState').textContent =
    plcPassed && !hmiState.witherSensorFault ? 'SAFE · INTERLOCK OK' : 'TRIP / FAULT LATCHED';
  document.getElementById('inspDryerUtil').textContent = `${dryerUtil.toFixed(1)}%`;
  document.getElementById('inspFinishedStock').textContent = `${stockKg.toLocaleString()} kg`;

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
        warehouse: false,
      },
      stationStandby: {
        intake: isWinter,
        withering: isWinter,
        rolling: isWinter,
        dryer: isWinter,
        warehouse: false,
      },
      labelMetrics: {
        intake: hmiState.intakeQuarantine
          ? 'QUARANTINE HOLD'
          : isWinter
            ? 'WINTER STANDBY · 0 kg/d'
            : `${dailyIntake} kg/day`,
        withering: hmiState.witherSensorFault
          ? '%Q3.3 SENSOR FAULT'
          : isWinter
            ? 'STANDBY · Fan 0%'
            : `Fan ${effectiveFanPct}% · Target ${hmiState.witherTargetMoisturePct}%`,
        rolling: isWinter
          ? 'STANDBY · Idle'
          : `${hmiState.rollPressureBar.toFixed(1)} bar · ${hmiState.rollTimerMin}m`,
        dryer: hmiState.bSafetyTrip
          ? '%Q3.1 SAFETY TRIP'
          : isWinter
            ? 'STANDBY · 22.0°C'
            : `${hmiState.rInletTempDegC.toFixed(0)}°C · ${dryerUtil.toFixed(1)}% util`,
        warehouse: `${stockKg.toLocaleString()} kg · BDT ${Math.round(wr.minimumWinterCashBalanceBdt ?? 0).toLocaleString()}`,
      },
      isaTagValues: {
        'SC-01': hmiState.intakeQuarantine ? 'HOLD' : `${dailyIntake} kg/d`,
        'FN-01': `${effectiveFanPct}% (${nFanSpeedRef})`,
        'RL-01': isWinter ? '0.0 bar' : `${hmiState.rollPressureBar.toFixed(1)} bar`,
        'TT-401': `${hmiState.rInletTempDegC.toFixed(1)} °C`,
        'PK-01': `${stockKg.toLocaleString()} kg`,
      },
    });
  }

  renderLivePlcVars();
}

function renderStationPanels() {
  const spec = STATION_SPECS[activeStationId] || STATION_SPECS.intake;
  document.getElementById('operatorGuideText').textContent = spec.guide;

  const hmiBox = document.getElementById('hmiControlsContainer');
  if (activeStationId === 'intake') {
    hmiBox.innerHTML = `
      <div class="hmi-btn-row">
        <button id="btnTriggerWeighIn" class="hmi-btn hmi-btn-primary" type="button">+40 kg Batch Weigh-In</button>
      </div>
      <label class="hmi-toggle-label">
        <span>Quarantine Gate Interlock</span>
        <input id="chkIntakeFault" type="checkbox" ${hmiState.intakeQuarantine ? 'checked' : ''}>
      </label>
    `;
    document.getElementById('btnTriggerWeighIn').addEventListener('click', () => {
      hmiState.intakeDeltaKg += 40;
      renderHudAnd3D();
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
    `;
    document.getElementById('sliderDryerTempSp').addEventListener('input', (e) => {
      hmiState.dryerTempSpDegC = Number(e.target.value);
      document.getElementById('valDryerSp').textContent = `${hmiState.dryerTempSpDegC} °C`;
      renderHudAnd3D();
    });
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

  // Right panel hardware & code
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
  if (!varsEl) return;
  const { isWinter, effectiveFanPct, nFanSpeedRef } = computeDerivedPlcTags();

  // Always show core safety/telemetry PLC tags + station-specific tags
  const coreVars = [
    { k: 'bSafetyTrip', v: String(hmiState.bSafetyTrip), alarm: hmiState.bSafetyTrip },
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
      { k: 'rTargetMoisture', v: `${hmiState.witherTargetMoisturePct.toFixed(1)} %` },
      { k: 'bSensorFault AT %Q3.3', v: String(hmiState.witherSensorFault), alarm: hmiState.witherSensorFault },
    ];
  } else if (activeStationId === 'rolling') {
    stationVars = [
      { k: 'rPressureBar', v: `${hmiState.rollPressureBar.toFixed(1)} bar` },
      { k: 'tRollDuration', v: `T#${hmiState.rollTimerMin}M` },
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
          <span style="font-size:0.78rem; font-weight:700; color:#94a3b8;">${c.title}</span>
          <span style="font-size:0.75rem; font-weight:700; color:${c.passed ? '#4ade80' : '#f87171'};">${c.passed ? 'PASS' : 'FAIL'}</span>
        </div>
        <div style="font-weight:600; font-size:0.85rem; margin-top:4px; color:#f8fafc;">${c.meta}</div>
        <div style="font-size:0.76rem; color:#cbd5e1; margin-top:2px;">${c.detail}</div>
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
        <tr style="${isSelected ? 'background: rgba(15, 118, 110, 0.25);' : ''}">
          <td><strong>${p.label}</strong></td>
          <td>${Number(op.annualFinishedTeaProducedKg ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</td>
          <td>${Number(op.averageDryerUtilizationPct ?? 0).toFixed(1)}%</td>
          <td>${Number(wr.winterOrderFulfillmentPct ?? 0).toFixed(1)}%</td>
          <td>${wr.winterStockoutDays ?? 0} days</td>
          <td>BDT ${Number(lc.averageAbsorptionCostBdtPerKg ?? 0).toFixed(2)}</td>
          <td style="color:${minCash < 0 ? '#fca5a5' : '#86efac'}; font-weight:600;">BDT ${Math.round(minCash).toLocaleString()}</td>
        </tr>
      `;
    })
    .join('');
}

function selectStation(stationId) {
  if (stationId !== 'overview') {
    activeStationId = stationId;
    document.getElementById('leftHmiPanel').hidden = false;
    document.getElementById('rightPlcPanel').hidden = false;
    renderStationPanels();
  } else {
    document.getElementById('leftHmiPanel').hidden = true;
    document.getElementById('rightPlcPanel').hidden = true;
  }
  document.querySelectorAll('.zone-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.station === stationId);
  });
  renderHudAnd3D();
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

  // ISA-18.2 Alarm ACK
  document.getElementById('btnAckAlarm').addEventListener('click', () => {
    alarmList.forEach((alarm) => {
      alarm.acked = true;
    });
    renderAlarmBanner();
  });

  // Operating Mode & Safety Interlock Controls
  document.getElementById('btnModeNormal').addEventListener('click', () => {
    hmiState.operatingMode = 'normal';
    renderHudAnd3D();
  });
  document.getElementById('btnModeWinter').addEventListener('click', () => {
    hmiState.operatingMode = 'winter';
    renderHudAnd3D();
  });
  document.getElementById('btnFaultOverTemp').addEventListener('click', () => {
    hmiState.dryerTripped = true;
    hmiState.rInletTempDegC = 122.5;
    if (scene3d) scene3d.focusStation('dryer');
    selectStation('dryer');
  });
  document.getElementById('btnFaultAirflow').addEventListener('click', () => {
    hmiState.airflowLossFault = true;
    if (scene3d) scene3d.focusStation('dryer');
    selectStation('dryer');
  });
  document.getElementById('btnResetSafetyLatch').addEventListener('click', () => {
    hmiState.dryerTripped = false;
    hmiState.airflowLossFault = false;
    hmiState.witherSensorFault = false;
    hmiState.intakeQuarantine = false;
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

  // Horizontal wheel, touch swipe, and keyboard station navigation (0..5 + ArrowLeft/ArrowRight)
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
    '5': 'warehouse',
  };

  window.addEventListener('keydown', (e) => {
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
  renderStationPanels();
  renderHudAnd3D();
  renderDrawer();

  try {
    const { createFactory3D, FACTORY_STATIONS } = await import('./factory-3d.js');
    if (Array.isArray(FACTORY_STATIONS) && FACTORY_STATIONS.length > 0) {
      stationsList = FACTORY_STATIONS;
    }
    scene3d = createFactory3D({
      container: document.getElementById('factory3dViewport'),
      labelsContainer: document.getElementById('labelsOverlay'),
      onStationSelect: (stId) => selectStation(stId),
      initialTheme: currentTheme,
    });
    scene3d.setIsaTagsVisible(isaTagsVisible);
    scene3d.setTheme(currentTheme);
    renderHudAnd3D();
  } catch (err) {
    console.warn('3D WebGL scene unavailable; HUD and snapshot data hydrated:', err);
  }
}

document.addEventListener('DOMContentLoaded', init);
