# 文档块级增量同步 —— 后端对接说明

> 给后端同学:本文是**自包含**的接口契约,不需要你了解前端代码。读完就能实现
> 目标:编辑器内容变化时,**只把改动的「块」传给后端**,而不是每次整篇 markdown 覆盖,从而大幅减少传输与写入

---

## 0. 一句话概括

前端把文档拆成**顶层块**(段落 / 标题 / 列表 / 代码块 / 表格…),每块有一个**稳定 id**。内容变化时,前端算出「哪些块新增/改了/删了」,发给后端;后端**按 id 增量更新自己存的块表**,用一个**版本号做乐观锁**,版本对不上就让前端整篇重传(兜底)

后端**不需要**安装编辑器 / ProseMirror / Tiptap,也**不需要解析 markdown**。块内容对后端就是不透明字符串

---

## 1. 为什么这么做

| 方案                                 | 问题                                                     |
| ------------------------------------ | -------------------------------------------------------- |
| 旧:每次 `getMarkdown()` 整篇上传覆盖 | 文档大时每次都搬几十 KB;改一个字也重传全文               |
| 新:块级增量                          | 传输量 ∝ 「这次改了多少」,与文档大小无关。改一段只传一段 |

实测:在 1.6 KB 文档里改一个段落,增量约 0.8 KB,省 ~50%;文档越大省得越多

---

## 2. 名词

- **块 (block)**:文档的顶层节点。一个段落、一个标题、一个列表(整个列表算一块)、一个表格(整张表算一块)等
- **blockId**:每个块的稳定标识(形如 `blk_3f9a...`)。同一个块在多次保存之间 id 不变;前端生成,后端**原样存储与引用,不要自己生成或改写**
- **version**:每篇文档一个**单调递增整数**,由**后端**维护。每成功应用一次增量 +1。它是乐观锁的核心
- **baseVersion**:前端发增量时携带的「我这次是基于后端哪个版本算出来的」
- **增量 (payload)**:一次上报的数据包(见 §4.1)
- **回执 (result)**:后端对一次上报的响应(见 §4.2)

---

## 3. 总体数据流

```
┌─────────── 前端(web / 桌面 / 移动 WebView)───────────┐
│  用户编辑 → 防抖 → 算出「变化的块」=> payload        │
└───────────────────────┬──────────────────────────────┘
                        │  上报 payload
                        ▼
┌──────────────────────── 后端 ───────────────────────────┐
│  1. payload.baseVersion == 库里 version ?               │
│       否 → 回 { status:'resync', version }(要求整篇重传)│
│  2. 按 ops 改库:upsert 写/覆盖块,delete 删块            │
│  3. 按 order 给块排序                                   │
│  4. version += 1                                        │
│  5. 回 { status:'ack', version }                        │
└───────────────────────┬─────────────────────────────────┘
                        │  回执
                        ▼
        前端收到 ack → 记下新 version,继续发后续增量
        前端收到 resync → 整篇重传一次,回到正轨
```

传输通道由你们定:HTTP 接口、WebSocket 都行。下面按 **HTTP** 描述,最直接

---

## 4. 接口约定

### 4.1 上报增量:`POST /api/docs/{docId}/sync`

请求体(JSON):

```jsonc
{
  "protocolVersion": 1, // 协议版本,目前恒为 1
  "baseVersion": 2, // 本次增量基于的后端版本(乐观锁关键)
  "clientId": "cli_nkfc1dn3", // 客户端实例 id(用于幂等去重)
  "seq": 5, // 该客户端单调自增序号(用于发现乱序/丢包)
  "ops": [ // 变化的块操作(可能为空数组:纯顺序变化)
    {
      "op": "upsert", // 新增或更新一个块
      "id": "blk_7q8kd59g", // 块稳定 id
      "type": "paragraph", // 块类型(paragraph/heading/bulletList/table…),仅供分类/调试
      "hash": "9f3a1c2e88d0b7a6", // 该块内容 hash(后端可选用于幂等/校验)
      "content": {
        "format": "markdown", // 'markdown' | 'html' | 'json'
        "value": "改写后的整段内容", // 块内容字符串(format=json 时为对象)
      },
    },
    {
      "op": "upsert",
      "id": "blk_x1",
      "type": "paragraph",
      "hash": "7b2e...",
      "lossy": true, // true 表示 markdown 无法无损表达,content 已降级为 html/json
      "content": {
        "format": "html",
        "value": "<p><mark data-color=\"skyBlue\">带高亮的段落</mark></p>",
      },
    },
    {
      "op": "delete", // 删除一个块
      "id": "blk_old2",
    },
  ],
  "order": [ // 全量顶层块 id 顺序(位置权威)
    "blk_7q8kd59g",
    "blk_x1",
  ],
  "docChecksum": "e1c2d3f4a5b60718", // 应用本次增量后整篇文档的校验和(可选用于一致性自检)
}
```

### 4.2 回执:响应体(HTTP 200)

后端**始终返回 HTTP 200**,语义放在 body 的 `status` 里(这样前端统一解析)。三选一:

```jsonc
// ① 接受:已应用,给出新版本号
{ "status": "ack", "version": 3 }

// ② 拒绝:版本不匹配(有别的写入抢先了),前端将整篇重传
{ "status": "reject", "version": 7 }

// ③ 要求整篇重传:网关/校验和不符/未知 base 等
{ "status": "resync", "version": 7 }
```

> `reject` 与 `resync` 前端处理方式相同(都触发整篇重传),你只用其一也行。推荐统一用 `resync`

### 4.3 字段详解

| 字段                   | 类型                             | 后端怎么用                                                               |
| ---------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `protocolVersion`      | int                              | 目前恒 1。将来字段只增不减;按版本协商                                    |
| `baseVersion`          | int                              | **核心**:与库里 `version` 比较。相等才能应用;不等回 `resync`             |
| `clientId`             | string                           | 幂等去重的一半(配合 `seq`)                                               |
| `seq`                  | int                              | 同一 `clientId` 单调递增。可据此发现乱序/重复,丢弃旧的或重复的           |
| `ops[].op`             | `'upsert'`\|`'delete'`           | upsert=写入/覆盖该 id 的块;delete=删除该 id 的块                         |
| `ops[].id`             | string                           | 块稳定 id,**存储/查找的主键**,原样使用                                   |
| `ops[].type`           | string                           | 块类型名,仅供分类/调试,可存可不存                                        |
| `ops[].hash`           | string                           | 块内容 hash。可选:存下来做幂等(同 id 同 hash 可跳过)或一致性校验         |
| `ops[].content.format` | `'markdown'`\|`'html'`\|`'json'` | 块内容的格式。**markdown 为主**;`lossy` 块用 html;极少数用 json          |
| `ops[].content.value`  | string \| object                 | 块内容。format=json 时是对象,其余是字符串。**对后端是不透明数据,直接存** |
| `ops[].lossy`          | bool?                            | 仅标记;说明该块 markdown 表达不了,content 已是 html/json                 |
| `order`                | string[]                         | **全量**顶层块 id 顺序。位置以它为准:据此排序、识别纯移动                |
| `docChecksum`          | string                           | 可选:应用后自己重算比对(见 §6.5),不符可下次让前端 resync                 |

---

## 5. 后端要做什么

### 5.1 存储模型(示例 SQL)

后端就是一张「按 id 存块」的表 + 一个文档版本:

```sql
CREATE TABLE doc (
  id          VARCHAR(64) PRIMARY KEY,
  version     BIGINT NOT NULL DEFAULT 0,
  -- 幂等用:记录每个 client 最近处理到的 seq
  -- 可单独建表 doc_client_seq(doc_id, client_id, last_seq)
  updated_at  TIMESTAMP
);

CREATE TABLE doc_block (
  doc_id      VARCHAR(64) NOT NULL,
  block_id    VARCHAR(64) NOT NULL,      -- = ops[].id
  ord         INT NOT NULL,             -- 在文档中的顺序(来自 order[])
  type        VARCHAR(32),              -- = ops[].type
  format      VARCHAR(16) NOT NULL,     -- = content.format
  content     TEXT NOT NULL,            -- = content.value(json 时存其序列化串)
  hash        VARCHAR(32),              -- = ops[].hash(可选)
  PRIMARY KEY (doc_id, block_id)
);
CREATE INDEX idx_block_order ON doc_block(doc_id, ord);
```

### 5.2 处理一次上报(伪代码)

```py
def handleSync(docId, payload):
    doc = db.getDoc(docId)            # 不存在则当作 version=0 的空文档
    if doc == null:
        doc = db.createDoc(docId, version=0)

    # —— 乐观锁:版本必须对得上 ——
    if payload.baseVersion != doc.version:
        return { status: 'resync', version: doc.version }

    # —— 幂等:同一 client 的旧/重复 seq 直接当成功忽略 ——
    last = db.getLastSeq(docId, payload.clientId)     # 没有则 -1
    if payload.seq <= last:
        return { status: 'ack', version: doc.version } # 已处理过,幂等返回

    # —— 应用增量(建议放在一个事务里)——
    transaction:
        for op in payload.ops:
            if op.op == 'upsert':
                db.upsertBlock(docId, op.id, type=op.type,
                               format=op.content.format,
                               content=stringify(op.content.value),
                               hash=op.hash)
            else if op.op == 'delete':
                db.deleteBlock(docId, op.id)

        # 按 order 重排;order 里没有的块视为已删(防御性清理)
        db.reorderBlocks(docId, payload.order)
        db.deleteBlocksNotIn(docId, payload.order)

        doc.version = doc.version + 1
        db.setVersion(docId, doc.version)
        db.setLastSeq(docId, payload.clientId, payload.seq)

    # —— 可选:一致性自检(见 §6.5)——
    # if computeChecksum(docId) != payload.docChecksum: 记日志/告警

    return { status: 'ack', version: doc.version }
```

要点:

- **整个应用过程放进一个事务**,要么全成功要么全回滚,避免半应用导致库里文档破碎
- `order` 是位置权威。`upsert` 只负责内容,**块放在哪由 order 决定**。一个新块出现在 ops 里,它的位置看 order
- `deleteBlocksNotIn(order)` 是防御:正常 delete 已在 ops 里;但万一漏了,以 order 为准清理能保证后端与前端一致

### 5.3 重建整篇文档

需要把整篇文档拿出来(渲染 / 全文检索 / 导出)时:

```sql
SELECT format, content FROM doc_block
WHERE doc_id = ? ORDER BY ord;
```

把每块 `content` 按顺序拼起来:`format=markdown` 的是 markdown 片段,`format=html` 的是 html 片段
若你们需要**单一纯 markdown**,注意 `lossy` / html 块无法无损转回 markdown(它们本就是 markdown 表达不了的样式),按需保留 html 或忽略样式

---

## 6. 必须遵守的规则

### 6.1 版本是乐观锁

`baseVersion != 库 version` ⇒ 回 `resync`,**不要强行应用**。否则会用旧基础覆盖新内容,丢数据

### 6.2 version 由后端单调递增

每成功应用一次 +1。前端**只认后端回执里的 version** 来推进自己的 `baseVersion`

### 6.3 幂等

网络重试可能让同一个 `(clientId, seq)` 到达两次。用「记录每个 client 的 last_seq」去重:`seq <= last_seq` 直接返回当前 version 的 ack,不要重复应用

### 6.4 order 是位置权威

排序、移动都看 `order`。纯拖动排序时 `ops` 可能为空、只有 `order` 变 —— 这也要更新顺序

### 6.5 docChecksum(可选但推荐)

前端发来的 `docChecksum` = 应用本次增量后**整篇文档**的指纹。算法见附录;若后端也实现同样算法并在应用后比对,不一致说明双方漂移了,可在**下一次**请求时回 `resync` 强制对齐。不想实现可以先忽略此字段

### 6.6 lossy 块照存即可

`lossy:true` 的块 content 是 html/json,后端无差别当字符串存。不要试图把它转成 markdown

---

## 7. 三种回执什么时候用

| 回执     | 何时返回                                                                        | 前端反应                                              |
| -------- | ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `ack`    | 版本匹配且已成功应用                                                            | 推进版本,继续发后续增量                               |
| `resync` | 版本不匹配 / 校验和不符 / 文档不存在需重建 / 任何「我无法可靠地局部应用」的情况 | **整篇重传**一次(把每个块都当 upsert 发),随后回归增量 |
| `reject` | 同 resync(语义等价,二选一即可)                                                  | 同上                                                  |

> 记住:**任何拿不准的情况,回 `resync` 永远安全** —— 前端会整篇重传,最坏退化成一次全量,不会丢数据

---

## 8. 完整示例(一次新建 + 增量 + 冲突重传)

### 第 1 步:新建文档,首次全量推送

请求 `POST /api/docs/doc-1/sync`:

```jsonc
{
  "protocolVersion": 1,
  "baseVersion": 0,
  "clientId": "cli_a",
  "seq": 0,
  "ops": [
    {
      "op": "upsert",
      "id": "blk_h",
      "type": "heading",
      "hash": "aa..",
      "content": { "format": "markdown", "value": "# 标题" },
    },
    {
      "op": "upsert",
      "id": "blk_p",
      "type": "paragraph",
      "hash": "bb..",
      "content": { "format": "markdown", "value": "第一段" },
    },
  ],
  "order": ["blk_h", "blk_p"],
  "docChecksum": "c1..",
}
```

后端:doc-1 不存在 → version=0;baseVersion(0)==0 ✓ → 写入两块 → version=1
响应:`{ "status":"ack", "version":1 }`

### 第 2 步:改了「第一段」

请求:

```jsonc
{
  "protocolVersion": 1,
  "baseVersion": 1,
  "clientId": "cli_a",
  "seq": 1,
  "ops": [
    {
      "op": "upsert",
      "id": "blk_p",
      "type": "paragraph",
      "hash": "dd..",
      "content": { "format": "markdown", "value": "第一段改好了" },
    },
  ],
  "order": ["blk_h", "blk_p"],
  "docChecksum": "c2..",
}
```

后端:1==1 ✓ → 覆盖 blk_p → version=2
响应:`{ "status":"ack", "version":2 }`

### 第 3 步:并发冲突(别的端先写了,后端已 version=3),本端还拿着 baseVersion=2

请求:

```jsonc
{
  "protocolVersion": 1,
  "baseVersion": 2,
  "clientId": "cli_a",
  "seq": 2,
  "ops": [
    {
      "op": "upsert",
      "id": "blk_p",
      "content": { "format": "markdown", "value": "又改了" },
      "type": "paragraph",
      "hash": "ee..",
    },
  ],
  "order": ["blk_h", "blk_p"],
  "docChecksum": "c3..",
}
```

后端:baseVersion(2) != version(3) → **不应用**
响应:`{ "status":"resync", "version":3 }`

### 第 4 步:前端收到 resync,自动整篇重传(baseVersion 用后端给的 3)

请求:

```jsonc
{ "protocolVersion":1, "baseVersion":3, "clientId":"cli_a", "seq":3,
  "ops":[ {"op":"upsert","id":"blk_h",...}, {"op":"upsert","id":"blk_p",...} ],
  "order":["blk_h","blk_p"], "docChecksum":"c4.." }
```

后端:3==3 ✓ → 覆盖全部 → version=4
响应:`{ "status":"ack", "version":4 }` —— 双方对齐,恢复增量

---

## 9. 初始加载(打开已有文档)

同步协议解决的是「**写**(编辑器 → 后端)」。打开文档时还需要一个「**读**」接口,返回整篇内容和当前版本,前端据此打开并把版本对齐:

`GET /api/docs/{docId}` →

```jsonc
{
  "version": 4,
  "blocks": [ // 按 ord 排好序
    { "id": "blk_h", "format": "markdown", "content": "# 标题" },
    { "id": "blk_p", "format": "markdown", "content": "第一段改好了" },
  ],
}
```

- 返回 `version` 让前端把 `baseVersion` 对齐到它(之后发增量才不会立刻被 resync)
- 返回每块的 `id` 让前端尽量复用同一批 id(更精确的增量);若前端这次拿不到/不复用 id,最坏情况是它打开后做一次整篇 push,后端覆盖一遍,也能正常工作
- 简化起步:`GET` 只返回拼好的整篇内容也行,代价是前端打开后会整篇 push 一次来建立基线

## 附录: docChecksum 算法(可选,要做一致性自检才需要)

`docChecksum = FNV-1a-64( 把所有块按 order 拼成 "id\0hash" 用 \x01 连接 )`,输出 16 位十六进制小写
其中每块的 `hash` 即 payload 里 `ops[].hash`(块内容的 FNV-1a-64)
后端若要自检,需保存每块的 `hash`,应用后按 `order` 重算并与 `payload.docChecksum` 比对。不一致 ⇒ 下次回 `resync`

> 不实现也完全可用,只是少一层「静默漂移」防护。如需此功能,联系前端要 FNV-1a-64 的具体实现以保证两端一致

---

## 附录 C:常见疑问

**Q: 后端要装 Tiptap / ProseMirror 吗?**
不用。块内容对后端是不透明字符串,只按 id 存取

**Q: `content.value` 里的 markdown 要解析吗?**
不需要解析,直接存。需要整篇时按 order 拼接即可

**Q: 为什么有 markdown / html / json 三种 format?**
绝大多数块是 markdown(可读、最省)。少数带特殊样式(如渐变高亮)markdown 表达不了,降级成 html(`lossy:true`);极端情况用 json。后端一视同仁存字符串

**Q: 并发多人编辑能用吗?**
本协议是**单写者**模型(乐观锁 + 冲突即 resync)。能正确处理「多个端先后写、偶发冲突」,但不是「多人实时协同」。若将来要做实时协同,那是另一套(Yjs/CRDT) 方案,不在本协议范围

**Q: `order` 为空 / `ops` 为空会发生吗?**
会。纯拖动排序时 `ops` 为空、`order` 变;此时只更新顺序即可
