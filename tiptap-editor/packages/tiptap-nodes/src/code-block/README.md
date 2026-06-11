# CodeBlock 代码块

基于 *@tiptap/extension-code-block-lowlight* 的代码块，语法高亮（lowlight common 语言集）+ React NodeView（语言切换下拉）

## 序列化支持

| 格式 | 支持 | 说明 |
|------|------|------|
| JSON | ✅ 无损 | `language` attr 完整保留 |
| HTML | ✅ 无损 | `data-language` + `class="language-xxx"` 双形态输出，解析两者皆可 |
| Markdown | ✅ 无损 | 标准围栏语法 ` ```lang `（继承官方实现） |

````markdown
```ts
const a = 1
```
````

## Attrs

| 属性 | 默认 | 说明 |
|------|------|------|
| `language` | `'javascript'` | 高亮语言；解析时经 `LANGUAGE_ALIASES` 归一化（如 `js → javascript`，见 `constants.ts`） |

## 行为

- 输入规则：行首 ` ```lang ` 或 `~~~lang` + 空格即转为代码块
- 复制增强：选区复制时同时写入 `text/plain`（markdown 形态）与 `text/html`，粘贴到外部应用保留结构
- `configure({ lowlight, defaultLanguage: 'typescript' })` 已内置，直接引入使用

## 用法

```ts
import { CodeBlock } from 'tiptap-nodes/code-block'

// 配合 StarterKit 时需禁用其内置 codeBlock
StarterKit.configure({ codeBlock: false })
```
