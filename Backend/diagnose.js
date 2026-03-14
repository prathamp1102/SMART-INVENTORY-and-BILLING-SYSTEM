/**
 * Run this from your Backend folder:
 *   node diagnose.js
 * 
 * It will tell you exactly why the server fails to register routes.
 */
const fs   = require('fs');
const path = require('path');

console.log('\n🔍 Smart Inventory — Backend Diagnostics\n');
console.log('Working dir:', process.cwd());
console.log('Node version:', process.version);
console.log('');

// 1. Check critical files exist
const checks = [
  'routes/organizationroutes.js',
  'routes/branchRoutes.js',
  'routes/superAdminRoutes.js',
  'controllers/organizationcontroller.js',
  'controllers/branchcontroller.js',
  'controllers/superAdminController.js',
];

console.log('── File existence ─────────────────────');
checks.forEach(f => {
  const exists = fs.existsSync(path.join(process.cwd(), f));
  console.log((exists ? '✅' : '❌') + ' ' + f);
});

// 2. Check require paths inside route files
console.log('\n── Require path in organizationroutes.js ──');
try {
  const src = fs.readFileSync('routes/organizationroutes.js', 'utf8');
  const match = src.match(/require\(["'](.*organizat.*?)["']\)/);
  if (match) {
    const reqPath = match[1];
    console.log('  requires:', reqPath);
    const resolved = path.resolve('routes', reqPath) + '.js';
    const exists = fs.existsSync(resolved);
    console.log('  resolves to:', resolved);
    console.log('  file exists:', exists ? '✅ YES' : '❌ NO — THIS IS THE BUG');
  }
} catch(e) { console.log('  ❌ Could not read file:', e.message); }

console.log('\n── Require path in branchRoutes.js ──');
try {
  const src = fs.readFileSync('routes/branchRoutes.js', 'utf8');
  const match = src.match(/require\(["'](.*branch.*?)["']\)/);
  if (match) {
    const reqPath = match[1];
    console.log('  requires:', reqPath);
    const resolved = path.resolve('routes', reqPath) + '.js';
    const exists = fs.existsSync(resolved);
    console.log('  resolves to:', resolved);
    console.log('  file exists:', exists ? '✅ YES' : '❌ NO — THIS IS THE BUG');
  }
} catch(e) { console.log('  ❌ Could not read file:', e.message); }

// 3. Try to actually load every route
console.log('\n── Route load test ─────────────────────');
const routes = [
  'routes/authroutes.js',
  'routes/categoryroutes.js',
  'routes/productroutes.js',
  'routes/supplierroutes.js',
  'routes/organizationroutes.js',
  'routes/branchRoutes.js',
  'routes/migrationroutes.js',
  'routes/attendanceroutes.js',
  'routes/taxSettingsRoutes.js',
  'routes/invoiceSettingsRoutes.js',
  'routes/currencySettingsRoutes.js',
  'routes/backupRoutes.js',
  'routes/superAdminRoutes.js',
  'routes/dashboardRoutes.js',
];

let crashed = false;
routes.forEach(r => {
  try {
    require(path.resolve(process.cwd(), r));
    console.log('✅', r);
  } catch(e) {
    console.log('❌', r, '→', e.message);
    crashed = true;
  }
});

if (!crashed) {
  console.log('\n✅ ALL ROUTES LOAD FINE — restart server and it should work\n');
} else {
  console.log('\n❌ FIX THE ABOVE ERRORS THEN RESTART SERVER\n');
}
