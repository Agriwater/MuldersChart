---
name: render-deploy
description: 'Deploy this project to Render. Use for Render web service setup, redeploys, build/start command fixes, free-tier configuration, environment variables, health checks, and post-deploy verification.'
argument-hint: 'Describe the deployment goal, such as first deploy, redeploy, free tier, or debugging a failed Render deploy.'
---

# Render Deploy

Use this skill when working on deployment of this repository to Render.

## When To Use
- First-time Render setup
- Switching between free and paid Render plans
- Fixing Render build failures
- Fixing Render runtime or health check failures
- Redeploying after GitHub pushes
- Verifying the public Render URL after rollout

## Repo-Specific Facts
- Build command: `npm install --include=dev && npm run build`
- Start command: `npm run start`
- Health check path: `/api/health`
- Server host env var: `HOST=0.0.0.0`
- Free tier persistence path: `GRAPH_DATA_FILE=/tmp/mulders-graph.json`
- Free tier storage is ephemeral, so saved graph edits do not survive restarts or redeploys
- Production routing relies on Express serving `dist/` and falling back to `index.html` only for non-asset, non-API routes
- Production assets use Vite content hashes, while HTML is served with `Cache-Control: no-store`

## Procedure
1. Confirm the latest code is pushed to GitHub before touching Render.
2. Validate the production bundle locally with `npm run build`.
3. On Render, verify:
   - instance type
   - build command
   - start command
   - env vars
   - health check path
4. For free tier, ensure no persistent disk is attached and `GRAPH_DATA_FILE` points to `/tmp/mulders-graph.json`.
5. Trigger a deploy or deploy the latest commit manually if polling is slow.
6. Watch logs through build, upload, deploy, and process startup.
7. Confirm the server logs show the expected port and graph data file path.
8. Open the public URL in a fresh browser session and verify the app renders past the loading screen.
9. If the issue appears browser-specific, suspect stale HTML or stale hashed assets first.

## Render Failure Triage
- `vite: not found`
  Cause: production env skipped devDependencies during build.
  Fix: use `npm install --include=dev && npm run build`.

- Root URL returns `404`
  Cause: production Express routing is not serving the SPA shell correctly.
  Fix: verify the server sends `index.html` for `/` and non-asset, non-API routes.

- Browser requests an old asset filename
  Cause: stale HTML or asset hash mismatch during rollout.
  Fix: verify `Cache-Control: no-store` behavior for HTML and content-hashed asset filenames.

- Health check hangs
  Cause: app process did not fully start, wrong host, wrong port binding, or runtime error before server boot.
  Fix: inspect runtime logs and confirm host `0.0.0.0`, Render port binding, and `/api/health` response.

## References
- [render-checklist](./references/render-checklist.md)
