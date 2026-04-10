import ast
import csv
import json
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
csv_path = BASE_DIR / 'public' / 'enriched_comments.csv'
output_path = BASE_DIR / 'scripts' / 'db' / 'import_comments_real.sql'

if not csv_path.exists():
    raise FileNotFoundError(f'{csv_path} not found')


def make_sql_safe(text: str) -> str:
    return text.replace("'", "''")


def parse_array(value):
    if value is None:
        return []
    text = str(value).strip()
    if not text:
        return []

    try:
        parsed = ast.literal_eval(text)
        if isinstance(parsed, (list, tuple)):
            return list(parsed)
    except Exception:
        pass

    try:
        return json.loads(text)
    except Exception:
        pass

    # fallback: replace single quotes with double quotes for Python-style arrays
    normalized = re.sub(r"'([^']*)'", r'"\1"', text)
    try:
        return json.loads(normalized)
    except Exception:
        return []


def parse_int(value, default=0):
    try:
        return int(float(str(value).strip()))
    except Exception:
        return default


def parse_decimal(value, default=None):
    if value is None:
        return default
    text = str(value).strip()
    if text == '':
        return default
    try:
        return Decimal(text)
    except (InvalidOperation, ValueError):
        try:
            return Decimal(str(float(text)))
        except Exception:
            return default


def make_review_title(text: str) -> str:
    value = text.strip()
    title = value.split('\n', 1)[0][:40]
    return title or '用户评论'


with csv_path.open('r', encoding='utf-8', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    statements = []

    for row in reader:
        comment = (row.get('comment') or '').strip()
        if not comment:
            continue

        source_id = (row.get('_id') or '').strip() or 'unknown'
        categories = [str(item).strip() for item in parse_array(row.get('categories')) if str(item).strip()]
        category1 = categories[0] if len(categories) > 0 else None
        category2 = categories[1] if len(categories) > 1 else None
        category3 = categories[2] if len(categories) > 2 else None
        category_value = categories[0] if categories else (row.get('travel_type') or '').strip() or '其他'

        images = parse_array(row.get('images'))
        if isinstance(images, str):
            images = [images]
        images = [str(item).strip() for item in images if str(item).strip()]

        score = parse_decimal(row.get('score'), Decimal('0.0')) or Decimal('0.0')
        star = max(1, min(5, int(score)))
        rating = star

        publish_date = (row.get('publish_date') or '').strip()
        try:
            parsed_date = datetime.strptime(publish_date, '%Y-%m-%d').date()
            publish_date_sql = parsed_date.isoformat()
        except Exception:
            publish_date_sql = '1970-01-01'

        comment_len = parse_int(row.get('comment_len'), None)
        log_comment_len = parse_decimal(row.get('log_comment_len'), None)
        useful_count = parse_int(row.get('useful_count'), 0)
        log_useful_count = parse_decimal(row.get('log_useful_count'), None)
        review_count = parse_int(row.get('review_count'), 0)
        log_review_count = parse_decimal(row.get('log_review_count'), None)
        quality_score = parse_decimal(row.get('quality_score'), Decimal('0.0')) or Decimal('0.0')

        images_json = json.dumps(images, ensure_ascii=False)
        categories_json = json.dumps(categories, ensure_ascii=False)

        field_values = {
            '_id': source_id,
            'comment': comment,
            'images': images_json,
            'score': score,
            'star': star,
            'publish_date': publish_date_sql,
            'room_type': (row.get('room_type') or '').strip(),
            'fuzzy_room_type': (row.get('fuzzy_room_type') or '').strip(),
            'travel_type': (row.get('travel_type') or '').strip(),
            'comment_len': comment_len,
            'log_comment_len': log_comment_len,
            'useful_count': useful_count,
            'log_useful_count': log_useful_count,
            'review_count': review_count,
            'log_review_count': log_review_count,
            'quality_score': quality_score,
            'categories': categories_json,
            'category1': category1,
            'category2': category2,
            'category3': category3,
            'hotel_name': '未知酒店',
            'location': '未知地点',
            'reviewer_name': '匿名',
            'review_title': make_review_title(comment),
            'review_text': comment,
            'review_date': publish_date_sql,
            'rating': rating,
            'category': category_value
        }

        columns = []
        values = []
        for key, value in field_values.items():
            columns.append(key)
            if value is None:
                values.append('NULL')
            elif key in {'score', 'star', 'comment_len', 'useful_count', 'review_count', 'rating'}:
                values.append(str(value))
            elif key in {'log_comment_len', 'log_useful_count', 'log_review_count', 'quality_score'}:
                values.append(str(value))
            elif key in {'images', 'categories'}:
                values.append(f"'{make_sql_safe(value)}'::jsonb")
            else:
                values.append(f"'{make_sql_safe(str(value))}'")

        statement = f"INSERT INTO comments ({', '.join(columns)}) VALUES ({', '.join(values)});"
        statements.append(statement)

output_path.parent.mkdir(parents=True, exist_ok=True)
with output_path.open('w', encoding='utf-8') as f:
    f.write('\n'.join(statements))

print(f'Generated {len(statements)} insert statements')
print(f'Output: {output_path}')
