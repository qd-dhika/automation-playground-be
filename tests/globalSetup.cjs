'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { Client } = require('pg');

const PG_PORT = 5433;
const PG_USER = 'postgres';
const PG_PASSWORD = 'postgres';
const PG_DB = 'automation_playground_test';
// Use a fixed name so teardown can find it without a state file timing issue
const DATA_DIR = path.join(os.tmpdir(), 'pg-embed-test');

const NATIVE_DIR = path.join(
  __dirname,
  '../node_modules/@embedded-postgres/linux-x64/native'
);
const BIN_DIR = path.join(NATIVE_DIR, 'bin');
const LIB_DIR = path.join(NATIVE_DIR, 'lib');
const SHARE_DIR = path.join(NATIVE_DIR, 'share');

const INITDB = path.join(BIN_DIR, 'initdb');
const PG_CTL = path.join(BIN_DIR, 'pg_ctl');
const POSTGRES_BIN = path.join(BIN_DIR, 'postgres');

const extraEnv = {
  LD_LIBRARY_PATH:
    LIB_DIR + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : ''),
  PGSHAREDIR: SHARE_DIR,
  PGPASSWORD: PG_PASSWORD,
};

function run(cmd, opts = {}) {
  return execSync(cmd, {
    env: { ...process.env, ...extraEnv, ...opts.env },
    stdio: opts.stdio || 'pipe',
    encoding: 'utf8',
  });
}

async function waitForPg(retries = 40) {
  for (let i = 0; i < retries; i++) {
    const client = new Client({
      host: 'localhost',
      port: PG_PORT,
      user: PG_USER,
      password: PG_PASSWORD,
      database: 'postgres',
    });
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return;
    } catch (_) {
      await client.end().catch(() => {});
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error('[globalSetup] Embedded postgres failed to become ready');
}

async function createDatabase(dbName) {
  const client = new Client({
    host: 'localhost',
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASSWORD,
    database: 'postgres',
  });
  await client.connect();
  try {
    await client.query(`CREATE DATABASE "${dbName}"`);
  } catch (e) {
    if (!String(e).includes('already exists')) throw e;
  } finally {
    await client.end();
  }
}

async function setup() {
  // Make binaries executable
  [INITDB, PG_CTL, POSTGRES_BIN].forEach((bin) => {
    try { fs.chmodSync(bin, 0o755); } catch (_) {}
  });

  // Stop any leftover postgres on our port
  try {
    run(`"${PG_CTL}" -D "${DATA_DIR}" stop -m fast`);
  } catch (_) {}

  // Clean and recreate data dir
  if (fs.existsSync(DATA_DIR)) {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Write password file for initdb
  const pwFile = path.join(os.tmpdir(), 'pg-pwfile-embed');
  fs.writeFileSync(pwFile, PG_PASSWORD + '\n', { mode: 0o600 });

  // initdb
  console.log('[globalSetup] running initdb...');
  run(`"${INITDB}" -D "${DATA_DIR}" -U ${PG_USER} --pwfile="${pwFile}" --locale=C --encoding=UTF8`);
  fs.unlinkSync(pwFile);

  // Patch pg_hba.conf: use md5 for host connections
  const hbaPath = path.join(DATA_DIR, 'pg_hba.conf');
  fs.writeFileSync(
    hbaPath,
    [
      '# TYPE  DATABASE  USER  ADDRESS        METHOD',
      'local   all       all                  trust',
      'host    all       all   127.0.0.1/32   md5',
      'host    all       all   ::1/128        md5',
    ].join('\n') + '\n'
  );

  // Start postgres
  console.log(`[globalSetup] starting postgres on port ${PG_PORT}...`);
  run(`"${PG_CTL}" -D "${DATA_DIR}" -o "-p ${PG_PORT} -F" -l "${DATA_DIR}/pg.log" start`);

  // Wait for it to be ready
  await waitForPg();
  console.log('[globalSetup] postgres is ready');

  // Create test database
  await createDatabase(PG_DB);
  console.log(`[globalSetup] database "${PG_DB}" ready`);

  const testUrl = `postgresql://${PG_USER}:${PG_PASSWORD}@localhost:${PG_PORT}/${PG_DB}`;

  // Run prisma migrate deploy
  const projectRoot = path.join(__dirname, '..');
  console.log('[globalSetup] running prisma migrate deploy...');
  execSync('npx prisma migrate deploy', {
    cwd: projectRoot,
    env: { ...process.env, ...extraEnv, DATABASE_URL: testUrl },
    stdio: 'inherit',
  });

  // Write state for teardown and for worker env injection
  const stateFile = path.join(os.tmpdir(), 'pg-test-state.json');
  fs.writeFileSync(stateFile, JSON.stringify({ PG_PORT, DATA_DIR, testUrl }));

  console.log('[globalSetup] done. Test DB:', testUrl);
}

module.exports = setup;
