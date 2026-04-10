#!/usr/bin/env python3
"""
Execute SQL import statements in batches to InsForge backend.
"""
import sys
from pathlib import Path

sql_file = Path(r'd:\复旦FDU\DSBA\大模型技术\Homework\Lab2\hotel-review\scripts\db\import_comments_real.sql')

# Read the SQL file
with open(sql_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Split into individual statements
statements = [s.strip() for s in content.split('\n') if s.strip() and s.strip() != ';']

print(f"Total SQL statements: {len(statements)}")
print(f"First statement preview: {statements[0][:100]}...")
print(f"\nTo execute these statements against InsForge backend:")
print(f"1. Copy statements from: {sql_file}")
print(f"2. Execute via mcp_insforge_run-raw-sql in batches of 100-500 statements")
print(f"\nStatements are ready to import.")
