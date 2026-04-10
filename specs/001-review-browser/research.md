# 研究报告：花园酒店评论浏览网页

**日期**: 2026-04-10  
**Phase**: Phase 0 - 研究与技术决策  
**规范**: [spec.md](./spec.md) | **计划**: [plan.md](./plan.md)

## 1. 数据导入策略研究

### 问题陈述

CSV 数据（enriched_comments.csv）需要导入到 Insforge PostgreSQL 数据库，同时进行数据转换和丰富。

### 决策：数据导入方案

**选择**: 使用 Insforge CLI 数据导入工具 + 自定义 Node.js 脚本进行数据转换

**理由**:
1. Insforge 提供原生数据导入工具，确保与平台集成顺利
2. CSV 需要字段转换（score → star、categories → category1-3），自定义脚本更灵活
3. 数据量估计 10k+ 记录，通过导入脚本可一次性加载，性能可接受

### 详细步骤

**Step 1: 创建 comments 表（Schema）**

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _id TEXT UNIQUE NOT NULL,              -- 原始 ID
  comment TEXT NOT NULL,                  -- 评论内容
  images JSONB,                          -- 图片 URL 数组
  score DECIMAL(3,2),                    -- 原始评分（可能有小数）
  star INTEGER CHECK (star >= 1 AND star <= 5),  -- 映射后的整数评分
  publish_date DATE,                     -- 发布日期
  room_type VARCHAR(100),                -- 房间类型
  fuzzy_room_type VARCHAR(100),          -- 模糊房间类型
  travel_type VARCHAR(100),              -- 旅行类型
  useful_count INTEGER DEFAULT 0,        -- 有用计数
  quality_score DECIMAL(5,2),            -- 品质分数
  category1 VARCHAR(50),                 -- 分类 1（小类名称）
  category2 VARCHAR(50),                 -- 分类 2（小类名称）
  category3 VARCHAR(50),                 -- 分类 3（小类名称）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以支持高效查询
CREATE INDEX idx_comments_star ON comments(star);
CREATE INDEX idx_comments_room_type ON comments(room_type);
CREATE INDEX idx_comments_travel_type ON comments(travel_type);
CREATE INDEX idx_comments_publish_date ON comments(publish_date DESC);
CREATE INDEX idx_comments_comment_tsvector ON comments 
  USING GIN(to_tsvector('chinese', comment));  -- 全文搜索索引
```

**Step 2: 编写数据转换脚本**

```javascript
// scripts/import-reviews.js（伪代码说明）
const Papa = require('papaparse');
const fs = require('fs');
const { createClient } = require('@insforge/sdk');

const client = createClient({
  baseUrl: process.env.INSFORGE_URL,
  anonKey: process.env.INSFORGE_ANON_KEY
});

async function importReviews() {
  // 1. 读取 CSV
  const csv = fs.readFileSync('./public/enriched_comments.csv', 'utf-8');
  const { data } = Papa.parse(csv, { header: true });
  
  // 2. 数据转换
  const transformed = data.map(row => ({
    _id: row._id,
    comment: row.comment,
    images: JSON.parse(row.images || '[]'),  // 解析 JSON 数组
    score: parseFloat(row.score),
    star: Math.max(1, Math.round(parseFloat(row.score))),  // 映射到 1-5
    publish_date: new Date(row.publish_date).toISOString().split('T')[0],
    room_type: row.room_type,
    fuzzy_room_type: row.fuzzy_room_type,
    travel_type: row.travel_type,
    useful_count: parseInt(row.useful_count || 0),
    quality_score: parseFloat(row.quality_score),
    category1: extractCategory(row.categories, 0),  // 提取第 1 个小类
    category2: extractCategory(row.categories, 1),  // 提取第 2 个小类
    category3: extractCategory(row.categories, 2),  // 提取第 3 个小类
  }));
  
  // 3. 批量插入到数据库（使用 Insforge bulk-upsert）
  const result = await client.from('comments')
    .insert(transformed)
    .select();
  
  console.log(`成功导入 ${result.length} 条评论`);
}

function extractCategory(categoriesStr, index) {
  // 解析 categories 字符串，提取第 index 个元素
  if (!categoriesStr) return null;
  const cats = categoriesStr.split(',').map(c => c.trim());
  return cats[index] || null;
}

importReviews().catch(console.error);
```

**Step 3: 数据验证**

- 验证导入行数与 CSV 一致
- 检查 star 字段值范围（1-5）
- 验证 images 字段有效 JSON
- 验证 publish_date 格式正确

### 决策：Categories 分类处理

**选择**: 在导入时将 categories 字符串拆解为 category1、category2、category3 三个字段

**理由**:
1. 原始数据中 categories 是小类名称列表，需要搜索/筛选时更方便
2. 创建三个独立字段，支持灵活查询（WHERE category1 = ? OR category2 = ? OR category3 = ?）
3. 预防未来需求扩展（如果需要大类分类，可另外创建映射表）

**Categories 分类体系**（供参考）:
- 设施类：房间设施、公共设施、餐饮设施
- 服务类：前台服务、客房服务、退房/入住效率
- 位置类：交通便利性、周边配套、景观/朝向
- 价格类：性价比、价格合理性
- 体验类：整体满意度、安静程度、卫生状况

---

## 2. API 设计研究

### 问题陈述

后端需要提供灵活的 API，支持分页、多条件筛选和全文搜索。

### 决策：API 设计

**选择**: 使用 Insforge PostgREST API + Next.js API Routes（可选代理层）

**理由**:
1. Insforge 原生提供 PostgREST API，自动生成 CRUD 接口
2. 支持复杂查询条件、排序、分页
3. Next.js API Routes 可作为代理层，进行响应转换、限流、认证等

### API 契约

#### 获取评论列表

```
GET /api/reviews?page=1&limit=20&scores=5,4&room_type=豪华间&travel_type=情侣&search=装修
```

**查询参数**:
- `page` (int, optional): 页码，默认 1
- `limit` (int, optional): 每页记录数，默认 20，最大 100
- `scores` (string, optional): 评分列表（逗号分隔），支持 1-5
- `room_type` (string, optional): 房间类型
- `travel_type` (string, optional): 旅行类型
- `search` (string, optional): 搜索关键词（全文搜索 comment 字段）
- `sort` (string, optional): 排序字段，格式 `field:asc|desc`，默认 `publish_date:desc`

**响应**:
```json
{
  "data": [
    {
      "id": "uuid",
      "_id": "原始ID",
      "comment": "评论内容",
      "images": ["url1", "url2"],
      "star": 5,
      "publish_date": "2023-01-01",
      "room_type": "豪华间",
      "travel_type": "情侣",
      "useful_count": 100,
      "quality_score": 8.5,
      "category1": "房间设施",
      "category2": null,
      "category3": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5000,
    "pages": 250
  }
}
```

**后端实现** (使用 Insforge SDK):
```typescript
// app/api/reviews/route.ts
import { createClient } from '@insforge/sdk';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const scores = searchParams.get('scores')?.split(',').map(Number);
  const roomType = searchParams.get('room_type');
  const travelType = searchParams.get('travel_type');
  const search = searchParams.get('search');
  
  const client = createClient({
    baseUrl: process.env.INSFORGE_URL,
    anonKey: process.env.INSFORGE_ANON_KEY,
  });
  
  let query = client.from('comments').select('*');
  
  // 应用筛选
  if (scores?.length) {
    query = query.in('star', scores);
  }
  if (roomType) {
    query = query.eq('room_type', roomType);
  }
  if (travelType) {
    query = query.eq('travel_type', travelType);
  }
  
  // 应用搜索（全文搜索）
  if (search) {
    query = query.textSearch('comment', search); // 或使用 LIKE
  }
  
  // 应用排序和分页
  query = query
    .order('publish_date', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  
  const { data, error, count } = await query;
  
  return Response.json({
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  });
}
```

#### 获取评论详情

```
GET /api/reviews/{id}
```

**响应**: 单个评论对象（同列表项的结构）

### 决策：搜索实现

**选择**: 使用 PostgreSQL 全文搜索 (TSVECTOR) 支持中文

**理由**:
1. PostgreSQL GIN 索引支持高效全文搜索
2. 支持中文分词（需要配置中文搜索配置）
3. 性能好，索引大小小

**实现**:
```sql
-- 创建索引
CREATE INDEX idx_comments_comment_tsvector ON comments 
  USING GIN(to_tsvector('chinese', comment));

-- 查询示例
SELECT * FROM comments 
WHERE to_tsvector('chinese', comment) @@ to_tsquery('chinese', '装修')
ORDER BY publish_date DESC
LIMIT 20;
```

**后端调用**:
```typescript
if (search) {
  query = query.textSearch('comment', search, {
    type: 'plain',  // 搜索类型
    config: 'chinese'  // 语言配置
  });
}
```

---

## 3. 前端数据流研究

### 问题陈述

前端需要高效管理评论列表、筛选状态、搜索状态之间的交互。

### 决策：状态管理方案

**选择**: 使用 React Hooks（useContext + useReducer）+ React Query（数据缓存）

**理由**:
1. 避免大型状态管理库（Redux、Zustand）的复杂度
2. React Hooks 原生支持，性能好
3. React Query 处理异步数据、缓存、重新验证

**实现结构**:

```typescript
// hooks/useReviews.ts - 管理评论列表数据
interface ReviewsState {
  data: Review[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; total: number; pages: number };
}

export function useReviews(filters: FilterOptions, searchQuery: string) {
  // 使用 React Query 处理数据获取、缓存、重新验证
  const query = useQuery({
    queryKey: ['reviews', filters, searchQuery],
    queryFn: () => fetchReviews(filters, searchQuery),
  });
  
  return { /* ... */ };
}

// hooks/useFilters.ts - 管理筛选条件
interface FilterState {
  scores: number[];
  roomType: string | null;
  travelType: string | null;
}

export function useFilters() {
  const [filters, dispatch] = useReducer(filterReducer, initialFilters);
  return { filters, updateScore, updateRoomType, /* ... */ };
}

// hooks/useSearch.ts - 管理搜索
export function useSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // 防抖搜索输入（300ms 延迟）
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);
  
  return debouncedQuery;
}
```

### 决策：跨组件通信

**选择**: 使用 useContext + 自定义 Hooks（不使用全局状态库）

**理由**:
1. 项目规模中等，无需 Redux 复杂性
2. Context API 足以支持筛选、搜索状态共享
3. 自定义 Hooks 提供更灵活的数据获取逻辑

---

## 4. 搜索和高亮研究

### 问题陈述

前端需要实现搜索结果过滤和关键词高亮显示。

### 决策：搜索高亮方案

**选择**: 客户端使用正则表达式高亮，后端使用全文搜索过滤

**理由**:
1. 后端全文搜索过滤数据，前端高亮显示
2. 避免在渲染时重复搜索，性能更好
3. 使用 React 组件库（如 react-highlight-words）简化实现

**实现**:

```typescript
// lib/search-utils.ts
import HighlightWords from 'react-highlight-words';

export function highlightSearchQuery(text: string, query: string) {
  return (
    <HighlightWords
      searchWords={[query]}
      autoEscape={true}
      textToHighlight={text}
      highlightClassName="bg-yellow-200"
    />
  );
}
```

---

## 5. 图片处理研究

### 问题陈述

CSV 中的 images 字段包含 URL 数组，需要在前端加载和预览。

### 决策：图片加载方案

**选择**: 使用 Next.js `<Image>` 组件 + Intersection Observer 懒加载

**理由**:
1. Next.js Image 组件自动优化（WebP、响应式尺寸）
2. Intersection Observer API 实现高效懒加载
3. 避免一次加载所有图片 URL

**实现**:

```typescript
// components/ImageModal.tsx
import Image from 'next/image';
import { useCallback, useRef } from 'react';

export function ImageModal({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // 使用 Intersection Observer 检测何时加载下一张图片
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && currentIndex + 1 < images.length) {
        // 预加载下一张图片
        const img = new window.Image();
        img.src = images[currentIndex + 1];
      }
    });
    
    if (imageRef.current) {
      observer.observe(imageRef.current);
    }
    
    return () => observer.disconnect();
  }, [currentIndex, images]);
  
  return (
    <div ref={imageRef}>
      <Image
        src={images[currentIndex]}
        alt={`评论图片 ${currentIndex + 1}`}
        width={600}
        height={600}
        priority={currentIndex === 0}
      />
      {/* 轮播控制 */}
    </div>
  );
}
```

---

## 6. 性能优化研究

### 问题陈述

需要达到 FCP ≤ 2.0s、LCP ≤ 2.5s、INP ≤ 200ms、JS ≤ 250KB (gzip)。

### 决策：性能优化策略

| 优化项 | 策略 | 预期效果 |
|------|------|--------|
| 代码分割 | 动态导入 ImageModal、DetailModal | 减少初始包大小 |
| 图片优化 | 使用 Next.js Image + WebP | 减少图片传输大小 30-40% |
| 数据库查询 | 分页（每页 20）+ 索引 | API 响应 ≤ 200ms |
| 防抖搜索 | 300ms 防抖延迟 | 减少 API 调用频率 |
| 缓存策略 | React Query + SWR | 避免重复请求 |
| CSS 优化 | Tailwind purge 配置 | 减少 CSS 文件大小 |

---

## 总结

所有关键技术决策已确认：

✅ **数据导入**: Node.js 脚本 + Insforge SDK  
✅ **后端 API**: PostgREST + Next.js API Routes  
✅ **前端状态**: React Hooks + React Query  
✅ **搜索**: PostgreSQL 全文搜索 + 客户端高亮  
✅ **图片**: Next.js Image + 懒加载  
✅ **性能**: 代码分割、图片优化、缓存、防抖  

**下一步**: Phase 1 设计，创建 `data-model.md`、`contracts/` 和 `quickstart.md`
