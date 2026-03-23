import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function resolveBuildCommit() {
  const envCommit = process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA;
  if (envCommit) {
    return envCommit.slice(0, 7);
  }

  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'local';
  }
}

const appVersion = process.env.npm_package_version || '0.1.0';
const buildCommit = resolveBuildCommit();

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_COMMIT__: JSON.stringify(buildCommit),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4321',
        changeOrigin: true,
      },
    },
  },
});