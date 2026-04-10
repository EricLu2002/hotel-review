-- Comments review table for InsForge/PostgreSQL
DROP TABLE IF EXISTS comments;
create table comments (
  id SERIAL PRIMARY KEY,
  _id TEXT UNIQUE NOT NULL,
  comment TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  score DECIMAL(3,2),
  star INTEGER NOT NULL CHECK (star >= 1 AND star <= 5),
  publish_date DATE NOT NULL,
  room_type VARCHAR(100),
  fuzzy_room_type VARCHAR(100),
  travel_type VARCHAR(100),
  comment_len INTEGER,
  log_comment_len NUMERIC(8,4),
  useful_count INTEGER NOT NULL DEFAULT 0,
  log_useful_count NUMERIC(8,4),
  review_count INTEGER NOT NULL DEFAULT 0,
  log_review_count NUMERIC(8,4),
  quality_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  category1 VARCHAR(50),
  category2 VARCHAR(50),
  category3 VARCHAR(50),
  hotel_name TEXT NOT NULL DEFAULT '未知酒店',
  location TEXT NOT NULL DEFAULT '未知地点',
  reviewer_name TEXT NOT NULL DEFAULT '匿名',
  review_title TEXT,
  review_text TEXT,
  review_date DATE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  category TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Example indexes for efficient filtering and search
create index if not exists idx_comments_star on comments(star);
create index if not exists idx_comments_room_type on comments(room_type);
create index if not exists idx_comments_travel_type on comments(travel_type);
create index if not exists idx_comments_publish_date on comments(publish_date desc);
create index if not exists idx_comments_comment_tsvector on comments using gin(to_tsvector('chinese', coalesce(comment, '')));
create index if not exists idx_comments_star_room_type on comments(star, room_type);
create index if not exists idx_comments_travel_type_publish_date on comments(travel_type, publish_date desc);
