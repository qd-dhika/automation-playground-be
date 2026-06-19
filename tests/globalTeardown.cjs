'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const NATIVE_DIR = path.join(
  __dirname,
  '../node_modules/@embedded-postgres/linux-x64/native'
);
const BIN_DIR = path.join(NATIVE_DIR, 'bin');
const LIB_DIR = path.join(NATIVE_DIR, 'lib');
const PG_CTL = path.join(BIN_DIR, 'pg_ctl');

const sharedEnv = {
  ...process.env,
  LD_LIBRARY_PATH: LIB_DIR + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : ''),
};

async function teardown() {
  const stateFile = path.join(os.tmpdir(), 'pg-test-state.json');
  if (!fs.existsSync(stateFile)) return;

  const { DATA_DIR } = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  fs.unlinkSync(stateFile);

  console.log('[globalTeardown] stopping postgres...');
  try {
    execSync(`"${PG_CTL}" -D "${DATA_DIR}" stop -m fast`, {
      env: { ...sharedEnv, PGSHAREDIR: path.join(NATIVE_DIR, 'share') },
      stdio: 'pipe',
    });
  } catch (_) {}

  try {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  } catch (_) {}

  console.log('[globalTeardown] done');
}

module.exports = teardown;
