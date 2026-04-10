const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function runQuery(sql, label) {
  console.log(`\n=== Executing ${label} ===`);
  const result = spawnSync('npm', ['exec', '--', '@insforge/cli', 'db', 'query', sql], {
    cwd: path.resolve(__dirname, '..', '..'),
    stdio: 'inherit',
    shell: false,
    encoding: 'utf8',
  });

  if (result.error) {
    console.error(`Failed to execute ${label}:`, result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`Command exited with status ${result.status}`);
    process.exit(result.status);
  }
}

function splitSqlStatements(sqlText) {
  return sqlText
    .split(/\);\s*\n(?=INSERT INTO)/g)
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return null;
      return trimmed.endsWith(');') ? trimmed : `${trimmed});`;
    })
    .filter(Boolean);
}

function importFile(filePath, label) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = splitSqlStatements(sql);

  console.log(`Found ${statements.length} statements in ${label}`);

  for (let i = 0; i < statements.length; i += 1) {
    runQuery(statements[i], `${label} [${i + 1}/${statements.length}]`);
  }
}

const baseDir = path.resolve(__dirname);
const chunkFiles = fs
  .readdirSync(baseDir)
  .filter((file) => file.startsWith('import_comments_chunk_') && file.endsWith('.sql'))
  .sort();

for (const chunkFile of chunkFiles) {
  importFile(path.join(baseDir, chunkFile), chunkFile);
}

console.log('\nAll SQL chunks imported successfully.');
