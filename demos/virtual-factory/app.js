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
    guide: 'Adjust the VFD Fan Speed slider and Target Moisture setpoint to regulate trough airflow across the withered leaf bed. Toggle "Simulate Probe Fault" to test the %Q3.3 capacitive sensor out-of-range cutoff.',
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
    guide: 'Set the Inlet Temp Setpoint (50–130 °C) to modulate SCR thyristor heater glow, or click "Test Over-Temp / E-Stop Trip" to trigger the %Q3.1 red strobe alarm. Use "Acknowledge & Reset" to clear the latched trip.',
    hardware: ['Siemens SIMATIC S7-1500F', 'PT100 RTD (%IW60)', 'SCR Thyristor (%QW60)', 'ATEX Dust/Temp Interlocks', 'PROFINET'],
    language: 'IEC 61131-3 Structured Text (ST)',
    codeLabel: 'plc/FB_DryerSafetyControl.st',
    stPath: '../../plc/FB_DryerSafetyControl.st',
    fallbackCode: `FUNCTION_BLOCK FB_DryerSafetyControl\n(* Enforces %I3.0 fan proof & 140C runaway cut *)\nIF bSafetyFaultActive THEN\n  bAlarmLatched := TRUE; rHeatCmdPercent := 0.0;\nEND_IF;`,
  },
  warehouse: {
    guide: 'Toggle the Pre-Winter Buffer (400 kg) policy to dynamically stack or release reserve tea pallets in the 3D warehouse. Click "Dispatch 10 kg Order" to simulate finished-goods fulfillment.',
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
let scene3d = null;
const stCodeCache = {};

// Interactive Operator HMI state
const hmiState = {
  intakeDeltaKg: 0,
  intakeQuarantine: false,
  witherFanSpeedPct: 75,
  witherTargetMoisturePct: 65,
  witherSensorFault: false,
  rollPressureBar: 2.8,
  rollTimerMin: 35,
  dryerTempSpDegC: 95,
  dryerTripped: false,
  dryerAcked: false,
  warehouseDispatchedKg: 0,
};

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

function renderHudAnd3D() {
  const policy = getActivePolicyData();
  const op = policy?.kpis?.operationalKpis || {};
  const wr = policy?.kpis?.winterDormancyResilience || {};
  const lc = policy?.kpis?.laborAndCostingKpis || {};
  const plcPassed = Boolean(factorySnapshot.checks?.plc?.passed) && !hmiState.dryerTripped;

  const leafKg = Number(op.annualFreshLeafProcessedKg ?? 41775.6) + hmiState.intakeDeltaKg;
  const dryKg = Number(op.annualFinishedTeaProducedKg ?? 10443.9);
  const dryerUtil = Number(op.averageDryerUtilizationPct ?? 41.4);
  const isBuffer = activePolicyKey.includes('buffer');
  const stockKg = Math.max(0, (isBuffer ? 400 + Math.round(dryKg * 0.04) : Math.round(dryKg * 0.02)) - hmiState.warehouseDispatchedKg);

  const station = stationsList.find((s) => s.id === activeStationId) || stationsList[0];
  document.getElementById('hudLeafIntake').textContent = `${Math.round(leafKg).toLocaleString()} kg/yr`;
  document.getElementById('hudActiveStage').textContent = station.name;

  // Telemetry inside left panel
  document.getElementById('leftPanelTitle').textContent = station.name;
  document.getElementById('inspLeafArrived').textContent = `${Math.round(leafKg).toLocaleString()} kg/yr`;
  const anyAlarm = hmiState.dryerTripped || hmiState.witherSensorFault || hmiState.intakeQuarantine;
  document.getElementById('inspBatchStatus').textContent = anyAlarm
    ? `ALARM HOLD · ${station.shortName}`
    : isPlaying
      ? `ACTIVE · ${station.shortName}`
      : `PAUSED · ${station.shortName}`;
  document.getElementById('inspPlcState').textContent = plcPassed && !hmiState.witherSensorFault ? 'SAFE · INTERLOCK OK' : 'TRIP / FAULT LATCHED';
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

  // Update 3D Scene
  if (scene3d) {
    const throughputScale = activePolicyKey.startsWith('seasonal') ? 1.15 : 0.95;
    scene3d.updateSimulationState({
      playing: isPlaying,
      speed: simSpeed,
      throughputScale,
      dryerUtilPct: dryerUtil,
      dryerTempSpDegC: hmiState.dryerTempSpDegC,
      witheringFanSpeedPct: hmiState.witherSensorFault ? 0 : hmiState.witherFanSpeedPct,
      rollingSpeedScale: hmiState.rollPressureBar / 2.8,
      intakeSpeedScale: hmiState.intakeQuarantine ? 0 : 1.0,
      plcSafe: plcPassed,
      bufferMode: isBuffer,
      stationAlarms: {
        intake: hmiState.intakeQuarantine,
        withering: hmiState.witherSensorFault,
        rolling: false,
        dryer: hmiState.dryerTripped,
        warehouse: false,
      },
      labelMetrics: {
        intake: hmiState.intakeQuarantine ? 'QUARANTINE HOLD' : `${Math.round(leafKg / 306)} kg/day`,
        withering: hmiState.witherSensorFault ? '%Q3.3 SENSOR FAULT' : `Fan ${hmiState.witherFanSpeedPct}% · Target ${hmiState.witherTargetMoisturePct}%`,
        rolling: `${hmiState.rollPressureBar.toFixed(1)} bar · ${hmiState.rollTimerMin}m`,
        dryer: hmiState.dryerTripped ? '%Q3.1 SAFETY TRIP' : `${hmiState.dryerTempSpDegC}°C SP · ${dryerUtil.toFixed(1)}% util`,
        warehouse: `${stockKg.toLocaleString()} kg · BDT ${Math.round(wr.minimumWinterCashBalanceBdt ?? 0).toLocaleString()}`,
      },
    });
  }

  renderLivePlcVars();
}

function renderStationPanels() {
  const spec = STATION_SPECS[activeStationId] || STATION_SPECS.intake;
  document.getElementById('operatorGuideText').textContent = spec.guide;

  // Build station-specific HMI controls
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
      <div class="hmi-btn-row">
        <button id="btnDryerTrip" class="hmi-btn hmi-btn-danger" type="button">Test Over-Temp / E-Stop</button>
        <button id="btnDryerReset" class="hmi-btn hmi-btn-primary" type="button">Acknowledge &amp; Reset</button>
      </div>
    `;
    document.getElementById('sliderDryerTempSp').addEventListener('input', (e) => {
      hmiState.dryerTempSpDegC = Number(e.target.value);
      document.getElementById('valDryerSp').textContent = `${hmiState.dryerTempSpDegC} °C`;
      renderHudAnd3D();
    });
    document.getElementById('btnDryerTrip').addEventListener('click', () => {
      hmiState.dryerTripped = true;
      hmiState.dryerAcked = false;
      renderHudAnd3D();
    });
    document.getElementById('btnDryerReset').addEventListener('click', () => {
      hmiState.dryerTripped = false;
      hmiState.dryerAcked = true;
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
  let items = [];
  if (activeStationId === 'intake') {
    items = [
      { k: 'rDeltaIntakeKg', v: `+${hmiState.intakeDeltaKg} kg` },
      { k: 'bHopperRelease AT %Q1.0', v: String(!hmiState.intakeQuarantine), alarm: hmiState.intakeQuarantine },
    ];
  } else if (activeStationId === 'withering') {
    const rawRef = hmiState.witherSensorFault ? 0 : Math.round((hmiState.witherFanSpeedPct / 100) * 27648);
    items = [
      { k: 'rTargetMoisture', v: `${hmiState.witherTargetMoisturePct.toFixed(1)} %` },
      { k: 'nFanSpeedRef AT %QW64', v: `${rawRef} (${hmiState.witherSensorFault ? 0 : hmiState.witherFanSpeedPct}%)` },
      { k: 'bSensorFault AT %Q3.3', v: String(hmiState.witherSensorFault), alarm: hmiState.witherSensorFault },
    ];
  } else if (activeStationId === 'rolling') {
    items = [
      { k: 'rPressureBar', v: `${hmiState.rollPressureBar.toFixed(1)} bar` },
      { k: 'tRollDuration', v: `T#${hmiState.rollTimerMin}M` },
    ];
  } else if (activeStationId === 'dryer') {
    const heatCmd = hmiState.dryerTripped ? 0.0 : Math.min(100, Math.round((hmiState.dryerTempSpDegC / 130) * 100));
    items = [
      { k: 'rTempSpDegC', v: `${hmiState.dryerTempSpDegC.toFixed(1)} °C` },
      { k: 'rHeatCmdPercent (%QW60)', v: `${heatCmd.toFixed(1)} %` },
      { k: 'bAlarmBeacon AT %Q3.1', v: hmiState.dryerTripped ? 'TRUE (TRIPPED)' : 'FALSE', alarm: hmiState.dryerTripped },
      { k: 'eState', v: hmiState.dryerTripped ? 'STATE_SAFETY_TRIP' : 'STATE_RUNNING', alarm: hmiState.dryerTripped },
    ];
  } else if (activeStationId === 'warehouse') {
    items = [
      { k: 'inv_mode', v: activePolicyKey.includes('buffer') ? '"buffer" (400 kg)' : '"standard"' },
      { k: 'dispatched_session_kg', v: `${hmiState.warehouseDispatchedKg} kg` },
    ];
  }
  varsEl.innerHTML = items
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
        <tr style="${isSelected ? 'background: rgba(22, 101, 52, 0.25);' : ''}">
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

  document.getElementById('btnPlayPause').addEventListener('click', (e) => {
    isPlaying = !isPlaying;
    e.currentTarget.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    renderHudAnd3D();
  });

  document.getElementById('speedSelect').addEventListener('change', (e) => {
    simSpeed = parseFloat(e.target.value) || 1.0;
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

  // Horizontal wheel, touch swipe, and keyboard station navigation
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

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (!drawer.hidden) return;
    e.preventDefault();
    stepStation(e.key === 'ArrowRight' ? 1 : -1);
  });
}

async function init() {
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
    });
    renderHudAnd3D();
  } catch (err) {
    console.warn('3D WebGL scene unavailable; HUD and snapshot data hydrated:', err);
  }
}

document.addEventListener('DOMContentLoaded', init);
