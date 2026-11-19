# Database and traceability

Plan approximately 20 fields on Day 1 and 110 across ten business areas as operations grow. The counts include identifiers and dates and serve as schema planning estimates.

Day 1: auction history (8), purchases and expenses (12). Months 1–2: factory construction and assets (10). Month 3: production batches (14), quality checks (9), inventory and local bottled sales (12). From first hire: HR and payroll (12). Months 4–6: machine and BMS readings (11). First auction: auction lots and logistics (12), results and settlements (10).

Use shared supplier, product, batch, employee, shift, equipment, sale and lot IDs. Link material use, labour and QC to batches. Link bottling runs and stock movements to retail sale lines. Use a lot allocation table for batch-to-lot links and kilograms. Keep distinct product codes and costs for bottled stock and auction lots. Record manual or automated method on every run. Store sensor readings with timestamp, unit and batch reference when available.
