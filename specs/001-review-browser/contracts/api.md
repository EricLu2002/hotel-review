# API 契约：花园酒店评论浏览网页

**日期**: 2026-04-10  
**Phase**: Phase 1 - 设计  

## API 设计原则

1. **REST 风格**: 使用标准 HTTP 方法和状态码
2. **一致的响应格式**: 所有端点返回统一的 JSON 结构
3. **错误处理**: 清晰的错误消息和错误代码
4. **性能**: 分页、缓存优化

---

## 端点概览

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/reviews` | 获取评论列表（支持筛选、搜索、分页） |
| GET | `/api/reviews/{id}` | 获取单个评论详情 |
| GET | `/api/reviews/filters/options` | 获取所有可用的筛选选项 |

---

## 1. 获取评论列表

### 请求

```
GET /api/reviews?page=1&limit=20&scores=5,4&room_type=豪华间&search=装修
```

### 查询参数

| 参数 | 类型 | 必须 | 说明 | 示例 |
|------|------|------|------|------|
| page | Integer | No | 页码，从 1 开始，默认 1 | `1` |
| limit | Integer | No | 每页记录数，默认 20，最大 100 | `20` |
| scores | String | No | 评分列表，逗号分隔，值为 1-5 | `5,4` |
| room_type | String | No | 房间类型 | `豪华间` |
| travel_type | String | No | 旅行类型 | `情侣` |
| search | String | No | 搜索关键词（全文搜索 comment 字段） | `装修` |
| sort | String | No | 排序，格式 `field:asc\|desc`，默认 `publish_date:desc` | `publish_date:desc` |

### 查询示例

```
GET /api/reviews?page=1&limit=20
GET /api/reviews?page=2&limit=20&scores=5
GET /api/reviews?page=1&limit=20&scores=5,4&room_type=豪华间
GET /api/reviews?page=1&limit=20&search=装修
GET /api/reviews?page=1&limit=20&scores=5&search=装修&sort=useful_count:desc
```

### 响应（200 OK）

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "_id": "68027895e3c98b0941765706",
      "comment": "房间非常好……",
      "images": [
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg"
      ],
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
      "category3": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5280,
    "pages": 264
  },
  "timestamp": "2026-04-10T10:30:00Z"
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| success | Boolean | 请求是否成功 |
| data | Array | 评论对象数组（如果无搜索结果，为空数组） |
| pagination | Object | 分页信息 |
| pagination.page | Integer | 当前页码 |
| pagination.limit | Integer | 每页记录数 |
| pagination.total | Integer | 总记录数 |
| pagination.pages | Integer | 总页数 |
| timestamp | String | 响应时间戳（ISO 8601 格式） |

### 错误响应

#### 400 Bad Request - 无效参数

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAM",
    "message": "Invalid page parameter: must be a positive integer",
    "details": {
      "param": "page",
      "value": "-1"
    }
  },
  "timestamp": "2026-04-10T10:30:00Z"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch reviews from database",
    "requestId": "req_12345"
  },
  "timestamp": "2026-04-10T10:30:00Z"
}
```

### 性能要求

- **响应时间**: P95 < 500ms
- **缓存**: 使用 React Query 缓存相同查询条件
- **分页**: 支持最多 100 条/页（避免大查询）

---

## 2. 获取评论详情

### 请求

```
GET /api/reviews/{id}
```

### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 评论 ID |

### 响应（200 OK）

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "_id": "68027895e3c98b0941765706",
    "comment": "房间非常好，卫生干净，装修很棒。服务也很好，门厅拿货李迎客开门比一些国际连锁的五星要好多了……",
    "images": [
      "https://example.com/img1.jpg",
      "https://example.com/img2.jpg",
      "https://example.com/img3.jpg"
    ],
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
  },
  "timestamp": "2026-04-10T10:30:00Z"
}
```

### 错误响应

#### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Review not found",
    "details": {
      "id": "550e8400-e29b-41d4-a716-446655440001"
    }
  },
  "timestamp": "2026-04-10T10:30:00Z"
}
```

### 性能要求

- **响应时间**: P95 < 200ms
- **缓存**: 使用 React Query 缓存

---

## 3. 获取筛选选项（可选增强功能）

### 请求

```
GET /api/reviews/filters/options
```

### 响应（200 OK）

```json
{
  "success": true,
  "data": {
    "scores": [
      { "value": 1, "label": "1 星", "count": 120 },
      { "value": 2, "label": "2 星", "count": 245 },
      { "value": 3, "label": "3 星", "count": 680 },
      { "value": 4, "label": "4 星", "count": 1450 },
      { "value": 5, "label": "5 星", "count": 2785 }
    ],
    "roomTypes": [
      { "value": "豪华间", "label": "豪华间", "count": 1520 },
      { "value": "标准间", "label": "标准间", "count": 2100 },
      { "value": "商务间", "label": "商务间", "count": 890 }
    ],
    "travelTypes": [
      { "value": "情侣", "label": "情侣", "count": 1890 },
      { "value": "家庭", "label": "家庭", "count": 1650 },
      { "value": "商务", "label": "商务", "count": 970 }
    ]
  },
  "timestamp": "2026-04-10T10:30:00Z"
}
```

### 性能要求

- **响应时间**: P95 < 200ms
- **缓存**: 长期缓存（7 天或更久）

---

## 错误代码清单

| 代码 | HTTP 状态 | 说明 |
|------|---------|------|
| INVALID_PARAM | 400 | 无效的查询参数 |
| INVALID_PAGE | 400 | 页码无效（不是正整数或超出范围） |
| DATABASE_ERROR | 500 | 数据库查询错误 |
| NOT_FOUND | 404 | 请求的资源不存在 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 实现细则

### 后端实现（Next.js API Routes）

```typescript
// app/api/reviews/route.ts
import { createClient } from '@insforge/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 参数验证和提取
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const scores = searchParams.get('scores')?.split(',').map(Number).filter(s => s >= 1 && s <= 5);
    const roomType = searchParams.get('room_type');
    const travelType = searchParams.get('travel_type');
    const search = searchParams.get('search');
    
    // 创建 Insforge 客户端
    const client = createClient({
      baseUrl: process.env.INSFORGE_URL!,
      anonKey: process.env.INSFORGE_ANON_KEY!,
    });
    
    // 构建查询
    let query = client
      .from('comments')
      .select('*', { count: 'exact' });
    
    // 应用过滤条件
    if (scores?.length) {
      query = query.in('star', scores);
    }
    if (roomType) {
      query = query.eq('room_type', roomType);
    }
    if (travelType) {
      query = query.eq('travel_type', travelType);
    }
    
    // 应用搜索条件
    if (search) {
      query = query.textSearch('comment', search, {
        type: 'plain',
        config: 'chinese'
      });
    }
    
    // 应用排序和分页
    query = query
      .order('publish_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch reviews from database',
            requestId: request.headers.get('x-request-id'),
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
```

---

## 前端调用示例

```typescript
// hooks/useReviews.ts
import { useQuery } from '@tanstack/react-query';
import { Comment, ReviewsListResponse } from '@/types';

export interface FetchReviewsParams {
  page?: number;
  limit?: number;
  scores?: number[];
  roomType?: string;
  travelType?: string;
  search?: string;
}

async function fetchReviews(params: FetchReviewsParams): Promise<ReviewsListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.scores?.length) searchParams.set('scores', params.scores.join(','));
  if (params.roomType) searchParams.set('room_type', params.roomType);
  if (params.travelType) searchParams.set('travel_type', params.travelType);
  if (params.search) searchParams.set('search', params.search);
  
  const response = await fetch(`/api/reviews?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch reviews: ${response.statusText}`);
  }
  
  return response.json();
}

export function useReviews(params: FetchReviewsParams) {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => fetchReviews(params),
    staleTime: 1000 * 60,  // 1 分钟
    gcTime: 1000 * 60 * 5,  // 5 分钟（之前叫 cacheTime）
  });
}
```

---

## 测试清单

### 单元测试

- [ ] 参数验证（页码、分页数等）
- [ ] 评分筛选逻辑（单个、多个）
- [ ] 房间类型筛选逻辑
- [ ] 旅行类型筛选逻辑
- [ ] 搜索关键词高亮
- [ ] 错误处理（无结果、无效 ID 等）

### 集成测试

- [ ] 获取评论列表（全量）
- [ ] 获取評論列表（带过滤）
- [ ] 获取评论列表（带搜索）
- [ ] 获取评论列表（带排序）
- [ ] 获取单个评论详情
- [ ] 多条件组合查询

### 性能测试

- [ ] API 响应时间（< 500ms P95）
- [ ] 缓存验证（使用 React Query）
- [ ] 大数据集分页（> 10k 记录）

