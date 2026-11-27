# PanchaRupa Shared UI Foundation

This folder contains the minimal, framework-free browser foundation for all PanchaRupa virtual tea factory project demos.

## Contents

- `css/tokens.css`: Core design tokens (color palette, industrial interlock statuses, typography, spacing, shadows).
- `css/base.css`: Base layout, accessible controls, responsive tables, cards, metrics grids, and event logger styling.
- `js/ui-utils.js`: Pure ES module utilities for client-side CSV and JSON exports, formatting, and DOM-backed event logging.
- `serve.py`: Zero-dependency static server script (`python shared/serve.py [port]`).

## Launch Instructions

Start the local server from the repository root:
```bash
python shared/serve.py 8080
```
Open any direct demo route, for example:
- `http://localhost:8080/demos/leaf-intake/`
- `http://localhost:8080/demos/green-tea-sequence/`
- `http://localhost:8080/demos/dryer-control/`

## Testing Instructions

Every subproject includes self-contained node/browser unit assertions in its `projects/<folder>/` directory, executable without external dependencies.
