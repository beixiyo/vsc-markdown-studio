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

## 依赖

`tiptap-api` `tiptap-comps` `tiptap-utils`
