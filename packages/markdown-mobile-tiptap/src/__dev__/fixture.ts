/**
 * 真实 Native 下发数据样本，仅用于开发环境肉眼验证
 * 与 `MDBridge.setContentWithSpeakers` 入参结构一致
 */
export const devFixture = {
  speakers: [
    { name: '张明', label: 0, originalLabel: 0 },
    { name: '李芳', label: 1, originalLabel: 1 },
  ],
  content: `# 一级标题 Heading 1

## 二级标题 Heading 2

### 三级标题 Heading 3

#### 四级标题 Heading 4

##### 五级标题 Heading 5

###### 六级标题 Heading 6

---

## 正文段落

这是一段普通的正文内容，用于测试基础段落的字体大小和行高。移动端 Webview 的文字大小应当舒适易读，不能太小也不能太大。好的排版让用户在长时间阅读时不会感到疲劳。

这是第二段。段落之间应有合理的间距。English text mixed with 中文内容，测试中英文混排时的字体表现。The quick brown fox jumps over the lazy dog. 1234567890.

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
2. 第二步：点击录音按钮
3. 第三步：开始说话
   1. 注意保持安静的环境
   2. 距离麦克风 20-30cm
4. 第四步：点击停止

### 任务列表

- [ ] 完成移动端适配
- [ ] 字体大小调整，需要对比旧版 markdown-mobile 的排版规范，确保段落、标题、代码块的字体大小一致
- [x] 基础组件搭建
- [x] 编辑器集成，包括 Tiptap 核心、Speaker 节点、Image 节点、代码块高亮等扩展的配置和调试
- [ ] 性能优化

## 引用

> 这是一段引用文本。好的设计是尽可能少的设计。—— Dieter Rams

> 多层引用测试：
>
> 第二行引用内容，包含 **加粗** 和 *斜体*。
>
> 还有 \`代码\` 也在引用里。

## 代码

行内代码：\`const x: number = 42\` 和 \`npm install\`。

代码块：

\`\`\`typescript
interface Speaker {
  name: string
  label: number
  originalLabel: number
}

function formatSpeaker(speaker: Speaker): string {
  return \`[\${speaker.name}] (Label: \${speaker.label})\`
}

const speakers: Speaker[] = [
  { name: '张明', label: 0, originalLabel: 0 },
  { name: '李芳', label: 1, originalLabel: 1 },
]

speakers.forEach(s => console.log(formatSpeaker(s)))
\`\`\`

\`\`\`css
.markdown-body {
  font-size: 16px;
  line-height: 1.75;
  color: var(--text-primary);
}
\`\`\`

## 表格

| 属性 | 旧版 (markdown-mobile) | 新版 (tiptap) | 差值 |
|------|----------------------|--------------|------|
| 段落 p | 16.5px | 14px | -2.5px |
| H1 | 18px | 17px | -1px |
| H2 | 18px | 16px | -2px |
| H3 | 17px | 16px | -1px |
| 代码 | 12px | 12px | 不变 |

## 图片

![示例图片](https://picsum.photos/seed/fixture/600/300)

## 说话人标记

[speaker:0]大家好，今天的会议主要讨论三个议题。首先是移动端 Webview 的字体大小问题，用户反馈目前的文字太小了，需要调整。

[speaker:1]我也注意到了这个问题。之前用旧版 markdown-mobile 的时候，段落文字是 16.5px，现在换成 tiptap 之后变成了 14px，确实小了不少。

[speaker:0]对，我们需要把字体大小恢复到旧版的水平。另外标题的层级感也需要加强，现在 H1 到 H3 的区分度不够。

[speaker:1]好的，我来跟进这个问题。除了字体大小，字体族也换了，从 Agave 换成了 DM Sans，这个也会影响视觉感受。

## 混合内容

以下是一段包含多种元素的真实场景内容：

[speaker:0]我来分享一下技术方案。核心改动点如下：

1. **字体大小调整**：将段落从 \`14px\` 恢复到 \`16.5px\`
2. **标题层级**：
   - H1: \`18px\` + 加粗
   - H2: \`18px\`
   - H3: \`17px\`
3. **代码块**保持 \`12px\` 不变

> 注意：修改样式时要确保不影响桌面端的渲染效果

具体代码改动参考：

\`\`\`scss
.tiptap.ProseMirror {
  p {
    font-size: 16.5px;
  }
  h1 { font-size: 18px; }
  h2 { font-size: 18px; }
  h3 { font-size: 17px; }
}
\`\`\`

[speaker:1]收到，我还有一个问题——\`line-height\` 需要调整吗？

[speaker:0]暂时保持 \`1.75\` 不变，先看看字体调大后的整体效果。

---

*以上内容用于开发环境排版样式对照*
`,
}
