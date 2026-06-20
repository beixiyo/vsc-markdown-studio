# 块级 id-diff 同步（编辑器 → 后端增量上报）

把「内容变了 → `getMarkdown()` 全量覆盖」换成**只传变化的块**。传输量与「这次改了多少」成正比，而非与「文档多大」成正比

> 设计取舍与方案对比见 `feasibility` 报告；这是「方案 A：块级 id-diff，后端哑存储」的落地
> 它是 `tiptap-ai/region-edit`（外部 → 编辑器）的**镜像方向**，复用了同款块级思路但身份由稳定 id 承载

## 三个核心问题的答案

| 问题 | 答案 |
|------|------|
| **传什么** | 按**块**传。每块 markdown 为主；markdown 无法无损表达的块（如渐变高亮）降级 `html` / `json`。**不传整篇 markdown 文本 diff**（有序列表重编号、表格列重排会让局部编辑产生非局部 diff） |
| **协议怎么定** | 版本化乐观锁信封 `{ protocolVersion, baseVersion, clientId, seq, ops[], order[], docChecksum }`；后端校验 `baseVersion`，不上则要求整篇 resync（永远有兜底） |
| **后端怎么只更新局部** | 以**稳定 blockId** 为键 `upsert` / `delete`，按 `order` 重排。后端只是一张 `{ id, order, content }` 表，**不需要 ProseMirror / Yjs / schema** |

## 组成

| 模块 | 职责 |
|------|------|
| `BlockId`（扩展） | 给每个顶层块挂稳定 id（`blk_*`）。不进 markdown，仅活在 PM state / `getJSON()`。WebView 安全（不用 `crypto.randomUUID`） |
| `computeBlockDiff`（纯函数） | 对比当前文档与上次快照，产出最小 `upsert` / `delete` + 顺序清单 |
| `createBlockSync`（控制器） | 订阅变更（防抖）→ 算增量 → 传输；维护版本、ack 推进、resync 兜底 |
| `useBlockSync`（React Hook） | 控制器的 React 封装，见 `tiptap-api/react` |

## 用法

### Web（React）

```tsx
import { BlockId } from 'tiptap-api'
import { useBlockSync } from 'tiptap-api/react'

// 1. 注册扩展
const editor = useEditor({ extensions: [/* ... */, BlockId] })

// 2. 接同步
useBlockSync({
  editor,
  hasRemote: false,                       // 后端无该文档 → 首次整篇 pushFull
  debounceMs: 600,
  onDiff: async (payload) => {
    const res = await fetch('/api/doc/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return res.json()                      // 返回 BlockSyncResult → 按回执处理
  },
})
```

### 移动端 WebView

已在 `markdown-mobile-tiptap` 接好：`App.tsx` 注册 `BlockId`，`useBlockSyncBridge` 把增量经
`notifyNative('contentDiff', payload)` 发给原生（单向，乐观提交）。原生侧：

```ts
// 收到增量 → 发后端 → 回执
onContentDiff(payload) {
  const result = await postToBackend(payload)        // { status, version }
  if (result.status === 'ack')     window.MDBridge.sync.ack(result.version)
  else /* reject | resync */        window.MDBridge.sync.requestResync(result.version)
}
// 主动整篇重推（首次加载完成后）
window.MDBridge.sync.pushFull()
```

> `contentDiff` 与既有全量 `contentChanged` 并存，原生可逐步迁移，迁完即可停发 `contentChanged`

## 协议

```jsonc
// 编辑器 → 后端
{
  "protocolVersion": 1,
  "baseVersion": 42,              // 本次 diff 基于的后端版本（乐观锁）
  "clientId": "cli_xxx",
  "seq": 7,                       // 单调自增，后端可据此发现乱序 / 丢包
  "ops": [
    { "op": "upsert", "id": "blk_a1", "type": "paragraph",
      "hash": "9f3a…", "content": { "format": "markdown", "value": "改写后的段落" } },
    { "op": "upsert", "id": "blk_c3", "type": "paragraph",
      "hash": "7b2e…", "lossy": true,
      "content": { "format": "html", "value": "<p><span data-color=\"skyBlue\">高亮</span></p>" } },
    { "op": "delete", "id": "blk_b2" }
  ],
  "order": ["blk_a1", "blk_c3", "blk_d4"],   // 全量顶层 id 顺序（位置权威；纯移动无需重发内容）
  "docChecksum": "e1c2…"          // fnv1a64(有序 id\0hash)，静默漂移检测
}
```

```jsonc
// 后端 → 编辑器（回执）
{ "status": "ack",     "version": 43 }   // 已接受
{ "status": "reject",  "version": 50 }   // 版本不符（有别的写入抢先）→ 客户端整篇重推
{ "status": "resync",  "version": 50 }   // gap / 校验和不符 → 整篇重推
```

## 后端实现指引（哑存储，语言无关）

详见 [backend-protocol](./backend-protocol.md)

存一张表：`{ docId, version, blocks: [{ id, order, format, content, hash }] }`

```
收到 payload:
  if payload.baseVersion != stored.version:
      return { status: 'resync', version: stored.version }   // 让客户端整篇重推
  for op in payload.ops:
      if op.op == 'upsert':  blocks[op.id] = { content, hash, type }
      if op.op == 'delete':  remove blocks[op.id]
  reorder blocks by payload.order
  stored.version += 1
  // 可选：用 docChecksum 校验本地拼出的文档是否与客户端一致，不符则下次 resync
  return { status: 'ack', version: stored.version }
```

`seq`（按 `clientId`）用于幂等去重：重复 / 乱序的 `seq` 丢弃即可

## 块 id 的跨重载稳定性（重要）

`blockId` **不进 markdown**，但**进 `getJSON()`**（`toJSON` 不受 `rendered` 影响）：

- 后端存 **PM-JSON** → id 随之持久化，重载后块身份稳定 ✅
- 后端存 **纯 markdown** → 重载丢 id，首次加载会被当作全量（之后增量），但旧 id 不再延续
- 需要 HTML 也带 id：`BlockId.configure({ keepInHTML: true })` → 渲染 `data-block-id`

## 限制

- **块级粒度**：编辑一个字仍重传整块 markdown。超大表格 / 代码块改一处会整块重发（要字符级需 PM Steps / Yjs）
- **单写者**：冲突策略是「服务端赢 → resync」，不做多人实时合并（那是 Yjs 的活）
- **自定义顶层节点**：默认 `types` 覆盖标准块；自定义顶层节点需在 `BlockId.configure({ types })` 里补，否则该块退化为按位置匹配
