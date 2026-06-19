'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Read the DB URL written by globalSetup and inject into this worker's process.env
// This must run BEFORE dotenv is loaded (setupFiles runs before setupFilesAfterFramework).
const stateFile = path.join(os.tmpdir(), 'pg-test-state.json');
if (fs.existsSync(stateFile)) {
  const { testUrl } = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  process.env.DATABASE_URL = testUrl;
  process.env.DATABASE_URL_TEST = testUrl;
}
