/* Remove Next.js build output (fixes missing chunk / MODULE_NOT_FOUND in dev). */
const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');
try {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('[clean-next] Removed', nextDir);
} catch (e) {
  console.warn('[clean-next]', e.message || e);
}
