# tiptap-comment

完整的评论 / 批注系统：mark 扩展、评论存储、同步、React 组件。

## 架构

```
CommentMarkExtension（ProseMirror mark）
        ↕
   CommentStore（状态管理）
        ↕
  React 组件（UI 层）
```

## 核心 API

| API | 说明 |
|------|------|
| `createComment` | 在选区上创建评论（添加 comment mark） |
| `deleteComment` | 删除评论及其 mark |
| `updateComment` | 更新评论内容 / 状态 |
| `createReply` | 创建回复 |
| `canCreateComment` | 当前选区是否可创建评论 |
| `getCommentRange` / `getCommentText` | 获取评论的文档范围和文本 |

## React 组件

```ts
import { CommentButton, CommentSidebar, InlineCommentPopover, useCommentSync } from 'tiptap-comment/react'
```

| 组件 / Hook | 说明 |
|------|------|
| `CommentButton` | 添加评论按钮 |
| `CommentSidebar` | 评论侧边栏面板 |
| `InlineCommentPopover` | 点击评论 mark 时的行内弹窗 |
| `useCommentSync` | 评论状态同步（undo/redo 感知） |
| `useComments` | 评论列表响应式 hook |

## 序列化支持

| 格式 | 支持 | 说明 |
|------|------|------|
| JSON | ✅ 无损 | mark + `commentId` attr |
| HTML | ✅ 无损 | `<span data-comment-id="...">` |
| Markdown | ❌ mark 丢失 | 文本保留，评论标记不输出——**设计如此**，见下 |

评论内容与元数据存在独立 `CommentStore`，文档里只有 mark 锚点；markdown 不适合承载评论，需要带评论导出时用 `exportDocumentWithComments`（JSON 文档 + 评论数据组合导出）

## 依赖

`tiptap-api` `tiptap-comps` `tiptap-utils`
