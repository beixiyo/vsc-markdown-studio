# 评论与协同实现

## 启用条件

在创建编辑器时需提供 `resolveUsers`（根据 userId 解析用户信息）和 `comments.threadStore`，并开启实时协同。可选自定义评论编辑器 schema，默认使用内置 schema。

## 评论功能是否必须基于块？

**答案：不是必须的，但 BlockNote 的实现方式有其优势**

BlockNote 使用 **Tiptap Mark**（不是 Node）来实现评论标记：

```typescript
// packages/core/src/comments/mark.ts
export const CommentMark = Mark.create({
  name: "comment",
  inclusive: false,      // 关键：边界输入不会自动扩展标记
  keepOnSplit: true,     // 换行时保持标记连续
  // ...
});
```

**为什么使用 Mark 而不是 Node**：
1. Mark 可以附加到文本片段上，不改变文档结构
2. 支持跨节点标记（如跨多个 inline 节点）
3. ProseMirror/Tiptap 的 Mark 机制天然支持文本编辑时的标记继承和拆分

## 评论的边界情况处理

### 1. 插入文本时的处理

- **在标记内部插入**：新文本会**自动继承**评论标记（ProseMirror Mark 机制）
- **在标记边界外插入**：不会扩展标记（`inclusive: false` 的作用）

**实现原理**：
```typescript
// CommentMark 配置
inclusive: false  // 关键配置
```
`inclusive: false` 表示标记不包含边界位置，因此在边界输入时不会扩展。

### 2. 删除文本时的处理

- **部分删除**：标记范围会**自动收缩**（ProseMirror 自动处理）
- **完全删除**：标记会**自动移除**，但线程数据仍在 ThreadStore 中
- **孤儿标记（orphan）**：当线程被 resolved 或 deleted 时，标记会被标记为 `orphan: true`，但位置信息保留

**处理策略**：
1. **保留孤儿线程**：标记为 `orphan: true`，保留位置信息，允许后续恢复
2. **删除线程**：当标记消失时，同步删除 ThreadStore 中的线程
3. **重新锚定**：允许用户手动重新选择文本并关联到现有线程

**BlockNote 的实现**：
- 默认保留孤儿线程（`orphan: true`）
- 通过 `updateMarksFromThreads` 函数同步线程状态到标记
- 当线程被 resolved 或 deleted 时，标记会被标记为 `orphan: true`

### 3. 跨节点标记

评论标记可以跨多个 inline 节点（如文本节点、链接节点等），这是 Mark 相比 Node 的优势之一。

### 4. 换行处理

`keepOnSplit: true` 确保当文本换行时，标记会保持连续，不会因为节点拆分而丢失。

## 线程存储接口

`ThreadStore` 抽象定义增删改查与订阅，可选实现 `addThreadToDocument` 以自行写入标记；否则编辑器用 Tiptap `setMark` 在当前选区写入标记。

## 状态同步

`CommentsExtension` 订阅 ThreadStore 变化，将线程状态写回标记（设置 `orphan` 当线程 resolved/deleted），并根据 doc 变化扫描所有标记生成 `threadPositions`，用于选中装饰与侧边栏排序。

## 线程选中与挂起

扩展维护 `pendingComment/selectedThreadId`。开始评论时高亮当前选区；点击标记时切换选中的线程并添加装饰。

## 内置存储实现

- **`YjsThreadStore`**：直接把线程/评论写入 `Y.Map`，最易用但要求客户端对 Yjs 文档有写权限且需额外安全校验
- **`RESTYjsThreadStore`**：写操作走 REST 服务端校验，读同步自 Yjs，适合需要鉴权的协同场景
- **`TiptapThreadStore`**：结合 Hocuspocus/Tiptap Provider，沿用其协同管道

## 多人协同实现

### 技术栈

- **Yjs**：CRDT（冲突自由复制数据类型）库，用于同步文档状态
- **y-prosemirror**：Yjs 与 ProseMirror 的集成
- **Yjs Provider**：负责传输更新（WebRTC、WebSocket 等）

### 实现方式

```typescript
const doc = new Y.Doc();
const provider = new WebrtcProvider("room-id", doc);

const editor = useCreateBlockNote({
  collaboration: {
    provider,
    fragment: doc.getXmlFragment("document-store"),
    user: { name: "User", color: "#ff0000" },
  },
});
```

### 工作原理

- Yjs 将文档状态存储在 `Y.XmlFragment` 中
- 每次编辑操作都会生成增量更新（delta）
- Provider 负责将这些更新同步到其他客户端
- y-prosemirror 插件负责将 Yjs 更新应用到 ProseMirror 文档

### 评论与协同的结合

- 文档内容通过 Yjs 同步
- 评论数据通过 `ThreadStore` 管理（可以基于 Yjs，也可以基于 REST API）
- `YjsThreadStore` 直接将线程/评论写入 `Y.Map`，实现实时同步

## 数据同步

评论数据通过 `ThreadStore` 管理，支持多种存储方式：

1. **YjsThreadStore**：直接写入 Yjs，实现实时同步
2. **RESTYjsThreadStore**：写操作走 REST API，读操作同步自 Yjs
3. **自定义 ThreadStore**：可以实现自己的存储逻辑

**与文档同步的关系**：
- 文档内容通过 Yjs 同步（`y-prosemirror`）
- 评论数据通过 ThreadStore 同步（可以独立于文档同步）
- 评论标记是文档内容的一部分，会随文档同步

## 核心实现位置

### 核心扩展
- **入口**：`packages/core/src/comments/extension.ts`
- **功能**：要求外部注入 `threadStore` 和 `resolveUsers`，在 ProseMirror 文档中根据线程状态更新装饰与选中状态

### 数据接口
- **位置**：`packages/core/src/comments/threadstore/ThreadStore.ts`
- **功能**：抽象定义增删改查与订阅方法，UI 和存储层都围绕这个接口交互

### Yjs 存储实现
- **位置**：`packages/core/src/comments/threadstore/yjs/YjsThreadStore.ts`
- **功能**：直接把线程/评论写入协同文档的 `Y.Map`，并通过 `subscribe` 推送变更

### React 层集成
- **位置**：`packages/react/src/components/Comments/useThreads.ts`
- **功能**：把 `threadStore.subscribe` 适配到 `useSyncExternalStore`，获取最新的 `Map<string, ThreadData>`

## 如何获取评论数据

- **在 React 组件中**：使用 `const threads = useThreads();` 获取 `Map<string, ThreadData>`
- **在业务逻辑中**：从注入到 `CommentsExtension` 的 `threadStore` 调 `getThreads()` 或 `subscribe(cb)`
- **示例用法**：`new YjsThreadStore(activeUser.id, doc.getMap("threads"), new DefaultThreadStoreAuth(...))` 注入到 `CommentsExtension`