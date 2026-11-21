/**
 * Integrated Factory Capstone Engine (Dept 5 HMI & Simulation with all departments)
 * Pure ES module for five-configuration evaluation, bottleneck progression, and portfolio navigation.
 */

export class IntegratedFactoryEngine {
  /**
   * Run simulation for a single configuration under a given workload.
   * @param {Object} config Configuration specification
   * @param {Object} workload Workload specification
   * @returns {Object} Simulation performance metrics
   */
  static simulateConfiguration(config, workload) {
    const targetKg = workload.targetOutputKg;
    const maxCapacityKg = config.maxMonthlyCapacityKg;

    const isOverCapacity = targetKg > maxCapacityKg;
    const realizedOutputKg = isOverCapacity ? maxCapacityKg : targetKg;
    const unfulfilledDemandKg = isOverCapacity ? +(targetKg - maxCapacityKg).toFixed(1) : 0.0;
    const capacityUtilizationPercent = +((realizedOutputKg / maxCapacityKg) * 100).toFixed(1);

    const totalLaborWorkerHours = +(realizedOutputKg * config.laborIntensityWorkerHoursPerKg).toFixed(1);
    const totalEnergyKwh = +(realizedOutputKg * config.secKwhPerKg).toFixed(1);
    const totalManufacturingCostBdt = +(realizedOutputKg * config.unitCostBdtPerKg).toFixed(2);
    const effectiveUnitCostBdtPerKg = config.unitCostBdtPerKg;

    // Cycle time scales with capacity constraint if overloaded
    const cycleTimeMultiplier = isOverCapacity ? +(targetKg / maxCapacityKg).toFixed(2) : 1.0;
    const effectiveCycleTimeDays = +(config.orderCycleTimeDays * cycleTimeMultiplier).toFixed(1);

    return {
      configId: config.id,
      configOrder: config.order,
      configName: config.name,
      category: config.category,
      mechanizationLevel: config.mechanizationLevel,
      bottleneckStation: config.bottleneckStation,
      targetDemandKg: targetKg,
      maxCapacityKg,
      realizedOutputKg,
      unfulfilledDemandKg,
      isOverCapacity,
      capacityUtilizationPercent,
      laborIntensityWorkerHoursPerKg: config.laborIntensityWorkerHoursPerKg,
      totalLaborWorkerHours,
      secKwhPerKg: config.secKwhPerKg,
      totalEnergyKwh,
      unitCostBdtPerKg: effectiveUnitCostBdtPerKg,
      totalManufacturingCostBdt,
      effectiveCycleTimeDays,
      founderReported: workload.founderReported || false,
      equipment: config.equipment
    };
  }

  /**
   * Compare all 5 factory configurations against the same workload.
   * @param {Array} configs 
   * @param {Object} workload 
   * @returns {Object} Multi-configuration comparison matrix
   */
  static compareAllConfigurations(configs, workload) {
    const sortedConfigs = [...configs].sort((a, b) => a.order - b.order);
    const runs = sortedConfigs.map(c => this.simulateConfiguration(c, workload));

    const manualRun = runs[0];
    const coordinatedRun = runs[runs.length - 1];

    const laborSavingsWorkerHours = +(manualRun.totalLaborWorkerHours - coordinatedRun.totalLaborWorkerHours).toFixed(1);
    const laborProductivityFactor = +(manualRun.laborIntensityWorkerHoursPerKg / coordinatedRun.laborIntensityWorkerHoursPerKg).toFixed(1);
    const unitCostReductionBdt = +(manualRun.unitCostBdtPerKg - coordinatedRun.unitCostBdtPerKg).toFixed(2);
    const capacityScaleMultiplier = +(coordinatedRun.maxCapacityKg / manualRun.maxCapacityKg).toFixed(1);

    return {
      workloadId: workload.id,
      workloadName: workload.name,
      targetOutputKg: workload.targetOutputKg,
      founderReported: workload.founderReported || false,
      runs,
      summaryInsights: {
        laborSavingsWorkerHours,
        laborProductivityFactor,
        unitCostReductionBdt,
        capacityScaleMultiplier,
        bottleneckMigration: runs.map(r => ({
          config: r.configName,
          bottleneck: r.bottleneckStation,
          capacity: `${r.maxCapacityKg} kg/mo`
        }))
      }
    };
  }

  /**
   * Return comprehensive portfolio subproject navigation and integration registry.
   * @returns {Array} List of subprojects with routes and integration status
   */
  static getNavigationDirectory() {
    const REPO_URL_PREFIX = "https://github.com/tawfiqueeeM/PanchaRupa/tree/";
    return [
      { id: '01', name: 'Leaf Intake & Quality Gate', dept: 'Dept 4 Quality', route: '/demos/leaf-intake/', branch: 'subproject/01-leaf-intake', sourceUrl: `${REPO_URL_PREFIX}subproject/01-leaf-intake`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '02', name: 'Green Tea Processing Sequence', dept: 'Dept 2 Capacity', route: '/demos/green-tea-sequence/', branch: 'subproject/02-green-tea-processing', sourceUrl: `${REPO_URL_PREFIX}subproject/02-green-tea-processing`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '03', name: 'Dryer Controls & Heat Transfer', dept: 'Dept 3 Controls', route: '/demos/dryer-control/', branch: 'subproject/03-dryer-controls', sourceUrl: `${REPO_URL_PREFIX}subproject/03-dryer-controls`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '04', name: 'Withering Airflow & Trough Control', dept: 'Dept 3 Controls', route: '/demos/withering-airflow/', branch: 'subproject/04-withering', sourceUrl: `${REPO_URL_PREFIX}subproject/04-withering`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '05', name: 'Golden Tea Processing Sequence', dept: 'Dept 2 Capacity', route: '/demos/golden-tea-sequence/', branch: 'subproject/05-golden-tea-processing', sourceUrl: `${REPO_URL_PREFIX}subproject/05-golden-tea-processing`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '06', name: 'Grading & Routing Sieve Table', dept: 'Dept 1 Production', route: '/demos/grading-and-routing/', branch: 'subproject/06-grading-and-routing', sourceUrl: `${REPO_URL_PREFIX}subproject/06-grading-and-routing`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '07', name: 'Packing & Reject Handling', dept: 'Dept 1 Production', route: '/demos/packing-and-dispatch/', branch: 'subproject/07-packing-and-dispatch', sourceUrl: `${REPO_URL_PREFIX}subproject/07-packing-and-dispatch`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '08', name: 'Green Leaf Procurement & MRP', dept: 'Dept 7 Business', route: '/demos/leaf-procurement/', branch: 'subproject/08-procurement', sourceUrl: `${REPO_URL_PREFIX}subproject/08-procurement`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '09', name: 'Production Scheduling (Shared Machines)', dept: 'Dept 2 Capacity', route: '/demos/production-scheduling/', branch: 'subproject/09-production-scheduling', sourceUrl: `${REPO_URL_PREFIX}subproject/09-production-scheduling`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '10', name: 'Worker Shifts & Skills Roster', dept: 'Dept 2 Capacity', route: '/demos/worker-shift-planning/', branch: 'subproject/10-shifts-and-skills', sourceUrl: `${REPO_URL_PREFIX}subproject/10-shifts-and-skills`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '11', name: 'Inventory & Order Fulfillment', dept: 'Dept 7 Business', route: '/demos/inventory-and-fulfillment/', branch: 'subproject/11-inventory-and-fulfilment', sourceUrl: `${REPO_URL_PREFIX}subproject/11-inventory-and-fulfilment`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '12', name: 'Absorption Costing & Margin Engine', dept: 'Dept 7 Business', route: '/demos/costing-and-margin/', branch: 'subproject/12-costing-and-finance', sourceUrl: `${REPO_URL_PREFIX}subproject/12-costing-and-finance`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '13', name: 'Maintenance Planning & Asset PM', dept: 'Depts 7 & 2', route: '/demos/maintenance-planning/', branch: 'subproject/13-maintenance', sourceUrl: `${REPO_URL_PREFIX}subproject/13-maintenance`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '14', name: 'Integrated Factory Capstone Simulator', dept: 'Dept 5 with All', route: '/demos/virtual-factory/', branch: 'subproject/14-integrated-factory', sourceUrl: `${REPO_URL_PREFIX}subproject/14-integrated-factory`, status: 'ACTIVE_CAPSTONE', liveOnThisBranch: true },
      { id: '15', name: 'Robotic Packing Cell (Delta Robot)', dept: 'Dept 1 Production', route: '/demos/robotic-packing/', branch: 'subproject/15-robotic-packing', sourceUrl: `${REPO_URL_PREFIX}subproject/15-robotic-packing`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '16', name: 'Factory Data Platform & Genealogy', dept: 'Depts 4, 5 & 7', route: '/demos/factory-data/', branch: 'subproject/16-factory-data-platform', sourceUrl: `${REPO_URL_PREFIX}subproject/16-factory-data-platform`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: '17', name: 'Sustainability & Waste Attribution', dept: 'Depts 4 & 7', route: '/demos/sustainability/', branch: 'subproject/17-sustainability-and-waste', sourceUrl: `${REPO_URL_PREFIX}subproject/17-sustainability-and-waste`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: 'BMS', name: 'Building Automation & BMS / SD-anlegg', dept: 'Dept 3 Controls', route: '/demos/building-automation/', branch: 'subproject/factory-and-bms', sourceUrl: `${REPO_URL_PREFIX}subproject/factory-and-bms`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: 'PAYROLL', name: 'Staffing, Meals & Month 24 Close', dept: 'Dept 7 Business', route: '/demos/staffing-and-payroll/', branch: 'subproject/staffing-and-payroll', sourceUrl: `${REPO_URL_PREFIX}subproject/staffing-and-payroll`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false },
      { id: 'AUCTION', name: 'Tea Auction Planning & Venues', dept: 'Dept 7 Business', route: '/demos/tea-auction-planning/', branch: 'subproject/tea-auction-planning', sourceUrl: `${REPO_URL_PREFIX}subproject/tea-auction-planning`, status: 'BRANCH_ISOLATED', liveOnThisBranch: false }
    ];
  }

  /**
   * Export five-configuration comparison to CSV string.
   * @param {Object} comparison Comparison object
   * @returns {string} CSV text
   */
  static exportToCSV(comparison) {
    const headers = [
      'Configuration Order',
      'Configuration Name',
      'Bottleneck Station',
      'Max Monthly Capacity (kg)',
      'Target Demand (kg)',
      'Realized Output (kg)',
      'Over Capacity Flag',
      'Capacity Utilization (%)',
      'Labor Intensity (worker-hrs/kg)',
      'Total Labor Hours',
      'Specific Energy (kWh/kg)',
      'Unit Manufacturing Cost (BDT/kg)',
      'Total Manufacturing Cost (BDT)',
      'Order Lead Time (days)'
    ];

    const rows = comparison.runs.map(r => [
      r.configOrder,
      `"${r.configName}"`,
      `"${r.bottleneckStation}"`,
      r.maxCapacityKg,
      r.targetDemandKg,
      r.realizedOutputKg,
      r.isOverCapacity,
      r.capacityUtilizationPercent,
      r.laborIntensityWorkerHoursPerKg,
      r.totalLaborWorkerHours,
      r.secKwhPerKg,
      r.unitCostBdtPerKg,
      r.totalManufacturingCostBdt,
      r.effectiveCycleTimeDays
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}
