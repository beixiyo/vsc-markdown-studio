# Speaker 说话人标签（示例节点）

markdown 中的 `[speaker:1]` 会被解析为一个行内**原子节点**，渲染成一个带说话人名字的行内小标签
（前端惯称 *chip*：一小块圆角、内嵌一段数据的行内元素，如邮件收件人框里那种可点的联系人块）

本仓是通用仓，speaker 本属于服务层节点，收录在这里的目的是**教学示例**：
演示「原子节点 ⇄ `renderText` ⇄ 文档内搜索」的关系。忘了 atom 节点为什么能被搜索时，回来看这篇

## 问题：atom 节点的展示文本「不存在」

```
paragraph
 ├─ text("大家好，我是")            ← 文本节点，getText / 搜索天然可见
 └─ speaker(attrs: { name: "Alice" }) ← atom 叶子，无文本子节点
```

标签上的 "Alice" 是渲染时从 attrs 算出来画到 DOM 上的，
**文档模型里没有这串字符**。因此默认情况下：

- `editor.getText()` 拿不到它
- `tiptap-search` 只遍历文本节点，搜 "Alice" 永远 0 命中

## 契约：`renderText` → `spec.toText`

tiptap 给节点定义了标准字段 `renderText`——「我这个节点的纯文本表示是什么」
初始化 schema 时它会被挂到 `node.type.spec.toText`，成为运行时任何人都可查询的接口
（`editor.getText()` 就消费它；hardBreak 用它返回 `\n`）

本节点实现：

```ts
renderText({ node }) {
  return resolveDisplayText(node.attrs, this.options)
  // 与 NodeView / renderHTML 画标签共用同一函数 → 看到什么就能搜到什么
}
```

## 接入搜索：宿主显式注入 `leafText`

`tiptap-search` 默认只搜文本节点、**不消费任何节点的私有数据**；
想让 atom 节点可被搜索，宿主注入现成的 resolver：

```ts
import { leafTextFromRenderText, Search } from 'tiptap-search'

Search.configure({
  /** 叶子节点以 renderText（spec.toText）产出的文本参与匹配 */
  leafText: leafTextFromRenderText,
})
```

搜索层对 speaker 的了解为零——它只认「实现了 `renderText` 的节点」
任何新原子节点（mention、话题标签……）照此实现 `renderText`，不改一行搜索代码即自动可搜

命中坐标的处理：展示文本的每个字符都映射回节点自身位置，
命中折叠为整节点 `[pos, pos + 1)`，高亮与跳转覆盖整个标签
详见 `tiptap-search/src/search.ts` 与 `__tests__/search-integration.test.ts`

## 展示名解析

`attrs.name`（节点级、可随时更新）> `options.speakerMap` 兜底 > i18n 缺省名（`Speaker X`）

attrs 必须优先：tiptap 的 `extension.options` 运行时不可变（getter），
动态改名只能写节点 attrs；speakerMap 仅覆盖「初始加载、attrs 尚未写入」的窗口

缺省名走 `formatFallback` 注入 rules 的纯函数，而不在 rules 里硬编码——
i18n 属于宿主环境，隔离后 rules 可被单测直接断言

## i18n 缺省名随语言切换刷新

缺省名取自 `tiptap.speaker.speaker`（`packages/tiptap-api` locale，带 `{{number}}` 插值）。
标签用 NodeView 渲染并订阅 `language:change`，切换语言时即时重绘：

```ts
const i18n = getI18n()
i18n?.on('language:change', () => updateText())   // updateText 重新调 resolveDisplayText → t()
// destroy 时 i18n?.off(...) 取消订阅
```

> 已写入 `attrs.name` 或 speakerMap 命中的标签显示固定名字，不受语言影响；
> 只有走缺省名的标签会随语言变化

## 点击回调

`options.onClick` 传入即可点（如打开「编辑说话人」面板）；不传则标签惰性、无插件开销：

```ts
SpeakerNode.configure({
  onClick: (attrs, event) => openSpeakerEditor(attrs.originalLabel),
})
```

回调走 ProseMirror 插件的 `handleDOMEvents.click`，从 DOM 的 `data-speaker-*` 还原 attrs 交给宿主

## 示例的边界

本示例只认 `[speaker:X]` 一种 markdown 格式、attrs 只保留 `originalLabel` + `name`。
业务侧若要携带更多数据（说话人 id、旧格式兼容等），在自己的宿主层扩展，别塞进这个通用节点
