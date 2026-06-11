# GradientHighlight 渐变高亮

基于 *@tiptap/extension-highlight* 的 Mark 扩展：`color` 命中渐变 key 时渲染文字渐变，其它值走背景色高亮，已开启 `multicolor`

## 序列化支持

| 格式 | 支持 | 说明 |
|------|------|------|
| JSON | ✅ 无损 | mark + color attr |
| HTML | ✅ 无损 | `data-color` + inline style |
| Markdown | ✅ 无损 | 无色 `==text==`，带色 `<mark data-color>`，见下 |

### Markdown 协议

```markdown
==无色高亮==

<mark data-color="skyBlue">渐变高亮</mark>
<mark data-color="#fef08a">背景色高亮</mark>
```

- **无色**：保持 `==text==` 语法（社区通用扩展，Obsidian / Typora 等支持；继承官方 tokenizer）
- **带色**：markdown 表达不了颜色，降级为 `<mark data-color="...">`；`<mark>` 是标准 HTML5 元素，外部 GFM 渲染器降级显示默认黄底，导入本编辑器自动还原

多轮往返逐字符幂等，见 `__tests__/markdown-roundtrip.test.ts`

## Attrs

| 属性 | 说明 |
|------|------|
| `color` | 渐变 key（见下）或任意 CSS 色值；`null` 为无色高亮 |

## 渐变 key

定义在 `constants.ts` 的 `gradientStylesMap`，共 11 个：

`mysticPurpleBlue` `skyBlue` `gorgeousPurpleRed` `warmSunshine` `naturalGreen` `mysticNight` `colorfulCandy` `starryNight` `metallic` `snowyGlacier` `tropicalSummer`

每项含 `label`（菜单显示名）与 `gradient`（完整 CSS gradient），`isGradientType(value)` 判断是否渐变 key

## 用法

```ts
editor.chain().setHighlight({ color: 'mysticPurpleBlue' }).run()  // 文字渐变
editor.chain().setHighlight({ color: '#fef08a' }).run()           // 背景色
editor.chain().toggleHighlight().run()                            // 无色高亮
```
