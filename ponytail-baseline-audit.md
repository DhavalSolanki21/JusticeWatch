# Ponytail Baseline Audit

- `native` `axios`. Replace with `fetch`. [frontend/src/services/api.ts]
- `delete` `react-icons`. Dependency installed but unused in the codebase. [frontend/package.json]
- `native` `motion` (framer-motion). Replace `motion.div`/`motion.button` with plain CSS transitions for hover effects and simple animations. [frontend/src/components/GeographicDossierReader.tsx, DistrictGrid.tsx, DistrictDetailModal.tsx]
- `shrink` `plotly.js` and `react-plotly.js`. If possible, rely on the custom SVG rendering engine instead of these heavy external dependencies, or relegate Plotly strictly to the Python backend as per the syllabus. [frontend/package.json, frontend/src/pages/Analytics.tsx]
- `shrink` TypeScript definitions and configuration (`@types/react`, `@types/node`, `typescript`, `tsx`, etc.). Move to plain JS as requested. [frontend/package.json]

Net: Several heavy packages (`framer-motion`, `axios`, `react-icons`) and TS toolchain can be completely removed from the frontend to drastically reduce bundle size and complexity.
