import type { BlockNoteEditor } from '@blocknote/core'

/**
 * 获取 Markdown 格式内容，并处理连续的空段落块
 * 确保多个连续的空段落块在 markdown 中保留多个空行
 * @param editor BlockNote 编辑器实例
 * @returns 处理后的 Markdown 字符串
 */
export function getMarkdownWithEmptyLines(editor: BlockNoteEditor<any, any, any>) {
  const blocks = editor.document
  const markdownLines: string[] = []

  // 判断块是否为空段落块
  const isEmptyParagraph = (block: any): boolean => {
    if (block.type !== 'paragraph') return false
    if (!block.content || block.content.length === 0) return true
    return block.content.every((item: any) => {
      if (item.type === 'text') {
        return !item.text || item.text.trim() === ''
      }
      return false
    })
  }

  // 遍历 blocks，直接从 blocks 构建 markdown
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    if (isEmptyParagraph(block)) {
      // 空段落块：直接添加空行
      markdownLines.push('')
    }
    else {
      // 非空块：获取该块的 markdown
      const blockMarkdown = editor.blocksToMarkdownLossy([block])
      // 移除末尾的换行符（如果有），因为我们会统一处理换行
      const trimmedMarkdown = blockMarkdown.replace(/\n$/, '')

      if (trimmedMarkdown) {
        // 如果块有内容，添加到结果中
        markdownLines.push(...trimmedMarkdown.split('\n'))
      }
    }
  }

  return markdownLines.join('\n')
}