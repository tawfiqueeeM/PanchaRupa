import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PayrollEngine } from "../js/payroll-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.resolve(__dirname, "../fixtures/payroll_scenarios.json");
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf-8"));

test("PayrollEngine - Acceptance check: 2 workers x 26 shifts x BDT 120 equals exactly BDT 6,240 meals", () => {
  const engine = new PayrollEngine();
  const earlyScenario = fixtures.scenarios.find(s => s.scenarioId === "EARLY-STAGE-TWO-WORKER");
  assert.ok(earlyScenario, "Early scenario fixture must exist");

  const snapshot = engine.loadScenario(earlyScenario);
  const p = snapshot.payroll;

  assert.equal(p.staff.length, 2, "Must evaluate 2 factory workers");
  assert.equal(p.totalMealsCount, 52, "2 x 26 = 52 total meals");
  assert.equal(p.totalMealsCostBdt, 6240.0, "52 x 120 = exactly BDT 6,240.00");
});

test("PayrollEngine - Multi-stage payroll approval progression", () => {
  const engine = new PayrollEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "MONTH-24-STANDARD-CLOSE");
  engine.loadScenario(baseScenario);

  let p = engine.calculatePayroll();
  assert.equal(p.approvalStage, "SUPERVISOR_REVIEW");
  assert.equal(p.isFullyApproved, false);

  // Advance to HR
  let res = engine.advanceApprovalStage();
  assert.equal(res.stage, "HR_VERIFICATION");

  // Advance to Finance
  res = engine.advanceApprovalStage();
  assert.equal(res.stage, "FINANCE_RECONCILIATION");

  // Advance to Owner Authorization
  res = engine.advanceApprovalStage();
  assert.equal(res.stage, "OWNER_AUTHORIZATION");
  assert.equal(res.isFullyApproved, true);

  p = engine.calculatePayroll();
  assert.equal(p.isFullyApproved, true, "Payroll must be fully approved");
});

test("PayrollEngine - Factory vs Office labor cost segregation", () => {
  const engine = new PayrollEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "MONTH-24-STANDARD-CLOSE");
  const snapshot = engine.loadScenario(baseScenario);
  const p = snapshot.payroll;

  // 120k + 100k = 220k Factory Labor
  assert.equal(p.factoryLaborBdt, 220000.0, "Factory labor must equal BDT 220,000");
  
  // 80k Office Payroll
  assert.equal(p.officePayrollBdt, 80000.0, "Office payroll must equal BDT 80,000");
  
  // Total Gross Payroll = 300,000
  assert.equal(p.totalGrossPayrollBdt, 300000.0, "Total gross payroll must equal BDT 300,000");
});

test("PayrollEngine - Month 24 Income Statement & Accrual Profit vs Bank Cash reconciliation", () => {
  const engine = new PayrollEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "MONTH-24-STANDARD-CLOSE");
  const snapshot = engine.loadScenario(baseScenario);
  const close = snapshot.closeStatement;

  // Accrual Income Statement
  assert.equal(close.salesRevenueBdt, 2400000.0, "Sales must equal BDT 2,400,000");
  assert.equal(close.cogsBdt, 1650000.0, "COGS must equal BDT 1,650,000");
  assert.equal(close.grossProfitBdt, 750000.0, "Gross profit must equal BDT 750,000");
  assert.equal(close.operatingExpensesBdt, 390000.0, "OpEx must equal BDT 390,000");
  assert.equal(close.operatingProfitBdt, 360000.0, "EBIT must equal BDT 360,000");
  assert.equal(close.interestExpenseBdt, 60000.0, "Interest must equal BDT 60,000");
  assert.equal(close.profitBeforeTaxBdt, 300000.0, "PBT must equal BDT 300,000");

  // Cash Flow Reconciliation (Distinguish Profit vs Cash)
  // Cash = PBT (300k) + Depr (10,833.33) - Rec (280k) - Inv (150k) = -119,166.67
  assert.equal(close.netOperatingCashBdt, -119166.67, "Operating cash must equal -BDT 119,166.67");
  assert.equal(close.isCashDeficit, true, "Must recognize cash deficit despite accounting profit");
});

test("PayrollEngine R15 - Modifying attendance shifts or overtime post-authorization revokes approval and resets stage", () => {
  const engine = new PayrollEngine();
  const baseScenario = fixtures.scenarios.find(s => s.scenarioId === "MONTH-24-STANDARD-CLOSE");
  engine.loadScenario(baseScenario);

  // Advance fully to OWNER_AUTHORIZATION
  engine.advanceApprovalStage(); // HR_VERIFICATION
  engine.advanceApprovalStage(); // FINANCE_RECONCILIATION
  const finalAdv = engine.advanceApprovalStage(); // OWNER_AUTHORIZATION
  assert.equal(finalAdv.isFullyApproved, true);
  assert.equal(engine.calculatePayroll().isFullyApproved, true);

  // Now an operator or clerk modifies attendance shifts
  const updated = engine.updateAttendedShifts("EMP-FAC-01", 28);
  assert.equal(updated, true);

  // Verification: Approval must be invalidated and stage reset to SUPERVISOR_REVIEW
  const payrollAfterEdit = engine.calculatePayroll();
  assert.equal(payrollAfterEdit.isFullyApproved, false, "Payroll must no longer be fully approved after data mutation");
  assert.equal(payrollAfterEdit.approvalStage, "SUPERVISOR_REVIEW", "Stage must reset to SUPERVISOR_REVIEW requiring re-authorization");

  // Re-advance to HR
  engine.advanceApprovalStage();
  assert.equal(engine.calculatePayroll().approvalStage, "HR_VERIFICATION");

  // Now modify overtime
  const otUpdated = engine.updateOvertime("EMP-FAC-02", 15);
  assert.equal(otUpdated, true);
  const payrollAfterOt = engine.calculatePayroll();
  assert.equal(payrollAfterOt.isFullyApproved, false);
  assert.equal(payrollAfterOt.approvalStage, "SUPERVISOR_REVIEW", "Stage must reset back to SUPERVISOR_REVIEW on overtime edit");
});
