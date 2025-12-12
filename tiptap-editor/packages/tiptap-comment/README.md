# Markdown Editor with Comment System

**TODO: 增量更新而不是全量** `tiptap-editor/packages/tiptap-comment/src/plugin/comment-plugin.ts.apply`

基于 Tiptap 和 ProseMirror 构建的 Markdown 编辑器，集成了完整的评论系统。

## 功能特性

- ✅ 富文本编辑（支持 Markdown）
- ✅ 评论系统（创建、编辑、删除、回复）
- ✅ 评论高亮显示
- ✅ 评论状态管理（活跃/已解决）
- ✅ 评论导出/导入（JSON 格式）
- ✅ 评论位置自动更新（文档变更时）

## 文件变更说明

相对于原始 Tiptap 示例项目（`raw-editor`），以下是在 `src` 目录中的文件变更：

---

## 评论系统使用指南

### 1. 创建评论

#### 使用 API

```typescript
import { createComment } from '@/api/editor/comment'
import { CommentStore } from '@/api/editor/comment-store'

const commentStore = new CommentStore()
const editor = useEditor({ ... })

// 创建评论
const comment = createComment(editor, commentStore, {
  content: '这段代码需要优化',
  author: {
    id: 'user-1',
    name: '张三',
    avatar: 'https://example.com/avatar.jpg'
  }
})
```

#### 使用 UI 组件

```tsx
import { CommentButton } from '@/components/tiptap-ui/comment-button'

<CommentButton
  editor={editor}
  commentStore={commentStore}
  author={{ id: 'user-1', name: '张三' }}
  onCommentCreated={(comment) => {
    console.log('评论已创建:', comment)
  }}
/>
```

**步骤**：
1. 在编辑器中选中要评论的文本
2. 点击评论按钮（或使用快捷键）
3. 输入评论内容
4. 提交评论

### 2. 查看评论列表

```tsx
import { CommentSidebar } from '@/components/tiptap-ui/comment-sidebar'

<CommentSidebar
  editor={editor}
  commentStore={commentStore}
  onCommentUpdate={() => {
    // 评论更新回调
  }}
/>
```

**功能**：
- 显示所有评论列表
- 按创建时间倒序排序
- 支持状态筛选（全部/活跃/已解决）
- 点击评论项可跳转到文档对应位置

### 3. 编辑评论

```typescript
import { updateComment } from '@/api/editor/comment'

// 更新评论内容
updateComment(commentStore, 'comment-123', {
  content: '更新后的评论内容'
})

// 更新评论状态
updateComment(commentStore, 'comment-123', {
  status: 'resolved'
})
```

### 4. 删除评论

```typescript
import { deleteComment } from '@/api/editor/comment'

const success = deleteComment(editor, commentStore, 'comment-123')
if (success) {
  console.log('评论已删除')
}
```

### 5. 创建回复

```typescript
import { createReply } from '@/api/editor/comment'

// 回复评论
const reply = createReply(editor, commentStore, {
  content: '我也觉得不错',
  author: {
    id: 'user-2',
    name: '李四'
  },
  replyToId: 'comment-123'
})
```

**回复特性**：
- 扁平化结构（所有回复都是独立的评论）
- 自动填充被回复评论的引用信息
- 支持引用内容预览（超过 50 字符自动截断）
- 点击引用可跳转到被回复的评论

### 6. 查询评论

#### 根据文档位置查询

```typescript
import { getCommentsByRange } from '@/api/editor/comment-store'
import { getCommentRangesFromPlugin } from '@/api/editor/comment-store'

// 获取评论范围信息
const ranges = getCommentRangesFromPlugin(editor)

// 查询指定范围内的评论
const comments = commentStore.getCommentsByRange(ranges, 100, 200)
```

#### 根据状态查询

```typescript
// 获取所有活跃的评论
const activeComments = commentStore.getCommentsByStatus('active')

// 获取所有已解决的评论
const resolvedComments = commentStore.getCommentsByStatus('resolved')
```

#### 回复相关查询

```typescript
// 获取某个评论的所有回复
const replies = commentStore.getCommentsByReplyTo('comment-123')

// 获取回复数量
const replyCount = commentStore.getReplyCount('comment-123')

// 获取完整的回复链
const replyChain = commentStore.getReplyChain('comment-123')

// 获取所有一级评论（非回复）
const topLevelComments = commentStore.getTopLevelComments()
```

### 7. 导出/导入评论

#### 导出文档和评论

```typescript
import { exportDocumentWithComments } from '@/api/editor/comment-export'

// 导出为 JSON 对象
const json = exportDocumentWithComments(editor, commentStore)
console.log(json)
// {
//   doc: { type: 'doc', content: [...] },
//   comments: [...],
//   exportedAt: 1234567890,
//   version: '1.0.0'
// }

// 导出为 JSON 字符串
const jsonString = exportDocumentWithCommentsAsString(editor, commentStore)
localStorage.setItem('document', jsonString)
```

#### 导入文档和评论

```typescript
import { importDocumentWithComments } from '@/api/editor/comment-export'

// 从 JSON 对象导入
importDocumentWithComments(editor, commentStore, json)

// 从 JSON 字符串导入
const jsonString = localStorage.getItem('document')
if (jsonString) {
  importDocumentWithCommentsFromString(editor, commentStore, jsonString)
}
```

### 8. 评论同步和边界情况处理

评论系统会自动处理以下边界情况：

- ✅ 评论范围被删除 → 自动检测并标记为已解决（可选）
- ✅ 评论范围被分割 → 自动检测并标记为已解决（可选）
- ✅ 孤立的评论 mark → 自动清理
- ✅ 撤销/重做时的状态恢复 → 自动同步

```typescript
import { useCommentSync } from '@/hooks/use-comment-sync'

// 在组件中使用 Hook 自动同步
useCommentSync(editor, commentStore, {
  autoResolveDeleted: true,  // 自动将删除的评论标记为已解决
  autoResolveSplit: true,    // 自动将分割的评论标记为已解决
  debounceMs: 300            // 防抖延迟（毫秒）
})
```

## 架构说明

评论系统采用 **Mark + 外部 Store** 的混合架构：

- **Mark**：存储在文档中，标记评论的锚点位置（`commentId`）
- **Store**：存储在内存中，管理评论实体数据（内容、作者、时间、状态等）
- **Plugin**：维护评论范围映射，使用 ProseMirror Mapping 自动更新位置

详细架构设计请参考：`plan/comment-system-architecture.md`

## 性能优化

评论系统已实现以下性能优化：

1. **Decoration 增量更新**：使用 `DecorationSet.map()` 映射现有 decorations，只更新变更部分
2. **查询结果缓存**：`getCommentsByRange()` 方法使用缓存机制，提升重复查询性能
3. **自动缓存失效**：评论变更或 ranges 变更时自动清除缓存

## API 参考

### CommentStore

```typescript
class CommentStore {
  // 增删改查
  addComment(comment: Comment): void
  getComment(id: string): Comment | undefined
  updateComment(id: string, updates: Partial<Comment>): void
  deleteComment(id: string): boolean
  
  // 查询
  getAllComments(): Comment[]
  getCommentsByStatus(status: 'active' | 'resolved'): Comment[]
  getCommentsByRange(ranges: Map<string, CommentRange>, from: number, to: number): Comment[]
  
  // 回复相关
  getCommentsByReplyTo(replyToId: string): Comment[]
  getReplyCount(commentId: string): number
  getReplyChain(commentId: string): Comment[]
  getTopLevelComments(): Comment[]
  
  // 持久化
  toJSON(): string
  fromJSON(comments: Comment[]): void
  clear(): void
}
```

### Comment API

```typescript
// 创建评论
createComment(editor, commentStore, params: CreateCommentParams): Comment | null

// 更新评论
updateComment(commentStore, commentId: string, updates: UpdateCommentParams): boolean

// 删除评论
deleteComment(editor, commentStore, commentId: string): boolean

// 创建回复
createReply(editor, commentStore, params: CreateReplyParams): Comment | null

// 获取评论范围
getCommentRange(editor, commentId: string): CommentRange | null
```

### Export/Import API

```typescript
// 导出
exportDocumentWithComments(editor, commentStore): DocumentWithComments
exportDocumentWithCommentsAsString(editor, commentStore): string

// 导入
importDocumentWithComments(editor, commentStore, json: DocumentWithComments): void
importDocumentWithCommentsFromString(editor, commentStore, jsonString: string): void
```

## 更多资源

- [Tiptap 文档](https://tiptap.dev/docs)
- [ProseMirror 文档](https://prosemirror.net/docs/)
- [评论系统架构设计](./plan/comment-system-architecture.md)
- [评论系统实现计划](./plan/comment-system-implementation.md)
