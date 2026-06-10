# ctx-ref：注释 marker 兼容层

> 背景：编辑器底层（ProseMirror）不解析 HTML 注释，不做这层兼容时所有 marker 会在保存时被静默清除

## ⚠️ 核心边界：marker 对用户是可删的（设计如此，不做禁删）

marker 在编辑器里是真实节点，用户编辑（范围删除、剪切）**可以把它删掉**。安全模型是「删不残缺 + 自动重建」，而不是「不可删除」

「禁删保护」经调研后**主动否决**：`filterTransaction` 否决事务与移动端 IME 合成冲突（同机制公开实锤：Tiptap CharacterCount [#5928](https://github.com/ueberdosis/tiptap/issues/5928)，中文输入法丢字/截断，Android WebView 几乎永远处于合成态）；且键盘退格本来就删不掉不可见 atom（光标跳过），唯一删除路径只有框选范围删除，保护收益远小于损坏文字输入的风险：

| 保证 | 说明 |
|------|------|
| 删不残缺 | 节点要么完整存在、要么干净消失，**不可能**出现 `<!--ctx-ref:no` 这种删一半的脏文本 |
| 删了能恢复 | 哨兵被删（半对或整对）后，下一轮更新走重建分支（清孤哨兵 + 文末重建完整区块），见 §4.2 |
| 删了不丢源数据 | 行内 marker 随句子被删只是「引用消失」，Note / Image 原始数据在原生侧不受影响 |
| 并发有保护 | AI 写入期间用户编辑目标区域 → 自动放弃会话并发 `aiEditConflict` 事件；hash 过期 → 显式 `TARGET_NOT_FOUND`，重跑即可 |

已知的优雅降级（不崩，但产品需知晓）：整对哨兵被删但内容还在 → 重建后旧内容残留为普通文本；复制粘贴含 marker 的句子 → 同一 refId 出现两个图标（需要禁止可加 paste 过滤，目前未做）

---

## 1. 当前支持的全部注释节点

| Markdown 原文 | 解析为 | 节点类型 | 属性 |
|---------------|--------|----------|------|
| `<!--ctx-ref:mark:{id}-->` | 行内不可见锚点 | `ctxRef` | `refType: 'mark'`, `refId` |
| `<!--ctx-ref:note:{id}-->` | 行内不可见锚点 | `ctxRef` | `refType: 'note'`, `refId` |
| `<!--ctx-ref:image:{id}-->` | 行内不可见锚点 | `ctxRef` | `refType: 'image'`, `refId` |
| `<!--summary-added-images:start-->` | 块级不可见边界 | `summaryBoundary` | `kind: 'start'` |
| `<!--summary-added-images:end-->` | 块级不可见边界 | `summaryBoundary` | `kind: 'end'` |

**格式为严格匹配**，正则如下，任何变体（多空格、换行、大小写）都不识别、会被当普通注释丢弃：

```
ctx-ref:    /^<!--ctx-ref:(mark|note|image):([\w-]+)-->/
哨兵:       /^<!--summary-added-images:(start|end)-->/   （独占一行）
```

序列化（保存 / `getMarkdown`）时按上表原样还原为注释文本

⚠️ **词表外的注释仍会被丢弃**：如算法侧未来新增 `<!--ctx-ref:todo:1-->` 这类新类型，需要先在本模块扩词表（`types.ts` 的 `CtxRefType` 联合 + `extension.ts` 的正则），否则不解析

## 2. 类型定义（严格字面量，非 string）

```ts
import type { CtxRefAttributes, CtxRefClickPayload, CtxRefType } from 'tiptap-nodes/ctx-ref'

type CtxRefType = 'mark' | 'note' | 'image'          // 字面量联合
type CtxRefAttributes = { refType: CtxRefType, refId: string }
type SummaryBoundaryAttributes = { kind: 'start' | 'end' }
```

配套的区域编辑协议同样全程字面量类型（`tiptap-ai`）：

```ts
type RegionOpType = 'replace' | 'insertBefore' | 'insertAfter' | 'delete'
  | 'searchReplace' | 'append' | 'prepend' | 'replaceAll'
type RegionContentFormat = 'markdown' | 'html' | 'json'
```

传错 op / refType 在编译期即报错

## 3. 注册（web 端，移动端无需关心）

```ts
import { CtxRefNode, SummaryBoundaryNode } from 'tiptap-nodes/ctx-ref'

const extensions = [
  CtxRefNode,          // 已在 markdown-mobile-tiptap App.tsx 注册
  SummaryBoundaryNode,
]
```

业务侧要接交互时，`CtxRefNode.configure({ onClick })` 可拿到点击载荷（含 marker 前紧邻的加粗斜体句，Note 详情展示用）：

```ts
CtxRefNode.configure({
  onClick: ({ refType, refId, sentence }) => { /* note / image 才触发，mark 无交互 */ },
})
```

DOM 钩子：节点渲染为 `<span data-ctx-ref="note" data-ctx-id="1" class="tiptap-ctx-ref tiptap-ctx-ref--note">`，可按类名挂样式或 NodeView

## 4. 移动端使用方式

原生侧**不需要解析任何 marker**，全部透传。所有能力都挂在 WebView 内的 `window.MDBridge` 上（原生用 `evaluateJavaScript` / `callAsyncJavaScript` 执行下面这些 JS 即可）

> **完整 API 参考**（全部方法签名、类型、操作语义表、状态机）：
> `tiptap-editor/packages/tiptap-ai/README.md`
> 类型源文件：`tiptap-editor/packages/tiptap-ai/src/region-edit/types.ts`

### 4.1 下发 / 读回 summary（marker 自动保活）

```ts
/** 下发：带 marker 的 markdown 原样传入，web 端自动解析保活 */
MDBridge.setMarkdown(summaryMarkdown)

/** 读回：用户编辑后保存，marker 逐字符原样在返回的 markdown 里 */
const md: string = MDBridge.getMarkdown()
```

### 4.2 核心示例：更新「会后图片区块」（哨兵对定位 + 兜底）

**规则：定位哨兵「对」（start + end）；找到 = 替换两哨兵之间的全部块；找不到（老文档 / 首次任务）= 在文档末尾插入完整区块——插入内容自带哨兵，文档随之升级，下次就能找到了**

三个关键点，缺一不可：

1. **匹配用「节点类型 + 全等 marker 文本」**，不会误中正文；行内的 `ctx-ref` 标记是段落内部节点，不出现在顶层块列表里，永远不会干扰
2. **必须成对定位、替换区间内全部块**——区块内容通常是「标题 + 列表」两个顶层块，只换第一个会留下旧列表残骸
3. 哨兵残缺（用户删了半个）时清掉孤哨兵、整体重建，保证文档里 start / end 永远恰好一对

```ts
import type { RegionBlock, RegionOperationResult } from 'tiptap-ai'

const START = '<!--summary-added-images:start-->'
const END = '<!--summary-added-images:end-->'

/** 区块内部新内容（不带哨兵） */
const innerContent = '## Related images（已更新）\n\n- 新的图片说明。<!--ctx-ref:image:102-->'

/** 首次创建用的完整区块（自带哨兵） */
const fullBlock = [START, '', innerContent, '', END].join('\n')

function upsertAddedImagesBlock(): RegionOperationResult[] {
  /** ① 读块：每个顶层块都带 hash 锚点 */
  const { blocks } = MDBridge.aiEdit.readBlocks()

  /** ② 定位哨兵对：节点类型 + 全等 marker 文本 */
  const startIdx = blocks.findIndex(
    (b: RegionBlock) => b.type === 'summaryBoundary' && b.markdown === START,
  )
  const endIdx = startIdx === -1
    ? -1
    : blocks.findIndex(
        (b: RegionBlock, i: number) => i > startIdx && b.type === 'summaryBoundary' && b.markdown === END,
      )

  /** ③a 哨兵对不完整（老文档没有 / 用户删了半个）→ 清掉孤哨兵 + 末尾重建完整区块 */
  if (startIdx === -1 || endIdx === -1) {
    const orphanOps = [startIdx, endIdx]
      .filter(i => i !== -1)
      .map(i => ({ target: blocks[i].hash, op: 'delete' as const }))

    const { results } = MDBridge.aiEdit.applyOperations({
      operations: [
        ...orphanOps,
        { target: 'doc', op: 'append', content: { format: 'markdown', value: fullBlock } },
      ],
    })
    return results
  }

  /** ③b 找到区块 → 替换两哨兵之间的【全部】块（第一个替换、其余删除；空区块则贴 start 后插入） */
  const inner = blocks.slice(startIdx + 1, endIdx)
  const operations = inner.length === 0
    ? [{
        target: blocks[startIdx].hash,
        op: 'insertAfter' as const,
        content: { format: 'markdown' as const, value: innerContent },
      }]
    : [
        {
          target: inner[0].hash,
          op: 'replace' as const,
          content: { format: 'markdown' as const, value: innerContent },
        },
        ...inner.slice(1).map(b => ({ target: b.hash, op: 'delete' as const })),
      ]

  const { results } = MDBridge.aiEdit.applyOperations({ operations })
  return results
}

const results = upsertAddedImagesBlock()
// 每条独立结算：{ target, success: true, newHash } 或 { target, success: false, error: 'TARGET_NOT_FOUND' }
// 任何一条 TARGET_NOT_FOUND（用户并发编辑了区块）→ 整个函数重跑一遍即可（readBlocks 会拿到新 hash）
```

同一区块可**无限轮**重复此流程：哨兵是稳定节点，区块内容怎么换它都不动。此实现与三个场景的回归测试一一对应（多块替换无残留 / 孤哨兵重建 / 空区块插入），见 `packages/markdown-mobile-tiptap/src/__tests__/region-edit-capability.test.ts` 第 6 组

> 当前协议词表只有 `summary-added-images` 一种区块（一个文档恰好一对哨兵），所以「找第一个」即正确。将来若需要多个不同区块，需扩展哨兵词表（如 `<!--summary-added-todos:start-->`），定位逻辑不变

### 4.3 假流式渲染（产品要求打字机效果时）

```ts
/** ① 开始：拿流式会话票据 */
const { streamId } = MDBridge.aiEdit.beginStream({ target: targetHash, op: 'replace' })

/** ② 把完整内容切片推送（原生侧建议 ≥ 32ms 间隔；web 端 rAF 自动合帧渲染） */
const content = '## Related images（已更新）'
let pos = 0
const timer = setInterval(() => {
  if (pos >= content.length) {
    clearInterval(timer)
    MDBridge.aiEdit.endStream(streamId)   // ③ 结束，进入预览态
    MDBridge.aiEdit.accept()              // ④ 落盘（整次变更 = 一条 undo 记录）
    return
  }
  MDBridge.aiEdit.pushChunk(streamId, content.slice(pos, pos + 8))
  pos += 8
}, 48)
```

### 4.4 需要监听的 web → 原生事件

| 事件名 | 载荷 | 处理 |
|--------|------|------|
| `aiEditStateChanged` | `{ state: 'idle' \| 'streaming' \| 'preview' }` | 同步 UI 状态 |
| `aiEditConflict` | `{ streamId?: string }` | 用户编辑了流式 / 预览区域，会话已自动回滚——**中断推送循环即可**，内容无需补救 |

### 4.5 错误处理

`applyOperations` 按条返回，单条失败不影响其余：

| `error` | 含义 | 建议处理 |
|---------|------|----------|
| `TARGET_NOT_FOUND` | hash 已失效（块被用户改过 / 同批前序操作改过） | 重新 `readBlocks` 取新 hash 重试 |
| `SEARCH_NOT_FOUND` / `SEARCH_NOT_UNIQUE` | `searchReplace` 的搜索串无匹配 / 多匹配 | 改用 `replace` 整块替换 |
| `STREAM_NOT_FOUND` | streamId 失效（会话已结束 / 冲突终止） | 放弃本次流式 |

完整错误码联合类型见 `tiptap-editor/packages/tiptap-ai/README.md` §3

### 4.6 内容通道选择

| 通道 | 适用内容 | 说明 |
|------|----------|------|
| `format: 'markdown'`（默认） | 文字、标题、列表、speaker、ctx-ref marker、图片 `![alt](src)` | 图片仅保留 src / alt / title，布局属性丢弃 |
| `format: 'html'` | 渐变高亮 `<mark data-color>`、`<img>`（自动生成 id） | 任何实现了 `parseHTML` 的自定义节点都可写入 |
| `format: 'json'` | **无损首选**：ProseMirror JSON 直达节点 | 单节点、节点数组、整个 doc、JSON 字符串均接受；width 等富属性完整保留；非法结构被 schema 校验拒绝，不会污染文档 |

## 5. 已知边界

- marker 必须紧跟正文同一行、不能在代码块内（给算法侧的输出约定见 `tiptap-editor/docs/ctx-ref-marker-assessment.md` §5）
- 哨兵节点页面上不可见（无样式时 ctx-ref 锚点也是零宽不可见的，属预期）
- 要求 `@tiptap/markdown >= 3.23.5`（行内 atom 节点的 mark 序列化修复，[tiptap#7830](https://github.com/ueberdosis/tiptap/pull/7830)；当前仓库为 3.26.0）

## 6. 测试

- 本包：`src/ctx-ref/__tests__/markdown-roundtrip.test.ts`（存活 / 幂等 / 渲染 / 点击）
- 集成：`packages/markdown-mobile-tiptap/src/__tests__/ctx-ref.test.ts`（全扩展栈共存、哨兵定位假流式）
- 能力边界：`packages/markdown-mobile-tiptap/src/__tests__/region-edit-capability.test.ts`（自定义节点写入、老文档自举、精确落点）
- 肉眼验证：mobile dev 页（`pnpm dev`）右下角 DevPanel「ctx-ref marker」区
