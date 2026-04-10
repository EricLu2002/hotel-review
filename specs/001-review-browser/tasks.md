# 任务列表：花园酒店评论浏览网页

**输入**: 设计文档来自 `/specs/001-review-browser/`  
**前提**: 已完成 `plan.md`、`research.md`、`data-model.md`、`contracts/api.md`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 创建 Next.js 项目结构并添加必要目录 `app/`, `components/`, `hooks/`, `lib/`, `types/`, `tests/`
- [ ] T002 在 `package.json` 中配置 `next`, `react`, `typescript`, `tailwindcss`, `@insforge/sdk`, `vitest`, `@testing-library/react`, `playwright`
- [ ] T003 在 `lib/insforge-client.ts` 中初始化 Insforge SDK 客户端，并配置环境变量读取逻辑
- [ ] T004 在 `tailwind.config.js` 和 `postcss.config.js` 中配置 Tailwind CSS 3.4，确保项目使用 Tailwind CSS 3.4 而不是 v4
- [ ] T005 在 `tsconfig.json` 中启用 `strict` 模式和 React 类型检查，确保 TypeScript 严格类型安全

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T006 在 `scripts/db/schema.sql` 中创建 `comments` 表 schema，包含 `_id`, `comment`, `images`, `score`, `star`, `publish_date`, `room_type`, `fuzzy_room_type`, `travel_type`, `useful_count`, `quality_score`, `category1`, `category2`, `category3`
- [ ] T007 在 `scripts/db/schema.sql` 中为 `star`, `room_type`, `travel_type`, `publish_date` 和全文搜索 `comment` 创建索引
- [ ] T008 在 `scripts/import-comments.ts` 中编写 CSV 导入脚本，将 `public/enriched_comments.csv` 导入 Insforge 数据库，并处理 `images` JSON 数组、`score`→`star` 映射、`categories` 拆分
- [ ] T009 在 `types/index.ts` 中定义 `Comment`, `ReviewsListResponse`, `FilterCriteria`, `SearchQuery`, `ReviewsQuery` 等核心类型
- [ ] T010 在 `app/api/reviews/route.ts` 中实现评论列表 API，支持分页、评分多选筛选、房间类型筛选、旅行类型筛选和搜索词过滤
- [ ] T011 在 `app/api/reviews/[id]/route.ts` 中实现评论详情 API，根据评论 `id` 获取单条记录
- [ ] T012 在 `lib/search-utils.ts` 中创建搜索高亮函数，支持前端关键词高亮显示
- [ ] T013 在 `lib/date-utils.ts` 中添加评论发布日期格式化工具，输出可读日期字符串
- [ ] T014 在 `app/api/reviews/route.ts` 中实现搜索与筛选的 AND 组合逻辑，同时支持同一维度内的 OR 逻辑

## Phase 3: User Story 1 - 浏览所有评论 (Priority: P1)

**Goal**: 实现评论列表浏览页面，支持分页和基本卡片视图

**Independent Test**: 访问 `app/page.tsx`，加载并展示前 20 条评论卡片

- [ ] T015 [US1] 创建 `components/ReviewCard.tsx`，显示评分、房间类型、旅行类型、评论摘要、发布日期、有用计数
- [ ] T016 [US1] 创建 `components/ReviewList.tsx`，在列表中渲染多个 `ReviewCard` 并处理空数据状态
- [ ] T017 [US1] 创建 `app/page.tsx`，使用 `hooks/useReviews.ts` 加载评论列表并显示分页结果
- [ ] T018 [US1] 创建 `hooks/useReviews.ts`，调用 `app/api/reviews` 接口并返回分页、加载、错误状态
- [ ] T019 [US1] 在 `app/page.tsx` 中显示 Loading、Error、Empty 三种状态，并确保页面在首次加载时显示第一页
- [ ] T020 [US1] 创建 `components/Pagination.tsx`，支持页码切换并更新评论列表

## Phase 4: User Story 2 - 按评分筛选评论 (Priority: P1)

**Goal**: 实现多选评分筛选功能，允许同时选中多个星级

**Independent Test**: 在列表页中点击多个星级筛选，列表实时切换显示对应评论

- [ ] T021 [US2] 创建 `components/FilterPanel.tsx`，添加多选评分按钮组件
- [ ] T022 [US2] 创建 `hooks/useFilters.ts`，管理 `scores`, `roomType`, `travelType` 筛选状态
- [ ] T023 [US2] 在 `app/page.tsx` 中集成 `FilterPanel` 和评分筛选状态，确保多选评分使用 OR 逻辑
- [ ] T024 [US2] 在 `app/api/reviews/route.ts` 中处理 `scores` 参数，构建 `star IN (...)` 查询
- [ ] T025 [US2] 在 `app/page.tsx` 中添加“清除筛选”按钮，重置评分筛选并恢复评论列表

## Phase 5: User Story 3 - 按房间类型和旅行类型筛选 (Priority: P2)

**Goal**: 实现房间类型和旅行类型筛选，并支持组合筛选

**Independent Test**: 应用房间类型和旅行类型筛选后，列表只显示同时匹配的评论

- [ ] T026 [US3] 在 `components/FilterPanel.tsx` 中添加房间类型筛选和旅行类型筛选控件
- [ ] T027 [US3] 在 `hooks/useFilters.ts` 中扩展 `roomType` 和 `travelType` 状态管理
- [ ] T028 [US3] 在 `app/api/reviews/route.ts` 中处理 `room_type` 和 `travel_type` 查询参数
- [ ] T029 [US3] 更新 `app/page.tsx`，将房间类型和旅行类型筛选与列表查询联动
- [ ] T030 [US3] 在 `components/FilterPanel.tsx` 中显示当前筛选条件并支持单独清除一个筛选

## Phase 6: User Story 4 - 关键词搜索评论 (Priority: P2)

**Goal**: 实现评论文本关键词搜索，仅搜索 `comment` 字段并高亮匹配内容

**Independent Test**: 输入关键词后，列表显示同时满足搜索和筛选条件的评论，并高亮关键词

- [ ] T031 [US4] 创建 `components/SearchBar.tsx`，提供关键词输入框
- [ ] T032 [US4] 创建 `hooks/useSearch.ts`，实现 300ms 防抖搜索逻辑
- [ ] T033 [US4] 将搜索词与 `hooks/useReviews.ts` 集成，确保搜索结果与筛选条件 AND 组合
- [ ] T034 [US4] 在 `app/page.tsx` 中显示搜索高亮结果，使用 `lib/search-utils.ts`
- [ ] T035 [US4] 在 `app/page.tsx` 中实现搜索结果为空时显示“未找到匹配的评论”提示

## Phase 7: User Story 5 - 查看评论中的图片 (Priority: P3)

**Goal**: 实现评论图片预览，支持轮播和多种关闭方式

**Independent Test**: 点击图片按钮打开预览，支持上一张/下一张、ESC 关闭、点击遮罩关闭

- [ ] T036 [US5] 在 `components/ReviewCard.tsx` 中显示评论图片缩略图或“查看图片”入口
- [ ] T037 [US5] 创建 `components/ImageModal.tsx`，支持图片轮播、放大查看和当前索引显示
- [ ] T038 [US5] 在 `components/ImageModal.tsx` 中实现关闭按钮、点击背景遮罩、按 ESC 键关闭逻辑
- [ ] T039 [US5] 将 `ImageModal` 集成到 `ReviewCard.tsx` 或详情页中，确保弹窗打开后可关闭并返回列表

## Phase 8: User Story 6 - 查看详细评论信息 (Priority: P3)

**Goal**: 实现单条评论详情页，展示完整评论文本与元数据

**Independent Test**: 从列表页点击评论卡片，打开详情页并返回列表

- [ ] T040 [US6] 创建 `app/reviews/[id]/page.tsx`，加载并渲染单条评论详情
- [ ] T041 [US6] 创建 `components/ReviewDetail.tsx`，展示完整评论内容、评分、房间类型、旅行类型、图片、统计信息
- [ ] T042 [US6] 在 `components/ReviewCard.tsx` 中添加跳转链接到详情页
- [ ] T043 [US6] 在 `app/reviews/[id]/page.tsx` 中添加返回按钮，并保留列表页的筛选与搜索状态

## Final Phase: Polish & Cross-Cutting Concerns

**Goal**: 完成质量、测试和性能保障，确保交付稳定可用版本

- [ ] T044 [P] 在 `tests/unit/components/ReviewCard.test.tsx` 中编写组件单元测试
- [ ] T045 [P] 在 `tests/unit/hooks/useReviews.test.ts` 中编写数据获取与分页单元测试
- [ ] T046 [P] 在 `tests/integration/review-list-flow.test.ts` 中编写评论列表筛选与搜索集成测试
- [ ] T047 [P] 在 `tests/e2e/image-preview.spec.ts` 中编写图片预览交互测试
- [ ] T048 [ ] 在 `app/page.tsx` 和 `app/reviews/[id]/page.tsx` 中加入无障碍属性，并验证键盘导航
- [ ] T049 [ ] 在 `lib/insforge-client.ts` 中添加错误处理和缓存策略，确保 API 请求稳定
- [ ] T050 [ ] 运行 `npm run lint`, `npm run type-check`, `npm run test`, `npm run build`，修复所有错误并确保代码质量
- [ ] T051 [ ] 优化页面加载和 bundle 大小，完成 Lighthouse 评分检查并确保评分 ≥ 85
- [ ] T052 [ ] 更新 `specs/001-review-browser/tasks.md` 为最终任务记录，并确认与 `plan.md`、`data-model.md`、`contracts/api.md` 一致
