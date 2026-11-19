/**
 * Staffing, Payroll & Month 24 Financial Close Engine
 * Reconciles attendance-linked meal allowances (BDT 120/shift), multi-tier approval governance,
 * factory vs office payroll cost segregation, and Month 24 accrual profit vs bank cash reconciliation.
 */

export class PayrollEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.approvalStages = [
      "SUPERVISOR_REVIEW",
      "HR_VERIFICATION",
      "FINANCE_RECONCILIATION",
      "OWNER_AUTHORIZATION"
    ];
    this.currentStageIdx = 0;
    this.financials = {
      salesRevenueBdt: 2400000.0,
      cogsBdt: 1650000.0,
      operatingExpensesBdt: 390000.0,
      interestExpenseBdt: 60000.0,
      depreciationBdt: 10833.33,
      uncollectedReceivablesBdt: 280000.0,
      unsoldInventoryBdt: 150000.0
    };
    this.staff = [];
    this.auditLog = [];
    this.log("Payroll and Month 24 accounting engine initialized", "INFO");
  }

  loadScenario(scenario) {
    this.financials = { ...this.financials, ...(scenario.financials || {}) };
    this.staff = JSON.parse(JSON.stringify(scenario.staff || []));
    const stageIdx = this.approvalStages.indexOf(scenario.approvalStage);
    this.currentStageIdx = stageIdx >= 0 ? stageIdx : 0;

    this.log(`Loaded scenario ${scenario.scenarioId}: ${scenario.description}`, "INFO");
    return this.getSnapshot();
  }

  advanceApprovalStage() {
    if (this.currentStageIdx < this.approvalStages.length - 1) {
      this.currentStageIdx++;
      const newStage = this.approvalStages[this.currentStageIdx];
      this.log(`Payroll approval progressed to stage: ${newStage}`, "ACTION");
      return { success: true, stage: newStage, isFullyApproved: this.currentStageIdx === this.approvalStages.length - 1 };
    }
    return { success: false, reason: "ALREADY_FULLY_APPROVED" };
  }

  updateAttendedShifts(empId, shifts) {
    const emp = this.staff.find(e => e.empId === empId);
    if (!emp) return false;
    emp.attendedShifts = Math.max(0, Math.min(31, Number(shifts)));
    this.log(`Updated attended shifts for ${emp.name} to ${emp.attendedShifts}`, "ACTION");
    return true;
  }

  updateOvertime(empId, hours) {
    const emp = this.staff.find(e => e.empId === empId);
    if (!emp) return false;
    emp.overtimeHours = Math.max(0, Math.min(60, Number(hours)));
    this.log(`Updated overtime hours for ${emp.name} to ${emp.overtimeHours} hrs`, "ACTION");
    return true;
  }

  calculatePayroll() {
    let factoryLaborBdt = 0;
    let officePayrollBdt = 0;
    let totalMealsCount = 0;
    let totalMealsCostBdt = 0;

    const enrichedStaff = this.staff.map(emp => {
      const overtimePayBdt = Math.round(emp.overtimeHours * emp.overtimeRateBdt * 100) / 100;
      const grossWagesBdt = Math.round((emp.baseSalaryBdt + overtimePayBdt) * 100) / 100;

      // 1 meal per attended shift for factory workers
      let mealsCount = 0;
      let mealCostBdt = 0;
      if (emp.dept === "FACTORY") {
        mealsCount = emp.attendedShifts;
        mealCostBdt = mealsCount * (emp.mealRateBdt || 120.0);
        factoryLaborBdt += grossWagesBdt;
        totalMealsCount += mealsCount;
        totalMealsCostBdt += mealCostBdt;
      } else {
        officePayrollBdt += grossWagesBdt;
      }

      return {
        ...emp,
        overtimePayBdt,
        grossWagesBdt,
        mealsCount,
        mealCostBdt,
        totalCompensationBdt: Math.round((grossWagesBdt + mealCostBdt) * 100) / 100
      };
    });

    const totalGrossPayrollBdt = Math.round((factoryLaborBdt + officePayrollBdt) * 100) / 100;

    return {
      staff: enrichedStaff,
      factoryLaborBdt,
      officePayrollBdt,
      totalGrossPayrollBdt,
      totalMealsCount,
      totalMealsCostBdt,
      approvalStage: this.approvalStages[this.currentStageIdx],
      isFullyApproved: this.currentStageIdx === this.approvalStages.length - 1
    };
  }

  calculateMonth24Close() {
    const f = this.financials;

    const grossProfitBdt = Math.round((f.salesRevenueBdt - f.cogsBdt) * 100) / 100;
    const grossMarginPct = Math.round((grossProfitBdt / f.salesRevenueBdt) * 1000) / 10;

    const operatingProfitBdt = Math.round((grossProfitBdt - f.operatingExpensesBdt) * 100) / 100;
    const profitBeforeTaxBdt = Math.round((operatingProfitBdt - f.interestExpenseBdt) * 100) / 100;

    // Cash reconciliation bridge: Profit vs Realized Bank Cash
    const workingCapitalImpactBdt = Math.round(-(f.uncollectedReceivablesBdt + f.unsoldInventoryBdt) * 100) / 100;
    const netOperatingCashBdt = Math.round((profitBeforeTaxBdt + f.depreciationBdt + workingCapitalImpactBdt) * 100) / 100;

    return {
      salesRevenueBdt: f.salesRevenueBdt,
      cogsBdt: f.cogsBdt,
      grossProfitBdt,
      grossMarginPct,
      operatingExpensesBdt: f.operatingExpensesBdt,
      operatingProfitBdt,
      interestExpenseBdt: f.interestExpenseBdt,
      profitBeforeTaxBdt,
      depreciationAddbackBdt: f.depreciationBdt,
      uncollectedReceivablesBdt: f.uncollectedReceivablesBdt,
      unsoldInventoryBdt: f.unsoldInventoryBdt,
      workingCapitalImpactBdt,
      netOperatingCashBdt,
      isCashDeficit: netOperatingCashBdt < 0
    };
  }

  getSnapshot() {
    return {
      payroll: this.calculatePayroll(),
      closeStatement: this.calculateMonth24Close(),
      auditLog: [...this.auditLog]
    };
  }

  log(message, type = "INFO") {
    this.auditLog.unshift({
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      message,
      type
    });
    if (this.auditLog.length > 50) this.auditLog.pop();
  }
}
