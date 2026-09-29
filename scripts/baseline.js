const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const baselinePath = path.join(root, 'baseline.json');
const excludedDirectories = new Set(['.git', 'dist', 'node_modules', 'scripts', 'tests']);
const statusStrings = {
  roomAvailable: 'متاحة',
  roomOccupied: 'مشغولة',
  roomReserved: 'محجوزة',
  roomCleaning: 'تنظيف',
  bookingOpenContract: 'عقد مفتوح',
  paymentMethodCash: 'نقداً',
  reservationConfirmed: 'مؤكد',
  reservationCompleted: 'مكتمل',
  reservationCancelled: 'ملغي',
  reservationPartiallyCancelled: 'ملغي جزئي',
  paymentUnpaid: 'غير مدفوع',
  paymentPartiallyPaid: 'مدفوع جزئياً',
  paymentFullyPaid: 'مدفوع بالكامل',
  paymentCredit: 'رصيد دائن',
  paymentRefunded: 'مستردة'
};

function collectJavaScriptFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !excludedDirectories.has(entry.name)) {
      collectJavaScriptFiles(path.join(directory, entry.name), files);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(path.join(directory, entry.name));
    }
  }
  return files;
}

function countFunctions(node) {
  if (!node || typeof node !== 'object') return 0;
  let count = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type) ? 1 : 0;
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) count += countFunctions(child);
    } else if (value && typeof value === 'object' && typeof value.type === 'string') {
      count += countFunctions(value);
    }
  }
  return count;
}

function getStorageConstants(ast) {
  const constants = {};
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.id.name === 'STORAGE_KEYS' && node.init?.type === 'CallExpression') {
      const object = node.init.arguments[0];
      if (object?.type === 'ObjectExpression') {
        for (const property of object.properties) {
          if (property.key?.type === 'Identifier' && property.value?.type === 'Literal') {
            constants[property.key.name] = property.value.value;
          }
        }
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object' && typeof value.type === 'string') visit(value);
    }
  }
  visit(ast);
  return constants;
}

const files = collectJavaScriptFiles(root).sort();
let functionCount = 0;
let windowApiCallCount = 0;
const arabicStatusStringCounts = Object.fromEntries(Object.entries(statusStrings).map(([key]) => [key, 0]));
const localStorageKeyCounts = {};
const storageConstants = {};

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true });
  Object.assign(storageConstants, getStorageConstants(ast));
}

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true });
  functionCount += countFunctions(ast);

  const apiCalls = source.match(/\bwindow\s*\.\s*api\s*\.\s*[A-Za-z_$][\w$]*\s*\(/g);
  windowApiCallCount += apiCalls ? apiCalls.length : 0;

  for (const [key, text] of Object.entries(statusStrings)) {
    arabicStatusStringCounts[key] += source.split(text).length - 1;
  }

  function collectStorageKeys(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression' && node.callee.object?.type === 'Identifier' && node.callee.object.name === 'localStorage') {
      const argument = node.arguments[0];
      let storageKey = null;
      if (argument?.type === 'Literal' && typeof argument.value === 'string') {
        storageKey = argument.value;
      } else if (argument?.type === 'MemberExpression' && argument.object?.name === 'STORAGE_KEYS') {
        const constantName = argument.property?.name;
        storageKey = storageConstants[constantName] || null;
      }
      if (storageKey) localStorageKeyCounts[storageKey] = (localStorageKeyCounts[storageKey] || 0) + 1;
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(collectStorageKeys);
      else if (value && typeof value === 'object' && typeof value.type === 'string') collectStorageKeys(value);
    }
  }
  collectStorageKeys(ast);
}

const current = {
  functionCount,
  windowApiCallCount,
  arabicStatusStringCounts,
  localStorageKeyCounts: Object.fromEntries(Object.entries(localStorageKeyCounts).sort(([a], [b]) => a.localeCompare(b)))
};
const mode = process.argv[2];

if (mode === '--write') {
  fs.writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(current, null, 2)}\n`);
} else if (mode === '--compare') {
  if (!fs.existsSync(baselinePath)) {
    console.error(`Baseline file not found: ${path.relative(root, baselinePath)}`);
    process.exitCode = 1;
  } else {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    if (JSON.stringify(baseline) !== JSON.stringify(current)) {
      console.error('Baseline mismatch.');
      console.error(`Expected:\n${JSON.stringify(baseline, null, 2)}`);
      console.error(`Actual:\n${JSON.stringify(current, null, 2)}`);
      process.exitCode = 1;
    } else {
      process.stdout.write(`${JSON.stringify(current, null, 2)}\n`);
    }
  }
} else {
  process.stdout.write(`${JSON.stringify(current, null, 2)}\n`);
}
