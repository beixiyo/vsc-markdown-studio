# CtxRef 上下文引用锚点（示例节点）

markdown 里的 `<!--ctx-ref:{type}:{id}-->` 会被解析成一个行内**原子节点**，
作为「不可见数据锚点」：把总结里的一句话关联到某个资源（一处标注 mark、一条笔记 note……），
供编辑器内做高亮跳转，但本身不占可见文本

本仓是通用仓，ctx-ref 本属于业务节点，收录在这里的目的是**教学示例**：
演示「HTML comment marker ⇄ 原子节点 ⇄ markdown 无损往返」，以及一个容易踩的坑——
为什么未知类型也必须在词法层被消费

## 它和 speaker 示例正相反

| | speaker | ctx-ref |
|---|---|---|
| 有没有可见文本 | 有（说话人名字） | 无（零宽锚点） |
| `renderText` | 返回展示名 → **能被搜索** | 返回 `''` → **搜不到、复制不到** |
| 存在意义 | 展示 + 可搜 | 纯数据锚点，服务高亮跳转 |

两个示例一起看，能把「atom 节点的纯文本表示（`renderText`）由节点自己决定」这件事讲全

## 核心一：marker 必须在词法层被消费（含未知类型）

`@tiptap/markdown` 的通用 HTML 解析会把行内 `<!--...-->` 解析成
「嵌在 inline 内容里的空 paragraph」——这是一个**非法 doc**。渲染阶段不校验，看不出异常，
但后续任何触及该段落的 transaction（编辑、`setNodeMarkup`、切 checkbox……）都会抛
`RangeError: Invalid content for node paragraph`，整页崩溃（真实白屏事故的根因）

所以 tokenizer 的类型段是**开放词表**（`[\w-]+`，不做白名单）：即便是没见过的
`<!--ctx-ref:speaker:9-->`，也解析成一个 ctxRef 节点（不可见、原样序列化），
绝不放行给通用 HTML 解析。测试里专门锁了这条

## 核心二：往返幂等，锚点不丢

```ts
renderText() { return '' }                      // 不进纯文本 / getText / 搜索
renderMarkdown: node => renderCtxRefMarker(node.attrs)  // 原样吐回 <!--ctx-ref:type:id-->
```

`renderMarkdown` 两侧不补任何字符，保证 `parse → serialize` 逐字符幂等——
「加载 → 编辑 → 保存」多轮往返锚点都在

## 核心三：复制 / 导出要剥离锚点

锚点只服务编辑器内交互，不该出现在复制出去的纯文本里。用 `stripCtxRefMarkers`：

```ts
import { stripCtxRefMarkers } from 'tiptap-nodes/ctx-ref'

stripCtxRefMarkers("***'I feel'***<!--ctx-ref:mark:1-->.")
// => "***'I feel'***."

stripCtxRefMarkers(md, { types: ['note'] })   // 只删某些类型
```

> ⚠️ **保存 / 往返序列化不要用它** —— 那会把锚点永久删掉。剥离只用于「产出给人看的文本」

## 点击回调

`options.onClick` 传入即可点；回调载荷带 `refType` / `refId`，外部据此定位资源
额外附带 `sentence`：marker 前紧邻的加粗斜体句（约定与该引用对应的一句话以 `***...***` 结尾）

```ts
CtxRefNode.configure({
  onClick: ({ refType, refId, sentence }) => locateResource(refType, refId),
})
```

## 配套：HtmlCommentNode 兜底节点

CtxRefNode 只认 `<!--ctx-ref:...-->`。那**其他**行内注释（`<!--todo-->` 之类）呢？
它们同样会被通用 HTML 解析搞成非法 doc。所以配一个兜底节点，把**非** ctx-ref 的行内
`<!--...-->` 也吞成不可见 atom、原样往返。两者一起才关严了「行内注释崩文档」这个口子：

```ts
import { CtxRefNode, HtmlCommentNode } from 'tiptap-nodes/ctx-ref'

extensions: [
  CtxRefNode.configure({ /* ... */ }),
  HtmlCommentNode.configure(),   // 顺序无关，靠正则让行：ctx-ref marker 交给 CtxRefNode
]
```

- 让行不依赖注册顺序：`HtmlCommentNode` 的 tokenizer 先 `CTX_REF_REGEX.test`，命中就返回
  `undefined` 把 marker 让给 `CtxRefNode`
- 只覆盖**行内**注释；独占一行的注释走 marked 的 block 词法，结构合法（只是往返会丢），不在此处理

## 运行时状态与文档协议

示例刻意做了减法，移植前先了解生产版多出的部分：

- **内置图标库**：生产版按 refType 渲染旗帜 / 笔记 / 图片角标 / 记录等整套 SVG，且外部可整体接管；示例内联两张（mark 旗帜、note 笔记，未知类型回落 note）
- **图标工厂契约**：生产版允许外部按类型完全接管图标 DOM（`icons` 选项）；示例不支持
- **流式动效**：`setCtxRefStreaming` 命令切换「静态 ⇄ 书写动画」，仅修改编辑器内运行时状态，不写入 Markdown

流式状态会在编辑器 DOM 的锚点上挂载 `data-vv-ctx-ref-streaming`，可直接用于 CSS 动画或外部 DOM 查询；文档协议属性 `data-ctx-ref`、`data-ctx-id` 保持不变
