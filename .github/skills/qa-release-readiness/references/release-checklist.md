# Release Checklist

## Build
- `npm run build`
- confirm output contains `dist/index.html`
- confirm expected asset files are emitted

## Runtime
- root page renders
- no blank screen
- no unresolved asset 404s in a fresh session
- `/api/health` returns success
- `/api/graph` returns graph data

## Functional Smoke Test
- move at least one nutrient slider
- confirm graph remains interactive
- confirm control panel renders correctly
- confirm editable rules table renders
- confirm save flow response is sensible for the target environment

## Environment Notes
- free-tier Render means temporary persistence only
- cold starts are expected on idle free services

## Signoff Rule
- ship only if build, startup, root rendering, asset loading, and core interaction flow all pass
