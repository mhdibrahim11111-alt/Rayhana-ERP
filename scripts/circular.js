const path = require('node:path');
const madge = require('madge');

const root = path.resolve(__dirname, '..');
const entryPoints = ['main.js', 'dashboard.js', 'login.js', 'preload.js', 'db.js'];

async function main() {
  const graph = await madge(entryPoints, {
    baseDir: root,
    fileExtensions: ['js'],
    includeNpm: false
  });
  const cycles = graph.circular();

  if (cycles.length > 0) {
    console.error(`Circular dependencies found (${cycles.length}):`);
    for (const cycle of cycles) console.error(`  ${cycle.join(' -> ')}`);
    process.exitCode = 1;
    return;
  }

  console.log('No circular dependencies found.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
