# Tiptap 多人实时协同常见问题（Yjs / Hocuspocus）

> 所有结论均已对源码 / 官方文档核验，附权威链接（见 [§7](#7-参考资料)）

---

## 1. 适用范围

面向「用 Tiptap（ProseMirror 内核）构建多人实时协同编辑」的场景，尤其是需要 **web + 桌面 + 移动端 WebView 多端协同** 的情况。核心选型背景：

- Tiptap 官方协同扩展 `@tiptap/extension-collaboration` **底层是 Yjs / y-prosemirror**（CRDT，*Conflict-free Replicated Data Type*，无冲突复制数据类型），不是 `prosemirror-collab`（OT，*Operational Transformation*，操作变换）。一旦用官方协同扩展，就等于走 Yjs 路线
- 官方推荐的协同后端是 **Hocuspocus**（基于 Yjs 的 WebSocket 服务器）

---

## 2. 核心问题

1. 多人实时协同**必须**用 Yjs 吗？
2. 用 Yjs 时，**后端能 patch markdown** 吗？
3. 后端是 **Python / Go 等非 JS 语言**，有 Yjs 库吗？
4. WebView（移动端内嵌网页）怎么参与 Yjs 协同？必须走网络吗？能否「本地 WebView 跑、原生管网络」？
5. 协同会遇到冲突吗？靠时序控制、冲突由用户承担？和 git 有何不同？

---

## 3. 逐条解答

### Q1：多人实时协同必须用 Yjs 吗？

不是物理必须，但在 Tiptap 生态里它是最省心的主流选择，原因：

- Tiptap 官方协同扩展（`@tiptap/extension-collaboration`）**只支持 Yjs**。用它就是用 Yjs
- 唯一的非 Yjs 替代是 **`prosemirror-collab`（Steps + OT，中央权威服务器）**。它与 Yjs 协同扩展**互斥**（同一编辑器不能同时挂两套文档绑定），且需要后端自行实现 version / rebase 逻辑

两条路线的本质区别：

| | Yjs（CRDT） | prosemirror-collab（OT） |
|---|---|---|
| 冲突解决 | 客户端去中心化自动合并，无需中央权威 | 中央权威服务器排序 + rebase |
| 后端职责 | 中继 / 合并 / 存二进制（可不懂文档结构） | 必须跑 ProseMirror 运行时 + 镜像 schema，apply steps |
| 离线 / 弱网 | 原生支持，重连自动合并 | 需自行处理 |
| Tiptap 集成 | 官方扩展开箱即用 | 需自行搭桥，且与官方协同扩展互斥 |

> **结论**：除非有强理由自建 OT 服务器，多人实时协同优先 Yjs

### Q2：用 Yjs 时，后端能 patch markdown 吗？

**不能 ——「Yjs 不 patch markdown」是最需纠正的认知**

- Yjs 的真相源是**二进制 CRDT 状态**。协同后端（如 Hocuspocus）默认存的是二进制 blob，靠 `Y.applyUpdate` 自动合并，**不理解文档结构、也不碰 markdown**。官方明确警告：不要把内容存成 JSON 再重建 Y.Doc，否则新连接合并时内容会重复
- 要在服务端得到 markdown：须**额外**跑 `y-prosemirror` 的 `yDocToProsemirrorJSON(ydoc)`（拿到 ProseMirror JSON）→ 再用与编辑器一致的 schema + 一个 markdown serializer → 派生**整篇 markdown 快照**

也就是说，Yjs 给你的是「自动合并二进制 + 按需派生整篇快照」，**不是「在后端按区域 patch 一段 markdown 字符串」**：

| | 真相源 | markdown 角色 | 「局部更新」如何发生 |
|---|---|---|---|
| **Yjs** | 二进制 CRDT | 派生的只读视图 | 二进制自动合并；markdown 整篇重新派生 |
| **若想后端按区域 patch markdown** | markdown 本身 | 真相源 | 需要另搞一套「块级 diff / patch」机制（与 Yjs 无关） |

> 想要「后端存 markdown、按块局部更新」属于另一类需求（单写者增量持久化），用 Yjs 反而别扭 —— 你仍得在派生快照上再做一次块 diff

### Q3：后端是 Python / Go 等非 JS 语言，有 Yjs 库吗？

有，且与 JS 端 `yjs v13` 二进制兼容（已核验）：

| 库 | 语言 | 维护状态 | 基于 | 与 yjs v13 二进制兼容 |
|----|------|----------|------|----------------------|
| **pycrdt** | Python | ✅ 活跃 | Rust `yrs` | ✅ |
| pycrdt-websocket | Python | ✅ 活跃 | pycrdt | ✅ |
| ~~ypy / ypy-websocket~~ | Python | ❌ 已弃用 | — | 被 pycrdt 取代 |
| **yrs** | Rust | ✅ 官方核心 | Yjs 端口 | ✅（V1 / V2 编解码） |
| **ygo** | Go | ✅ 生产（Re:Earth） | 纯 Go 端口 | ✅ |

**现实坑**：`Hocuspocus 是 JS-only`（没有 Python / Go 版），却是 Tiptap 协同的事实标准。常见生产姿势：

> **用 Node 跑 Hocuspocus 当「协同 / 持久化微服务」**，非 JS 主后端通过：① 读共享 DB 里的 Yjs 二进制 + 本语言的 CRDT 库（如 `pycrdt`）解析，或 ② 经 Hocuspocus 的 webhook / REST 拿派生快照 —— 即主后端消费「派生只读视图」，不直接进 live sync 流。
>
> 也可以纯本语言跑独立 CRDT 服务（如 `pycrdt-websocket`、`ygo`），但网络 / 鉴权 / 扩展性都要自己扛，不如 Hocuspocus 成熟

### Q4：WebView 怎么参与 Yjs 协同？

Yjs 协同 = 每个客户端持有一个 Y.Doc，通过网络互发二进制 update（通常走 WebSocket）。WebView（移动端内嵌网页）有两种接法：

- **方式 ①（WebView 直连）**：WebView 内的 JS 直接连 WebSocket（如 `new HocuspocusProvider(...)`）。实现最直接，但网络、鉴权 token、断线重连都落在 WebView 里，原生壳只是容器
- **方式 ②（原生桥接中转）**：WebView 内的 Y.Doc 产出 update（监听 `ydoc.on('update', u => ...)`），把二进制（转 base64）经 **JS ↔ 原生桥**（iOS `webkit.messageHandlers` / Android JS interface）抛给原生；**由原生负责网络上传 / 下发**；收到远端 update 再调 WebView 暴露的方法 `Y.applyUpdate(base64)`。原生当哑管道

```text
方式 ②（桥接中转）数据流：

  WebView (Y.Doc) --ydoc.on('update')--> [base64] --JS桥--> 原生 --网络--> 服务器
  WebView (Y.applyUpdate) <--JS方法-- 原生 <--网络-- 服务器（远端 update）

  awareness（光标 / 在线状态）走同一条桥，但属临时通道、不持久化
```

> 「本地 WebView 跑出结果、再用事件通知原生去调接口」= 方式 ②，成立且业界常用。需要新增一对桥方法：上行（WebView → 原生，送本地 update）+ 下行（原生 → WebView，灌远端 update）

### Q5：协同会遇到冲突吗？和 git 有何不同？

**核心：CRDT 和 OT 都不会产生 git 那种「需要人工解决」的冲突。** 它们保证所有副本**收敛**到同一份文档、自动合并、**永不阻塞**，没有 `<<<<<<<` 冲突标记。代价是：只保证收敛，不保证「合并结果符合任一方原意」

- **没有 git 式冲突标记**：git 是行级三方合并，两个分支改了重叠行就停下来塞冲突标记、要人工解决（宁可不猜）。CRDT / OT 不会 —— 总能自动合并出一个所有端一致的结果
- **CRDT 怎么自动合并（无中央权威）**：每个字符 / 元素带唯一 id（`clientID` + 逻辑时钟 Lamport clock）和确定性全序。并发插入同一位置 → 按 id 确定性定序（不是谁覆盖谁）；并发删除 → 幂等（墓碑 tombstone）。任意顺序应用 update 都收敛（满足交换律 + 幂等）。所以「时序」不是靠中央排序，而是靠每个操作自带的逻辑时钟
- **OT 怎么自动合并（通常靠中央权威）**：每个编辑是一个 operation（如「在 pos 5 插入 x」）。灵魂是 **transform 函数**：把并发 operation 互相变换使其组合后收敛。典型实现 = 中央服务器给 operation 排版本号、客户端把待发 operation **rebase** 到已确认 operation 之上（ProseMirror collab 即此）
- **「冲突由用户承担」—— 半对**：没有「选哪边」的冲突 UI；但只保证 **收敛（convergence，大家看到同一份）**，不保证 **意图（intention，合并内容符合原意）**。两人同时改写同一句 → 可能交织成一句所有人一致但读不通的话，用户看到后顺手改。负担是「永不被阻塞，但偶尔得清理自动合并结果」，不是「弹窗让你解决」

**与 git 的本质区别：**

| | git | CRDT / OT（实时协同） |
|---|---|---|
| 粒度 | 行 / 快照 | 字符 / operation |
| 时机 | 异步、离线、显式 `merge` | 实时、连续 |
| 重叠改动 | **停下来，冲突标记，人工解决** | **永不停，自动确定性合并** |
| 保证 | 不猜测（宁可让你解决） | 收敛（不一定保意图） |
| 谁定序 | 你 `merge` 时定 | CRDT：逻辑时钟自带；OT：中央版本号 |

> 一句话：git = 「重叠就停、问人」；CRDT / OT = 「永远自动合并到一致，代价是结果可能要事后顺一下」

> **顺带纠正常见误解：OT ≠ JSON Patch**。JSON Patch（RFC 6902）只是「描述 JSON 改动」的**格式**（一组 add/remove/replace + path），**没有并发 / 收敛语义** —— 两个基于同一基线算出的 patch 先后套用，第二个可能错位甚至损坏文档。OT 的灵魂是 **transform + 版本**，专门解决并发收敛。ProseMirror 的 Step 接近 operation，但能协同靠 collab 模块的 version + rebase，不是 Step 格式本身。所以：JSON Patch 是哑的 patch 格式（适合单写者增量），OT 是并发控制算法，别混

---

## 4. 两个关键事实（已验证）

| # | 结论 | 证据 |
|---|------|------|
| F1 | **Node 后端可无浏览器地 apply ProseMirror Steps**（OT 路线，非 Yjs） | `Step.fromJSON(schema, json)` + `step.apply(doc)`，仅依赖 `prosemirror-model + prosemirror-transform`（无 DOM）。但需**镜像编辑器 schema**（`getSchema(extensions)` 可在 Node 构建），版本 / rebase 后端自行实现 |
| F2 | **Yjs 后端是 schema 无关的二进制中继** | Hocuspocus Database 存 `Uint8Array`，CRDT 自动合并、增量同步天然。后端存的是**不透明二进制非 markdown**；要服务端读出 markdown 须额外跑 `y-prosemirror` 的 `yDocToProsemirrorJSON` + 镜像 schema serializer |

---

## 5. 典型架构（Yjs 多端协同）

- **客户端（web / 桌面 / WebView）**：`@tiptap/extension-collaboration` + Provider（如 `HocuspocusProvider`），各端共用一个 Y.Doc 模型
- **协同后端**：Node 跑 Hocuspocus，持久化二进制；非 JS 主后端用 `pycrdt` / `ygo` 消费派生快照（见 Q3）
- **移动端 WebView**：跑 Yjs + 原生桥接中转（见 Q4 方式 ②）
- **markdown 派生**：作为只读视图，在 `onStoreDocument` 等 debounced 钩子里用 `yDocToProsemirrorJSON` + serializer 产出，写入业务库

### 常见坑

- **UniqueID / 块 id 扩展 × Yjs**：若给节点加持久 id，必须在 provider 同步完成后再挂载 editor，并用 `filterTransaction: tr => !isChangeOrigin(tr)` 跳过远端事务，否则 id 重复
- **schema 漂移**：Y.Doc 按某套 schema 编码；多端编辑器扩展若不一致，`yDocToProsemirrorJSON` / 内容校验可能报错。多端务必共用同一份扩展定义
- **历史无限增长**：Yjs update 是 append-only，磁盘上二进制状态会持续增长，需配合快照 / GC

---

## 6. Yjs（CRDT）vs prosemirror-collab（OT）选型速查

| 维度 | Yjs | prosemirror-collab |
|------|-----|--------------------|
| 适合 | 实时多人 + 离线 + 多端 | 中央权威、强一致、审计日志 |
| 后端复杂度 | 中继 / 存二进制，可不懂结构 | 必须跑 PM 运行时 + 镜像 schema |
| 与 Tiptap 集成 | 官方扩展开箱即用 | 自行搭建，且与官方协同扩展互斥 |
| 传输内容 | 二进制 update（增量） | 序列化 Step（增量，字符级） |
| markdown | 派生只读视图 | 同样需派生（PM JSON → serializer） |

---

## 7. 参考资料

### Yjs / Hocuspocus
- Yjs 仓库 / 文档更新 API：<https://github.com/yjs/yjs> · <https://docs.yjs.dev/api/document-updates>
- y-prosemirror（`yDocToProsemirrorJSON` 等）：<https://github.com/yjs/y-prosemirror>
- y-protocols 同步协议：<https://deepwiki.com/yjs/y-protocols/2.1-sync-protocol>
- Hocuspocus 概览 / 持久化 / Database：<https://tiptap.dev/docs/hocuspocus/getting-started/overview> · <https://tiptap.dev/docs/hocuspocus/guides/persistence> · <https://tiptap.dev/docs/hocuspocus/server/extensions/database>
- Tiptap Collaboration 扩展：<https://tiptap.dev/docs/editor/extensions/functionality/collaboration>

### 跨语言 Yjs 后端（Q3）
- pycrdt（Python）：<https://pypi.org/project/pycrdt/> · 公告 <https://discuss.yjs.dev/t/announcing-pycrdt/2284>
- pycrdt-websocket：<https://github.com/y-crdt/pycrdt-websocket>
- yrs（Rust 官方核心）：<https://crates.io/crates/yrs> · <https://github.com/y-crdt/y-crdt>
- ygo（Go）：<https://github.com/reearth/ygo>
- 各语言端口总览：<https://docs.yjs.dev/ecosystem/ports-to-other-languages>

### prosemirror-collab（OT 替代路线，F1）
- ProseMirror 协同指南：<https://prosemirror.net/docs/guide/#collab>
- `Step.fromJSON` / `Step.apply`：<https://prosemirror.net/docs/ref/#transform.Step%5EfromJSON> · <https://prosemirror.net/docs/ref/#transform.Step.apply>
- 官方 server 实现（无浏览器 apply steps）：<https://github.com/ProseMirror/website/blob/master/src/collab/server/instance.js>
- `prosemirror-collab`：<https://github.com/ProseMirror/prosemirror-collab>
- Marijn《协同编辑》原理：<https://marijnhaverbeke.nl/blog/collaborative-editing.html>
