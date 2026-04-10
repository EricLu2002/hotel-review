# 快速启动指南：花园酒店评论浏览网页

**日期**: 2026-04-10  
**Phase**: Phase 1 - 设计

## 项目概览

这是一个 Next.js + Insforge 全栈应用，展示花园酒店的评论数据，支持多维筛选、搜索和图片预览。

**技术栈**:
- **前端**: Next.js 14、React 18、TypeScript、Tailwind CSS 3.4
- **后端**: Insforge (PostgreSQL + PostgREST API)
- **测试**: Vitest、React Testing Library、Playwright

---

## 前置要求

- Node.js 18+ 和 npm/pnpm
- Insforge 账户（已配置，见 `.insforge/config.json`）
- Git

---

## 开发环境设置

### 1. 克隆仓库并安装依赖

```bash
cd hotel-review
npm install
# 或
pnpm install
```

### 2. 配置环境变量

在项目根目录创建 `.env.local`：

```env
# Insforge 配置
INSFORGE_URL=https://6v7dmzzu.ap-southeast.insforge.app
INSFORGE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 可选：调试开关
NEXT_PUBLIC_DEBUG=false
```

✅ **注**: Insforge 配置已通过 `npx @insforge/cli link` 配置完成

### 3. 数据导入（一次性）

```bash
# 创建数据导入脚本
cat > scripts/import-reviews.js << 'EOF'
// 见 research.md 中的数据导入脚本
EOF

# 运行导入脚本
node scripts/import-reviews.js

# 验证导入结果（可选）
npm run db:seed  # 如果项目提供
```

### 4. 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 项目结构快速导航

```
app/                          # Next.js App Router
├── page.tsx                  # 主页（评论列表）
├── layout.tsx                # 根布局
├── (reviews)/                # 评论相关路由
│   ├── page.tsx             # 列表页
│   └── [id]/page.tsx        # 详情页
└── api/
    └── reviews/
        └── route.ts         # API 端点

components/                   # React 组件
├── ReviewCard.tsx           # 评论卡片
├── ReviewList.tsx           # 列表
├── FilterPanel.tsx          # 筛选面板
├── SearchBar.tsx            # 搜索框
└── ImageModal.tsx           # 图片预览

hooks/                        # React Hooks
├── useReviews.ts           # 评论数据获取
├── useFilters.ts           # 筛选状态
└── useSearch.ts            # 搜索功能

lib/                          # 工具库
├── insforge-client.ts      # SDK 初始化
├── search-utils.ts         # 搜索高亮
└── constants.ts            # 常量
```

---

## 核心开发流程

### 添加新功能（例：按标签筛选）

#### Step 1: 数据模型（如需）

编辑 `lib/types.ts`：

```typescript
export interface FilterCriteria {
  tags?: string[];  // 新增
  // ...
}
```

#### Step 2: 后端 API（如需）

编辑 `app/api/reviews/route.ts`：

```typescript
if (tags?.length) {
  query = query.in('tag', tags);  // 假设数据库有 tag 字段
}
```

#### Step 3: 前端 Hook

创建或编辑 `hooks/useFilters.ts`：

```typescript
const [tags, setTags] = useState<string[]>([]);

const handleTagToggle = (tag: string) => {
  setTags(prev =>
    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
  );
};
```

#### Step 4: UI 组件

编辑 `components/FilterPanel.tsx`，添加标签按钮

#### Step 5: 集成测试

创建 `tests/unit/components/FilterPanel.test.tsx`：

```typescript
describe('FilterPanel - Tags', () => {
  it('SHOULD toggle tag selection WHEN tag is clicked', () => {
    // 期望行为...
  });
});
```

#### Step 6: 数据库迁移（如需）

```sql
-- 添加 tag 字段到 comments 表
ALTER TABLE comments ADD COLUMN tags TEXT[];
```

---

## 常见开发任务

### 本地测试

```bash
# 单元测试
npm run test

# 集成和 E2E 测试
npm run test:e2e

# 覆盖率报告
npm run test:coverage
```

### 代码质量检查

```bash
# ESLint 检查
npm run lint

# 类型检查
npm run type-check

# 代码格式化（Prettier）
npm run format
```

### 构建和部署

```bash
# 生产构建
npm run build

# 启动生产服务器
npm run start

# 性能分析
npm run analyze
```

### 数据库管理

```bash
# 查看数据库状态（假设提供）
npm run db:status

# 创建迁移
npm run db:migrate create add_new_field

# 运行迁移
npm run db:migrate run
```

---

## API 快速参考

### 获取评论列表

```typescript
// 使用 Hook
const { data, isLoading, error } = useReviews({
  page: 1,
  limit: 20,
  scores: [5, 4],
  roomType: '豪华间',
  search: '装修',
});
```

### 获取单个评论

```typescript
const { data: review } = useQuery({
  queryKey: ['reviews', id],
  queryFn: () => fetch(`/api/reviews/${id}`).then(r => r.json()),
});
```

---

## 数据库快速参考

### 连接数据库（通过 Insforge）

```typescript
import { createClient } from '@insforge/sdk';

const client = createClient({
  baseUrl: process.env.INSFORGE_URL,
  anonKey: process.env.INSFORGE_ANON_KEY,
});

// 查询
const { data } = await client
  .from('comments')
  .select('*')
  .eq('star', 5)
  .limit(20);
```

### 常用查询

```typescript
// 获取热门评论（按有用计数）
const { data } = await client
  .from('comments')
  .select('*')
  .order('useful_count', { ascending: false })
  .limit(10);

// 获取特定日期的评论
const { data } = await client
  .from('comments')
  .select('*')
  .gte('publish_date', '2023-01-01')
  .lte('publish_date', '2023-12-31');

// 全文搜索
const { data } = await client
  .from('comments')
  .select('*')
  .textSearch('comment', '装修');
```

---

## 性能优化提示

### 1. 图片加载

使用 Next.js `<Image>` 组件自动优化：

```tsx
import Image from 'next/image';

<Image
  src={imageUrl}
  alt="评论图片"
  width={600}
  height={600}
  priority={index === 0}  // 首张图片优先加载
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 2. 数据缓存

使用 React Query 缓存 API 响应：

```typescript
const { data } = useQuery({
  queryKey: ['reviews', filters],
  queryFn: () => fetchReviews(filters),
  staleTime: 60000,  // 1 分钟内不重新获取
  gcTime: 300000,    // 5 分钟后垃圾回收
});
```

### 3. 代码分割

懒加载大组件：

```typescript
import dynamic from 'next/dynamic';

const ImageModal = dynamic(() => import('@/components/ImageModal'), {
  loading: () => <div>Loading...</div>,
});
```

### 4. 防抖搜索

```typescript
const [search, setSearch] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), 300);
  return () => clearTimeout(timer);
}, [search]);
```

---

## 调试技巧

### 1. 浏览器 DevTools

- Network: 查看 API 请求/响应
- Performance: 分析页面性能
- React DevTools: 检查组件状态

### 2. 服务器日志

```bash
# 启用详细日志
NEXT_PUBLIC_DEBUG=true npm run dev
```

### 3. 数据库查询调试

```typescript
// 启用 Insforge 客户端日志（如支持）
const client = createClient({
  baseUrl: process.env.INSFORGE_URL,
  anonKey: process.env.INSFORGE_ANON_KEY,
  debug: true,  // 调试模式
});
```

---

## 常见问题排查

### Q: API 返回 500 错误

**A**: 检查：
- 环境变量是否正确（INSFORGE_URL、INSFORGE_ANON_KEY）
- Insforge 后端是否在线
- 数据库连接是否正常

```bash
# 测试 Insforge 连接
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://6v7dmzzu.ap-southeast.insforge.app/rest/v1/comments?limit=1
```

### Q: 图片无法加载

**A**: 
- 检查 .env.local 中的图片 URL 是否有效
- 确认图片 URL 可访问（CORS 配置）
- 检查浏览器 Network 标签查看 HTTP 状态码

### Q: 搜索没有结果

**A**:
- 确认数据库中有匹配的评论
- 检查搜索关键词是否正确（中英文、大小写）
- 确认全文搜索索引已创建（运行 research.md 中的 SQL）

### Q: 性能缓慢

**A**:
- 检查 Network 标签，API 响应时间是否 > 500ms
- 运行 `npm run analyze` 查看包大小
- 检查 Lighthouse 评分（Chrome DevTools）
- 确认数据库索引已创建

---

## 下一步

1. **完成数据导入**: 运行 `scripts/import-reviews.js`
2. **开发主列表页**: `components/ReviewList.tsx`
3. **实现筛选功能**: `components/FilterPanel.tsx`
4. **实现搜索功能**: `components/SearchBar.tsx`  
5. **开发详情页**: `app/(reviews)/[id]/page.tsx`
6. **图片预览**: `components/ImageModal.tsx`
7. **编写测试**: `tests/` 目录
8. **部署和优化**: 生产构建和性能调优

---

## 资源

- [Next.js 文档](https://nextjs.org/docs)
- [Insforge 文档](https://insforge.com/docs)
- [React Query 文档](https://tanstack.com/query/latest)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Vitest 文档](https://vitest.dev/)

---

**最后更新**: 2026-04-10  
**维护人员**: 开发团队  
**反馈**: 如有问题，请创建 GitHub Issue
