# 数据模型：花园酒店评论浏览网页

**日期**: 2026-04-10  
**Phase**: Phase 1 - 设计  
**规范**: [spec.md](./spec.md) | **研究**: [research.md](./research.md)

## 核心实体

### 1. Comment（评论）

**表名**: `comments`  
**用途**: 存储花园酒店所有评论数据

#### 字段定义

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 主键，系统自动生成 |
| _id | TEXT | UNIQUE NOT NULL | 原始评论 ID（来自 CSV） |
| comment | TEXT | NOT NULL | 评论文本内容（可能包含 HTML） |
| images | JSONB | NULL | 图片 URL 数组，格式: `["url1", "url2"]` |
| score | DECIMAL(3,2) | NULL | 原始评分（可能有小数，如 4.5） |
| star | INTEGER | CHECK (star >= 1 AND star <= 5) | 映射后的整数评分（1-5） |
| publish_date | DATE | NOT NULL | 评论发布日期 |
| room_type | VARCHAR(100) | NULL | 房间类型（如"豪华间"、"标准间"） |
| fuzzy_room_type | VARCHAR(100) | NULL | 模糊房间类型分类 |
| travel_type | VARCHAR(100) | NULL | 旅行类型（如"情侣"、"家庭"、"商务"） |
| useful_count | INTEGER | DEFAULT 0 | 有用计数，表示多少用户觉得有用 |
| quality_score | DECIMAL(5,2) | NOT NULL | 品质分数（系统计算） |
| category1 | VARCHAR(50) | NULL | 分类 1（小类名称，来自 categories 第 1 项） |
| category2 | VARCHAR(50) | NULL | 分类 2（小类名称，来自 categories 第 2 项） |
| category3 | VARCHAR(50) | NULL | 分类 3（小类名称，来自 categories 第 3 项） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 记录创建时间（系统自动） |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 记录更新时间（系统自动） |

#### 示例数据

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "_id": "68027895e3c98b0941765706",
  "comment": "房间非常好，卫生干净，装修很棒。服务也很好……",
  "images": ["https://images.example.com/img1.jpg", "https://images.example.com/img2.jpg"],
  "score": 4.8,
  "star": 5,
  "publish_date": "2023-12-15",
  "room_type": "豪华间",
  "fuzzy_room_type": "luxury_suite",
  "travel_type": "情侣",
  "useful_count": 128,
  "quality_score": 8.5,
  "category1": "房间设施",
  "category2": "整体满意度",
  "category3": null,
  "created_at": "2026-04-10T10:30:00Z",
  "updated_at": "2026-04-10T10:30:00Z"
}
```

#### 验证规则

- `star` MUST 在 1-5 之间
- `publish_date` MUST 是有效日期
- `images` 如果不为空，MUST 是有效的 JSON 数组
- `useful_count` MUST ≥ 0
- `quality_score` MUST ≥ 0

---

## 前端类型定义

```typescript
// types/index.ts

/**
 * 评论数据类型
 */
export interface Comment {
  id: string;
  _id: string;
  comment: string;
  images: string[] | null;
  score: number;
  star: number;  // 1-5
  publish_date: string;  // ISO 8601 日期
  room_type: string | null;
  fuzzy_room_type: string | null;
  travel_type: string | null;
  useful_count: number;
  quality_score: number;
  category1: string | null;
  category2: string | null;
  category3: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 评论列表分页响应
 */
export interface ReviewsListResponse {
  data: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * 筛选条件类型
 */
export interface FilterCriteria {
  scores?: number[];  // 选中的星级（1-5），支持多选
  roomType?: string;  // 房间类型
  travelType?: string;  // 旅行类型
}

/**
 * 搜索条件类型
 */
export interface SearchQuery {
  keyword: string;  // 搜索关键词
  field?: 'comment';  // 搜索字段（目前仅支持评论文本）
}

/**
 * 组合查询条件
 */
export interface ReviewsQuery extends FilterCriteria {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;  // 格式: "field:asc|desc"
}
```

---

## 数据库设计

### 创建表 SQL

```sql
-- 创建 comments 表
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL,
  comment TEXT NOT NULL,
  images JSONB,
  score DECIMAL(3,2),
  star INTEGER CHECK (star >= 1 AND star <= 5) NOT NULL,
  publish_date DATE NOT NULL,
  room_type VARCHAR(100),
  fuzzy_room_type VARCHAR(100),
  travel_type VARCHAR(100),
  useful_count INTEGER DEFAULT 0 NOT NULL,
  quality_score DECIMAL(5,2) NOT NULL,
  category1 VARCHAR(50),
  category2 VARCHAR(50),
  category3 VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以支持高效查询
CREATE INDEX idx_comments_star ON comments(star);
CREATE INDEX idx_comments_room_type ON comments(room_type);
CREATE INDEX idx_comments_travel_type ON comments(travel_type);
CREATE INDEX idx_comments_publish_date ON comments(publish_date DESC);

-- 全文搜索索引（需要配置中文分词）
CREATE INDEX idx_comments_comment_tsvector ON comments 
  USING GIN(to_tsvector('chinese', comment));

-- 复合索引（支持常见的组合查询）
CREATE INDEX idx_comments_star_room_type ON comments(star, room_type);
CREATE INDEX idx_comments_travel_type_publish_date ON comments(travel_type, publish_date DESC);
```

### 索引性能考虑

| 索引 | 用途 | 预期 |
|--------|------|------|
| `idx_comments_star` | WHERE star = ? 查询 | 快速筛选评分 |
| `idx_comments_room_type` | WHERE room_type = ? 查询 | 快速筛选房间类型 |
| `idx_comments_travel_type` | WHERE travel_type = ? 查询 | 快速筛选旅行类型 |
| `idx_comments_publish_date` | ORDER BY publish_date DESC 排序 | 快速排序 |
| `idx_comments_comment_tsvector` | 全文搜索 comment | 高效的 LIKE 查询 |
| `idx_comments_star_room_type` | AND 组合查询 | 更快的复合条件 |

---

## 查询模式

### 1. 获取评论列表（多条件筛选 + 分页）

```sql
SELECT * FROM comments
WHERE star IN (4, 5)  -- 评分 4 或 5 (OR 逻辑)
  AND room_type = '豪华间'  -- AND 逻辑
  AND travel_type = '情侣'  -- AND 逻辑
  AND to_tsvector('chinese', comment) @@ to_tsquery('chinese', '装修')  -- 全文搜索 (AND 逻辑)
ORDER BY publish_date DESC
LIMIT 20 OFFSET 0;
```

**性能**: 预计 < 200ms（使用上述索引）

### 2. 获取整数分页

```sql
SELECT COUNT(*) as total FROM comments
WHERE star IN (4, 5)
  AND room_type = '豪华间'
  AND travel_type = '情侣'
  AND to_tsvector('chinese', comment) @@ to_tsquery('chinese', '装修');
```

### 3. 获取评论详情

```sql
SELECT * FROM comments WHERE id = $1;
```

---

## 数据完整性

### 约束

1. **主键约束**: `id` 唯一且不为空
2. **唯一性约束**: `_id` 唯一（防止重复导入）
3. **检查约束**: `star` 在 1-5 之间，`useful_count` ≥ 0
4. **非空约束**: 关键字段（`comment`, `star`, `publish_date`, `quality_score`）不为空

### 触发器（可选）

```sql
-- 自动更新 updated_at 时间戳
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## 数据导入映射

从 CSV 到数据库字段的映射关系：

| CSV 字段 | 数据库字段 | 转换逻辑 |
|---------|---------|---------|
| _id | _id | 直接复制 |
| comment | comment | 直接复制 |
| images | images | 解析 JSON 数组 |
| score | score, star | score 直接保存；star = ROUND(score)，最小值 1 |
| publish_date | publish_date | 转换为 ISO 8601 日期 |
| room_type | room_type | 直接复制 |
| fuzzy_room_type | fuzzy_room_type | 直接复制 |
| travel_type | travel_type | 直接复制 |
| useful_count | useful_count | 转换为 INTEGER |
| quality_score | quality_score | 直接复制 |
| categories | category1, category2, category3 | 分解字符串，提取前 3 项 |

---

## 关键设计决策

### 为什么 star 字段独立？

- CSV 中的 `score` 可能有小数（如 4.8），但前端需要 1-5 整数评分显示星级
- 独立 `star` 字段避免前端每次都转换，提升查询性能
- 保留 `score` 字段，便于后续分析精确评分

### 为什么拆解 categories？

- 原始数据中 categories 是字符串列表，拆解为 3 个字段便于 SQL 查询
- 支持 WHERE (category1 = ? OR category2 = ? OR category3 = ?) 的查询模式
- 预防需求扩展，如果需要大类分门，可创建额外的分类表

### 为什么使用 JSONB 存储 images？

- images 是数组类型，JSONB 是 PostgreSQL 的原生 JSON 类型
- 支持 JSON 操作符和索引，便于后续扩展（如图片元数据）
- 比 TEXT 存储更灵活，查询性能更好

---

## 预期数据量

- **总记录数**: ~10,000+ 条评论
- **表大小**: ~100-200 MB（取决于评论文本长度和图片 URL 数量）
- **索引大小**: ~50 MB

**性能预测**:
- 简单查询（单条件）: < 50ms
- 复杂查询（多条件 + 搜索）: < 200ms
- 列表分页（20 条）: < 100ms

