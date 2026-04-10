# 实现计划：花园酒店评论浏览网页

**分支**: `001-review-browser` | **日期**: 2026-04-10 | **规范**: [spec.md](./spec.md)  
**输入**: 功能规范来自 `/specs/001-review-browser/spec.md`

## 摘要

构建一个花园酒店评论浏览网页，用户可以完整查看历史评论数据，支持按评分、房间类型、旅行类型多维度筛选，支持关键词搜索和图片预览。

**技术方案**: 使用 Next.js 作为前端框架，Insforge 作为后端 BaaS 平台。数据导入策略：从 CSV 导入原始数据到 Insforge PostgreSQL 数据库，并在导入过程中丰富数据（添加衍生字段如 star 评分映射、category 分类分解）。

## 技术上下文

**语言/版本**: TypeScript 5.x（Next.js 14.x）、Node.js 18+  
**主要依赖**: 
- 前端：Next.js 14、React 18、TypeScript、Tailwind CSS 3.4、@insforge/sdk
- 后端：Insforge PostgreSQL、PostgREST API
- 工具：Vitest（单元测试）、Playwright（E2E 测试）

**存储**: PostgreSQL（通过 Insforge 数据库服务）  
**测试框架**: Vitest + React Testing Library（单元测试）、Playwright（E2E）  
**目标平台**: 现代 Web 浏览器（Chrome 120+、Firefox 121+、Safari 17+、Edge 120+）  
**项目类型**: 全栈 Web 应用（Frontend + Backend 集成）

**性能目标**:
- 首页加载：FCP ≤ 2.0s、LCP ≤ 2.5s、INP ≤ 200ms
- API 响应：≤ 500ms（P95）
- JS 包大小：≤ 250KB (gzip)
- 列表分页：每页 20 条，从 Insforge 数据库分页查询

**约束条件**:
- 搜索和筛选响应时间 ≤ 300ms（用户界面交互）
- 图片预览加载时间 ≤ 500ms
- 所有新代码测试覆盖率 ≥ 80%
- 严格的代码质量标准（无 `any` 类型、圈复杂度 ≤ 10）

**业务范围**:
- 1 个 CSV 数据源（enriched_comments.csv，估计 10k+ 条记录）
- 6 个用户故事（2+2+2 优先级分布）
- 多维筛选（评分、房间类型、旅行类型）+ 关键词搜索 + 图片预览

## 宪法检查

*GATE：必须在 Phase 0 研究前通过。Phase 1 设计后重新检查。*

### 代码质量标准 ✅

需求：无 `any` 类型、圈复杂度 ≤ 10、完整的 JSDoc 文档  
**验证**: 
- ✅ 使用 TypeScript strict mode，eslint 配置强制无 `any`
- ✅ Sonarqube 或 ts-complexity-checks 在 CI 中检查圈复杂度
- ✅ 所有公开组件和函数都有 JSDoc 注释

### 测试优先原则 ✅

需求：单元测试覆盖率 ≥ 80%（新代码）  
**验证**:
- ✅ 使用 Vitest + React Testing Library 编写单元测试
- ✅ 集成测试覆盖数据库操作和 API 交互
- ✅ 所有数据导入逻辑都有测试

### 用户体验一致性 ✅

需求：Tailwind CSS 3.4、响应式设计（320px-1024px+）、WCAG 2.1 AA  
**验证**:
- ✅ 所有 UI 都使用 Tailwind CSS 3.4（禁止升级到 v4）
- ✅ 设计响应式组件，支持 mobile、tablet、desktop 视口
- ✅ 页面包括无障碍属性（alt 文本、aria 标签、键盘导航）

### 性能需求规范 ✅

需求：FCP ≤ 2.0s、LCP ≤ 2.5s、INP ≤ 200ms、JS ≤ 250KB (gzip)  
**验证**:
- ✅ 使用 Next.js 代码分割和动态导入优化捆绑包大小
- ✅ Lighthouse CI 集成，设置评分检查 ≥ 85
- ✅ Web Vitals 集成，实时监控性能指标

**门禁状态**: ✅ **通过** - 所有宪法要求都可以在此项目中满足

## 项目结构

### 文档结构（当前功能）

```text
specs/001-review-browser/
├── plan.md              # 此文件（实现计划）
├── research.md          # Phase 0 输出：研究和技术决策
├── data-model.md        # Phase 1 输出：数据模型和数据库 schema
├── quickstart.md        # Phase 1 输出：快速启动指南
├── contracts/           # Phase 1 输出：API contracts
│   ├── database.md      # 查询和数据库操作规范
│   └── api.md           # Insforge API 调用规范
└── tasks.md             # Phase 2 输出（由 /speckit.tasks 创建）
```

### 源代码结构

```text
# 前端（Next.js）
app/
├── (reviews)/                      # 评论相关页面
│   ├── page.tsx                   # 主列表页面
│   ├── [id]/
│   │   └── page.tsx               # 评论详情页
│   └── layout.tsx                 # 整体布局
├── api/                           # 后端 API 路由（可选的代理层）
│   └── reviews/
│       ├── route.ts               # 列表 API
│       └── [id]/route.ts          # 详情 API
├── components/                    # React 组件
│   ├── ReviewCard.tsx            # 评论卡片
│   ├── ReviewList.tsx            # 评论列表
│   ├── FilterPanel.tsx           # 筛选面板
│   ├── SearchBar.tsx             # 搜索框
│   ├── ImageModal.tsx            # 图片预览模态框
│   └── Pagination.tsx            # 分页组件
├── hooks/                        # React Hooks
│   ├── useReviews.ts            # 评论数据获取 hook
│   ├── useFilters.ts            # 筛选状态管理 hook
│   └── useSearch.ts             # 搜索功能 hook
├── lib/                         # 工具函数
│   ├── insforge-client.ts       # Insforge SDK 初始化
│   ├── search-utils.ts          # 搜索和高亮函数
│   ├── date-utils.ts            # 日期格式化
│   └── constants.ts             # 常量和配置
├── types/                       # TypeScript 类型定义
│   └── index.ts                 # Review, Filter, Search 类型
└── styles/                      # 全局样式
    └── globals.css              # Tailwind 配置和自定义样式

# 单元测试
tests/unit/
├── components/
│   ├── ReviewCard.test.tsx
│   ├── ReviewList.test.tsx
│   ├── FilterPanel.test.tsx
│   └── SearchBar.test.tsx
├── hooks/
│   ├── useReviews.test.ts
│   ├── useFilters.test.ts
│   └── useSearch.test.ts
└── lib/
    ├── search-utils.test.ts
    └── date-utils.test.ts

# 集成测试
tests/integration/
├── review-list-flow.test.ts     # 评论列表完整流程
├── filtering-flow.test.ts       # 筛选功能完整流程
└── search-flow.test.ts          # 搜索功能完整流程

# E2E 测试（Playwright）
tests/e2e/
├── review-browsing.spec.ts      # 用户浏览评论
├── filtering-search.spec.ts     # 筛选和搜索交互
└── image-preview.spec.ts        # 图片预览功能
```

**结构决策**: 选择 Next.js App Router 架构，利用其内置的性能优化（代码分割、SSR、ISR），结合 Insforge SDK 进行数据库操作。所有前端状态管理使用 React hooks（useContext/useReducer），避免大型状态库的复杂度。

## 关键实现决策

### 1. 数据导入策略

**当前状态**: 数据存在 CSV 文件中  
**目标**: 数据在 Insforge PostgreSQL 数据库中，支持高效查询和筛选

**方案**:
1. 创建 `comments` 表，包含所有原始字段和衍生字段
2. 编写数据导入脚本（Node.js），使用 Insforge CLI 或 SDK
3. 处理特殊字段：
   - `images`: CSV 中是 JSON 数组，保存为字符串或 JSON 类型
   - `score`: 转换为 `star` 整数字段（1-5）
   - `categories`: 分解为 `category1`、`category2`、`category3` 字符串字段
4. 添加必要的数据库索引（score、room_type、travel_type、publish_date）

**验证**: 导入脚本运行无错误，数据行数和字段准确

### 2. 前后端交互

**数据流**:
- Frontend: Next.js 应用
- SDK: @insforge/sdk 调用后端 API
- Backend: Insforge PostgreSQL 和 PostgREST API
- 查询: 分页查询（limit/offset）、条件过滤、全文搜索

**API 契约**:
- 获取评论列表：`GET /reviews?page=1&limit=20&score=5&room_type=xxx&search=装修`
- 获取评论详情：`GET /reviews/{id}`

### 3. 搜索和筛选逻辑

**前端**:
- 使用 React Context 维护筛选和搜索状态
- 实时搜索（用户输入时实时搜索，不需要提交）
- 关键词高亮：使用 `<mark>` 元素或自定义语法高亮

**后端**:
- 使用 PostgreSQL 的全文搜索（TSVECTOR）或 LIKE 查询
- 复合条件组合：WHERE (score IN (...)) AND (room_type = ?) AND (comment ILIKE ?)
- 分页：LIMIT 20 OFFSET (page-1)*20

### 4. 性能优化策略

**数据加载**:
- 首页初始化时加载第一页（20 条）
- 分页时懒加载下一页
- 关键字段索引（score、room_type、travel_type）

**前端渲染**:
- 组件代码分割：DetailModal、ImageModal 懒加载
- 图片懒加载：使用 `next/image` 或 Intersection Observer
- 虚拟列表（如果评论数很多，使用 react-window）

**缓存**:
- 使用 Insforge 的缓存策略（如果支持）
- 前端使用 SWR 或 React Query 进行本地缓存和重新验证

## 复杂性追踪

> 当前项目预期中等复杂度。主要挑战包括：

| 挑战 | 解决方案 | 理由 |
|------|--------|------|
| CSV 数据导入和转换 | Node.js 导入脚本 + Insforge SDK | 确保数据准确性和一致性 |
| 多维过滤和搜索 | PostgreSQL 复合 WHERE 条件 + TSVECTOR | 必要的数据库性能优化 |
| 图片 Preview 的异步加载 | 使用 Intersection Observer + next/image | 避免一次加载所有图片 URL |
| 高频搜索/筛选的性能 | 防抖、分页、数据库索引 | 满足 ≤300ms 响应时间 |

---

**Phase 0 研究预计完成时间**: 1 天（确认导入策略、API 设计）  
**Phase 1 设计预计完成时间**: 1 天（数据模型、contracts、快速入门）

下一步: 执行 Phase 0 研究，生成 `research.md`
