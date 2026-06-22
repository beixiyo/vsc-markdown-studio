/**
 * 开发环境默认 Markdown 样本
 */
export const devFixture = `# Mobile Markdown Preview

## 正文段落

这是一段普通正文，用于测试移动端 WebView 内的 Markdown 排版。English text mixed with 中文内容，方便观察中英文混排、数字 1234567890 和标点的表现。

短段落。

## 行内样式

这段包含 **加粗文本**、*斜体文本*、~~删除线~~、\`行内代码 inline code\`。

同时测试**加粗和 *加粗斜体* 混用**的效果。

这里有一个 [链接示例](https://example.com)，以及 <u>下划线文本</u>。

## 列表

### 无序列表

- 水果
  - 苹果
  - 香蕉
    - 进口香蕉
    - 国产香蕉
  - 橙子
- 蔬菜
  - 胡萝卜
  - 西蓝花
- 肉类

### 有序列表

1. 第一步：打开应用
2. 第二步：输入 Markdown
3. 第三步：预览渲染结果
   1. 检查长文本换行
   2. 检查滚动体验
4. 第四步：保存内容

### 任务列表

- [ ] 完成移动端适配
- [ ] 对比不同字号下的阅读体验
- [x] 基础组件搭建
- [x] 编辑器集成
- [ ] 性能优化

## 引用

> 这是一段引用文本。好的设计是尽可能少的设计。—— Dieter Rams

> 多层引用测试：
>
> 第二行引用内容，包含 **加粗** 和 *斜体*。
>
> 还有 \`代码\` 也在引用里。

## 代码

行内代码：\`const x: number = 42\` 和 \`pnpm install\`。

代码块：

\`\`\`typescript
interface MarkdownBlock {
  id: string
  markdown: string
}

function formatBlock(block: MarkdownBlock): string {
  return \`\${block.id}: \${block.markdown}\`
}
\`\`\`

\`\`\`css
.markdown-body {
  font-size: 16px;
  line-height: 1.75;
  color: var(--text-primary);
}
\`\`\`

## 表格

| 类型 | 支持 | 备注 |
|------|------|------|
| 段落 | 是 | 普通文本 |
| 图片 | 是 | Markdown 图片语法 |
| 代码 | 是 | 支持 fenced code |
| 表格 | 是 | GFM 表格 |

## 图片

![示例图片](https://picsum.photos/seed/fixture/600/300)

离线可点图片，用于验证「点击图片不应唤起键盘」，无需联网：

![离线测试图](data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='600'%20height='200'%3E%3Crect%20width='100%25'%20height='100%25'%20fill='%234f8cff'/%3E%3Ctext%20x='50%25'%20y='50%25'%20fill='white'%20font-size='28'%20text-anchor='middle'%20dominant-baseline='middle'%3Etap%20me%20offline%3C/text%3E%3C/svg%3E)

---

*以上内容用于开发环境排版样式对照*
`
