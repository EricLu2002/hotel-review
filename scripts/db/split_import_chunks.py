from pathlib import Path

sql_path = Path(__file__).resolve().parent / 'import_comments_real.sql'
out_dir = Path(__file__).resolve().parent
chunk_size = 300

text = sql_path.read_text(encoding='utf-8')
lines = [line for line in text.splitlines() if line.strip()]
statements = []
current = []
for line in lines:
    current.append(line)
    if line.strip().endswith(';'):
        statements.append('\n'.join(current))
        current = []
if current:
    statements.append('\n'.join(current))

print(f'Parsed {len(statements)} statements from {sql_path.name}')
for i in range(0, len(statements), chunk_size):
    chunk = statements[i:i+chunk_size]
    chunk_file = out_dir / f'import_comments_chunk_{i//chunk_size + 1:03d}.sql'
    chunk_file.write_text('\n'.join(chunk) + '\n', encoding='utf-8')
    print(f'Wrote {chunk_file.name} ({len(chunk)} statements)')
