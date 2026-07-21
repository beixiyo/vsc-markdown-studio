import type { MarkdownDiffColors } from 'tiptap-diff-view/react'
import { memo, useState } from 'react'
import { MarkdownDiff } from 'tiptap-diff-view/react'

const REPEATED_SECTION = `## 可复用章节

这是一段重复正文，用来构造足够长的 Markdown 文档并观察滚动体验。内容本身保持一致，只有分散在文档各处的少量段落发生变化。

- 第一条公共内容
- 第二条公共内容
- 第三条公共内容

> 未修改的引用内容用于验证长距离滚动时的上下文定位。

`

const INITIAL_BEFORE = `# Markdown Diff 长文档

${REPEATED_SECTION.repeat(8)}

## 第一处变化

旧版本在这里使用简短说明，并准备删除一条内容。

- 保留的列表项
- 即将删除的列表项

${REPEATED_SECTION.repeat(8)}

## 第二处变化

\`\`\`ts
const mode = 'before'
\`\`\`

${REPEATED_SECTION.repeat(8)}

## 文档结尾

旧版本结尾。
`

const INITIAL_AFTER = `# Markdown Diff 长文档

${REPEATED_SECTION.repeat(8)}

## 第一处变化

新版本在这里使用更完整的说明，包含字符级变化。

- 保留的列表项
- 新增的列表项

${REPEATED_SECTION.repeat(8)}

## 第二处变化

\`\`\`ts
const mode = 'after'
const enabled = true
\`\`\`

${REPEATED_SECTION.repeat(8)}

## 文档结尾

新版本结尾，并增加补充说明。
`

/** tiptap-diff-view 的长文档演示入口 */
export const MarkdownDiffPlayground = memo<MarkdownDiffPlaygroundProps>((props) => {
  const [before, setBefore] = useState(INITIAL_BEFORE)
  const [after, setAfter] = useState(INITIAL_AFTER)

  return (
    <MarkdownDiff
      { ...props }
      before={ before }
      after={ after }
      onBeforeChange={ setBefore }
      onAfterChange={ setAfter }
    />
  )
})

MarkdownDiffPlayground.displayName = 'MarkdownDiffPlayground'

export type MarkdownDiffPlaygroundProps = {
  /** 双栏 Diff 的最小容器宽度 */
  splitViewMinWidth?: number
  /** Diff 浅色和深色主题配置 */
  colors?: MarkdownDiffColors
}
