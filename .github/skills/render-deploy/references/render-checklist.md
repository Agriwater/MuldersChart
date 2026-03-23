# Render Checklist

## Pre-Deploy
- `git status --short` is clean or intentionally changed
- latest fix is pushed to `main`
- `npm run build` passes locally

## Render Config
- Service type: Web Service
- Runtime: Node
- Branch: `main`
- Build command: `npm install --include=dev && npm run build`
- Start command: `npm run start`
- Health check path: `/api/health`

## Env Vars
- `HOST=0.0.0.0`
- `NODE_ENV=production`
- `GRAPH_DATA_FILE=/tmp/mulders-graph.json` on free tier

## Free Tier Notes
- Expect cold starts
- No persistent disk
- User-edited graph data is temporary

## Post-Deploy Verification
- Render build log ends in success
- runtime log shows `Mulders Chart server listening`
- runtime log shows the graph data path
- public URL loads
- `/api/health` returns success
- app gets past `Loading graph data...`
