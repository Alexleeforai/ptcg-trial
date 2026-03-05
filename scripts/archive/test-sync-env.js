const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const { syncSetCodesToDatabase } = require('../lib/googleSheets');
const { updateSetCode } = require('../lib/db');

// Note: We need to use 'require' for local scripts but the code is ESM 'import'. 
// To make this work quickly without rewriting, let's verify environment variables first.
// Or actually, since our project is Module based (package.json type: module?), we should use ESM.
// But scripts are usually CommonJS. Let's check environment first.

console.log('Checking Environment Variables...');
console.log('SHEET_ID:', process.env.GOOGLE_SHEETS_SHEET_ID ? '✅ Loaded' : '❌ Missing');
console.log('EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Loaded' : '❌ Missing');
console.log('KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Loaded' : '❌ Missing');

// Just a simple variable check first.
