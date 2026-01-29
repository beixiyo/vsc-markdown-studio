# 代码审查：`tiptap-comment` 包

本文档提供了 `tiptap-comment` 包的详细代码审查，重点关注架构、React 最佳实践、数据流和代码质量。

## 1. 概述
`tiptap-comment` 包实现了 Tiptap 编辑器的评论系统。它采用了解耦架构：
- **ProseMirror 插件**：管理文档中的"锚点"（Marks）并跟踪它们的位置。
- **CommentStore**：一个独立的基于类的存储，保存实际的评论数据（作者、内容、回复）。
- **React 组件**：提供查看、添加和管理评论的 UI。

---

## 2. 🔴 关键问题（高优先级）

### 2.1 撤销/重做数据丢失风险
- **位置**：`src/react/hooks/use-comment-sync.ts`（第 60-67 行），`src/comment-sync.ts`。
- **描述**：`useCommentSync` 钩子会自动从 `CommentStore` 中删除在文档中找不到的评论。
- **问题所在**：如果用户删除了包含评论的段落，然后执行**撤销**（Cmd+Z），ProseMirror 标记会被 Tiptap/ProseMirror 恢复。然而，由于 React `CommentStore` 在初始"删除"事务期间已经删除了评论条目，评论数据将**永久丢失**。恢复的标记变成了没有关联数据的"孤立"标记。
- **建议修复**：
    - 在 `CommentStore` 中实现"软删除"或"回收站"。不要删除，而是将其标记为 `deleted: true`。
    - 或者，使 `CommentStore` 状态成为编辑器撤销历史的一部分，或使用自然处理历史的共享状态提供程序（如 Yjs）。
    - 更改 `applySyncResult` 不自动从存储中删除，或者仅在删除被"确认"或经过一定超时后才删除。

### 2.2 React 中的直接 DOM 操作
- **位置**：`src/react/components/comment-item.tsx`（第 75-90 行）。
- **描述**：`handleJumpToComment` 函数使用 `setTimeout` 和 `element.classList.add/remove` 在编辑器中高亮显示评论。
- **问题所在**：这绕过了 React 的声明式特性和 ProseMirror 的装饰系统。手动类操作可能导致样式"卡住"，如果组件卸载或 ProseMirror 重新渲染视图。
- **建议修复**：使用 ProseMirror **装饰**来处理活动高亮状态。将 `activeCommentId` 添加到 `CommentPluginState`，让插件的 `decorations` 属性以声明方式处理类应用。

---

## 3. 🟡 警告（中优先级）

### 3.1 违反 SRP（单一职责原则）
- **位置**：`src/react/components/comment-item.tsx`。
- **描述**：`CommentItem` 是一个"上帝组件"。它管理：
    1. 评论的 UI 渲染。
    2. 编辑状态和逻辑。
    3. 回复状态和逻辑。
    4. 滚动到位置逻辑。
    5. 原生浏览器 `confirm` 对话框。
- **问题所在**：这使得组件难以测试、维护和扩展。它目前超过 390 行。
- **建议修复**：
    - 将**编辑逻辑**提取到自定义钩子（例如 `useCommentEdit`）。
    - 将**回复逻辑**提取到自定义钩子（例如 `useCommentReply`）。
    - 将"跳转到评论"逻辑移动到工具函数或 `CommentStore` 中。

### 3.2 不受控制的随机 ID 生成
- **位置**：`src/react/components/comment-item.tsx`（第 51-54 行）。
- **描述**：`defaultAuthor` 使用 `Math.random()` 生成随机 ID 和名称。
- **问题所在**：虽然这是一个后备方案，但在依赖于 `labels.user` 的 `useMemo` 中生成随机 ID 意味着如果语言/标签更改，ID 可能会更改，这对于"作者"身份来说是意外的。
- **建议修复**：身份管理应由身份验证提供程序处理或作为 prop/context 向下传递。后备方案应该更稳定。

### 3.3 原生浏览器 `confirm()`
- **位置**：`src/react/components/comment-item.tsx`（第 98 行）。
- **描述**：使用 `window.confirm`。
- **问题所在**：它破坏了应用程序的 UI 一致性并阻塞主线程。
- **建议修复**：使用 UI 库（`comps`）中的样式化 `Dialog` 或 `Modal` 组件。

---

## 4. 🟢 建议（改进和整洁性）

### 4.1 工具函数提取
- **位置**：`src/react/components/comment-item.tsx`（第 223-233 行）。
- **描述**：日期格式化逻辑是内联定义的。
- **建议**：将 `formatDate` 移动到中央工具文件（例如 `packages/tiptap-utils/src/utils/date.ts`），以确保整个应用程序中的格式一致。

### 4.2 使用 `useSyncExternalStore`
- **观察**：您在 `CommentSidebar` 和 `useInlineCommentPopover` 中正确使用了 `useSyncExternalStore`。
- **增强**：考虑创建一个专用钩子 `useComments()` 来包装此逻辑，以避免在每个组件中重复 `subscribe`/`getSnapshot` 模式。

### 4.3 硬编码的 Tailwind 类
- **位置**：`src/plugin/comment-plugin.ts`（第 216-222 行）。
- **观察**：装饰的 CSS 类是硬编码字符串。
- **建议**：将这些移动到常量或配置对象，以便可以轻松主题化或更改，而无需触及插件逻辑。

---

## 5. 积极发现
- **出色的解耦**：ProseMirror 标记（锚点）和评论存储（数据）之间的分离是富文本编辑器的一个非常稳健的设计模式。
- **性能优化**：`CommentStore` 使用带有"签名"检查的 `rangeQueryCache`（第 266-319 行），这是防止每次渲染时进行昂贵的重叠计算的绝佳方法。
- **标准化存储**：`getSnapshot` 和 `subscribe` 的实现遵循了用于外部状态管理的现代 React 最佳实践。
- **模块化插件**：使用 `PluginKey` 和 `pluginState.ranges` 允许系统的其他部分查询评论位置，而无需了解 ProseMirror 内部。

---

## 6. 总结
`tiptap-comment` 包结构良好，遵循了坚实的架构模式。最关键的问题是**由于激进的同步逻辑，在撤销/重做操作期间可能丢失数据**。解决此问题并重构"上帝组件"`CommentItem` 将显著提高系统的稳定性和可维护性。
