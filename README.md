# Mulder's Chart 3D

Interactive Three.js nutrient relationship graph with live slider-driven updates, animated directional edges, and a server-persisted relationship table.

## Local run

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4321

## Persistence

The editable nutrient relationship table is stored in `data/mulders-graph.json`.

- The server reads the file on startup.
- The UI saves changes back through `PUT /api/graph`.
- Override the storage path with `GRAPH_DATA_FILE=/absolute/path/to/mulders-graph.json`.
- If the target file does not exist yet, the server seeds it from the bundled `data/mulders-graph.json`.

## Render deploy

This app is set up to run on Render as a single Web Service with a persistent disk for the editable graph JSON.

### Included setup

- `render.yaml` defines the Web Service.
- The app builds with `npm install && npm run build`.
- The runtime uses `npm run start`.
- Graph edits are stored on the mounted disk via `GRAPH_DATA_FILE=/var/data/mulders-graph.json`.

### Render steps

1. Push this project to GitHub.
2. In Render, create a new Blueprint from the repository, or create a Web Service manually.
3. If using the included blueprint, Render will provision:
	- a Web Service
	- a persistent disk mounted at `/var/data`
4. Deploy the service.

### Notes

- On first boot, the server copies the bundled seed data into the persistent disk file if it is missing.
- Future edits made in the UI are written to the persistent disk copy, so they survive restarts and redeploys.
- If you later move to your own production stack, replace `GRAPH_DATA_FILE` with a database-backed persistence layer.

## Project structure

- `src/`: React UI and Three.js scene
- `server/`: Express API for graph persistence
- `data/`: nutrient nodes and relationship rules
- `.vscode/`: basic VS Code tasks and extension recommendations