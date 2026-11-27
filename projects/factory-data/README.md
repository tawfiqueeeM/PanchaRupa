# Factory Data Platform & Traceability Analytics

## Overview
The Factory Data Platform provides a centralized relational data schema and ingestion validation layer for PanchaRupa Virtual Tea Factory. It unifies operations across green leaf intake deliveries, multi-stage processing batches, quality lab inspections, warehouse inventory lots, robotic/manual packaging, and customer fulfillment orders.

## Features
- **Canonical Relational Schema:** Documented entities and fields in [data-dictionary.md](docs/data-dictionary.md).
- **Ingestion Validation Engine:** Real-time schema checks preventing corrupt datasets from polluting downstream simulation and reporting. Detects duplicate primary keys, orphan foreign keys, unapproved units, and negative measurements.
- **End-to-End Lot Genealogy Explorer:** Traces tea from dispatch bottle back to the plucked garden block and grower delivery ticket.
- **Reference Datasets:** Includes `clean_factory_dataset.json` and diagnostic `invalid_factory_dataset.json`.

## Directory Structure
- `ADVANCE-PLAN.md`: Implementation specification and architecture.
- `docs/data-dictionary.md`: Relational data schema documentation.
- `fixtures/`: Test datasets (`clean_factory_dataset.json`, `invalid_factory_dataset.json`).
- `js/data-platform-engine.js`: Pure ES module ingestion and genealogy engine.
- `tests/data-platform.test.js`: Native Node.js test suite.
- `../../demos/factory-data/`: Interactive HMI browser demo with diagnostics table and lineage visualizer.

## Verification
```bash
node --test projects/factory-data/tests/data-platform.test.js
```
