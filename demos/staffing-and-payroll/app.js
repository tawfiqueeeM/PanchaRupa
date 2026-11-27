import { PayrollEngine } from "../../projects/staffing-and-payroll/js/payroll-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  const engine = new PayrollEngine();
  let scenariosData = null;

  try {
    const res = await fetch("../../projects/staffing-and-payroll/fixtures/payroll_scenarios.json");
    if (res.ok) {
      scenariosData = await res.json();
    }
  } catch (err) {
    console.warn("Could not load scenarios JSON", err);
  }

  // DOM Elements
  const scenarioSelect = document.getElementById("scenarioSelect");
  const btnAdvanceStage = document.getElementById("btnAdvanceStage");
  const btnReset = document.getElementById("btnReset");
  const btnExportJson = document.getElementById("btnExportJson");
  const btnExportCsv = document.getElementById("btnExportCsv");

  const payrollStatusPill = document.getElementById("payrollStatusPill");
  const kpiGrossPayroll = document.getElementById("kpiGrossPayroll");
  const kpiPayrollSub = document.getElementById("kpiPayrollSub");
  const kpiMeals = document.getElementById("kpiMeals");
  const kpiMealsSub = document.getElementById("kpiMealsSub");
  const kpiPbt = document.getElementById("kpiPbt");
  const kpiCash = document.getElementById("kpiCash");
  const kpiCashSub = document.getElementById("kpiCashSub");

  const staffTableBody = document.getElementById("staffTableBody");
  const stepperContainer = document.getElementById("stepperContainer");

  const stmtSales = document.getElementById("stmtSales");
  const stmtCogs = document.getElementById("stmtCogs");
  const stmtGrossProfit = document.getElementById("stmtGrossProfit");
  const stmtOpex = document.getElementById("stmtOpex");
  const stmtEbit = document.getElementById("stmtEbit");
  const stmtInterest = document.getElementById("stmtInterest");
  const stmtPbt = document.getElementById("stmtPbt");
  const bridgeCash = document.getElementById("bridgeCash");

  function loadInitialScenario(scenarioId) {
    if (scenariosData && scenariosData.scenarios) {
      const scen = scenariosData.scenarios.find(s => s.scenarioId === scenarioId);
      if (scen) {
        engine.loadScenario(scen);
        updateUI();
        return;
      }
    }
  }

  function updateUI() {
    const p = engine.calculatePayroll();
    const close = engine.calculateMonth24Close();

    // 1. KPI Cards
    kpiGrossPayroll.textContent = `BDT ${p.totalGrossPayrollBdt.toLocaleString()}`;
    kpiPayrollSub.textContent = `Factory: BDT ${p.factoryLaborBdt.toLocaleString()} | Office: BDT ${p.officePayrollBdt.toLocaleString()}`;

    kpiMeals.textContent = `BDT ${p.totalMealsCostBdt.toLocaleString()}`;
    kpiMealsSub.textContent = `${p.totalMealsCount} meals @ BDT 120/shift`;

    kpiPbt.textContent = `BDT ${close.profitBeforeTaxBdt.toLocaleString()}`;

    kpiCash.textContent = `BDT ${close.netOperatingCashBdt.toLocaleString()}`;
    kpiCash.style.color = close.isCashDeficit ? "var(--color-status-danger)" : "var(--color-status-success)";
    kpiCashSub.textContent = close.isCashDeficit ? "Working capital deficit" : "Cash surplus";

    if (p.isFullyApproved) {
      payrollStatusPill.className = "status-indicator ok";
      payrollStatusPill.textContent = "● OWNER AUTHORIZED";
      btnAdvanceStage.disabled = true;
      btnAdvanceStage.textContent = "✓ Fully Authorized";
    } else {
      payrollStatusPill.className = "status-indicator warn";
      payrollStatusPill.textContent = `● ${p.approvalStage.replace("_", " ")}`;
      btnAdvanceStage.disabled = false;
      btnAdvanceStage.textContent = "Advance Approval Stage ➔";
    }

    // 2. Render Stepper
    renderStepper();

    // 3. Render Staff Table
    renderStaffTable(p);

    // 4. Render Income Statement & Cash Bridge
    stmtSales.textContent = `BDT ${close.salesRevenueBdt.toLocaleString()}`;
    stmtCogs.textContent = `- BDT ${close.cogsBdt.toLocaleString()}`;
    stmtGrossProfit.textContent = `BDT ${close.grossProfitBdt.toLocaleString()} (${close.grossMarginPct.toFixed(1)}%)`;
    stmtOpex.textContent = `- BDT ${close.operatingExpensesBdt.toLocaleString()}`;
    stmtEbit.textContent = `BDT ${close.operatingProfitBdt.toLocaleString()}`;
    stmtInterest.textContent = `- BDT ${close.interestExpenseBdt.toLocaleString()}`;
    stmtPbt.textContent = `BDT ${close.profitBeforeTaxBdt.toLocaleString()}`;
    bridgeCash.textContent = `BDT ${close.netOperatingCashBdt.toLocaleString()}`;
  }

  function renderStepper() {
    const currentIdx = engine.currentStageIdx;
    const items = stepperContainer.querySelectorAll(".step-item");
    items.forEach((item, idx) => {
      item.className = "step-item";
      if (idx < currentIdx) item.classList.add("completed");
      else if (idx === currentIdx) item.classList.add("active");
    });
  }

  function renderStaffTable(p) {
    let rows = "";
    p.staff.forEach(emp => {
      rows += `
        <tr>
          <td>
            <strong>${emp.name}</strong>
            <div style="font-size:0.75rem; color:var(--color-text-muted); font-family:var(--font-mono);">${emp.empId}</div>
          </td>
          <td><span class="log-badge ${emp.dept === 'FACTORY' ? 'INFO' : 'ACTION'}">${emp.dept}</span></td>
          <td>
            <input type="number" class="input-shifts" data-id="${emp.empId}" value="${emp.attendedShifts}" min="0" max="31" style="width:50px; padding:2px 4px; font-size:0.8rem; border:1px solid var(--color-border); border-radius:3px;">
          </td>
          <td style="font-family:var(--font-mono);">
            ${emp.dept === 'FACTORY' ? `BDT ${emp.mealCostBdt.toLocaleString()} (${emp.mealsCount}m)` : 'BDT 0'}
          </td>
          <td style="font-family:var(--font-mono); font-weight:700;">
            BDT ${emp.grossWagesBdt.toLocaleString()}
          </td>
        </tr>
      `;
    });
    staffTableBody.innerHTML = rows;

    staffTableBody.querySelectorAll(".input-shifts").forEach(inp => {
      inp.addEventListener("change", (e) => {
        engine.updateAttendedShifts(e.target.dataset.id, parseInt(e.target.value, 10));
        updateUI();
      });
    });
  }

  // Event Listeners
  scenarioSelect.addEventListener("change", (e) => {
    loadInitialScenario(e.target.value);
  });

  btnReset.addEventListener("click", () => {
    loadInitialScenario(scenarioSelect.value);
  });

  btnAdvanceStage.addEventListener("click", () => {
    engine.advanceApprovalStage();
    updateUI();
  });

  // Export Handlers
  btnExportJson.addEventListener("click", () => {
    const exportObj = {
      scenario: scenarioSelect.value,
      timestamp: new Date().toISOString(),
      snapshot: engine.getSnapshot(),
      auditLog: engine.auditLog
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `payroll_month24_${Date.now()}.json`);
    dlAnchorElem.click();
  });

  btnExportCsv.addEventListener("click", () => {
    const p = engine.calculatePayroll();
    let csv = "EmpId,Name,Dept,AttendedShifts,MealsCount,MealCostBdt,BaseSalaryBdt,OvertimeHours,GrossWagesBdt\n";
    p.staff.forEach(e => {
      csv += `${e.empId},"${e.name}",${e.dept},${e.attendedShifts},${e.mealsCount},${e.mealCostBdt},${e.baseSalaryBdt},${e.overtimeHours},${e.grossWagesBdt}\n`;
    });
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `payroll_register_${Date.now()}.csv`);
    dlAnchorElem.click();
  });

  // Initial load
  loadInitialScenario("MONTH-24-STANDARD-CLOSE");
});
