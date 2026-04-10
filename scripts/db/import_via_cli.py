import os
import re
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CHUNK_FILES = sorted(
    p for p in BASE_DIR.iterdir() if p.name.startswith('import_comments_chunk_') and p.suffix == '.sql'
)

NPM_CMD = 'npx.cmd' if os.name == 'nt' else 'npx'


def split_sql_statements(sql_text: str):
    parts = re.split(r"\);\s*\n(?=INSERT INTO)", sql_text)
    statements = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if not part.endswith(');'):
            part = part + ');'
        statements.append(part)
    return statements


def run_sql(statement: str, label: str):
    print(f"\n=== Executing {label} ===")
    result = subprocess.run(
        [NPM_CMD, '@insforge/cli', 'db', 'query', statement],
        cwd=BASE_DIR.parent,
        text=True,
        encoding='utf-8',
        errors='replace',
        capture_output=True,
        shell=False,
        env=os.environ,
    )
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed with status {result.returncode}")


def import_file(path: Path):
    sql = path.read_text(encoding='utf-8')
    statements = split_sql_statements(sql)
    print(f"Found {len(statements)} statements in {path.name}")
    for idx, statement in enumerate(statements, start=1):
        run_sql(statement, f"{path.name} [{idx}/{len(statements)}]")


if __name__ == '__main__':
    for chunk_file in CHUNK_FILES:
        import_file(chunk_file)
    print('\nAll SQL chunks imported successfully.')
