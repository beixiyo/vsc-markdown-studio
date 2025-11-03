/**
 * 文件作用：提供与文档结构相关的纯函数工具（文本提取、上级标题查找、按标题分组）
 * 一句话概括：围绕 BlockNote 文档的结构化分析算法集合（不依赖 DOM 与业务状态）
 */
import type { BlockNoteEditor } from '@blocknote/core'
import type { AnyBlock, DocSection, ParentHeadingInfo } from './types'

/**
 * 提取块中的纯文本内容
 * @param blocks 单个块或块数组
 * @returns 该块（或多块）拼接后的纯文本
 */
export function extractBlockText(blocks: AnyBlock | AnyBlock[]): string {
  try {
    const blockArray = Array.isArray(blocks)
      ? blocks
      : [blocks]

    if (blockArray.length === 0)
      return ''

    const getOne = (block: AnyBlock) => {
      if (!block || typeof block !== 'object')
        return ''

      const content = (block as any).content || [{ type: 'text', text: '' }]
      if (!Array.isArray(content))
        return ''

      return content
        .map((item: any) => {
          if (item && item.type === 'text')
            return item.text || ''
          return ''
        })
        .join('')
        .trim()
    }

    return blockArray.map(getOne).join('\n')
  }
  catch {
    return ''
  }
}

/**
 * 获取指定块的上级标题信息
 * @param editor BlockNote 编辑器实例
 * @param blockId 目标块 ID
 * @returns 上级标题信息，如果不存在则返回 null
 */
export function getParentHeading(editor: BlockNoteEditor, blockId: string): ParentHeadingInfo | null {
  try {
    const docs = editor.document
    const currentBlockIndex = docs.findIndex(block => block.id === blockId)
    if (currentBlockIndex === -1)
      return null

    for (let i = currentBlockIndex - 1; i >= 0; i--) {
      const block = docs[i] as AnyBlock
      if ((block as any).type === 'heading') {
        return {
          block,
          level: (block as any).props?.level || 1,
          text: extractBlockText(block),
          index: i,
        }
      }
    }
    return null
  }
  catch {
    return null
  }
}

/**
 * 以最近的上级标题为边界，对文档进行分组
 * @param editor BlockNote 编辑器实例
 * @param blockId 参考块 ID
 * @returns 分组结果（包含 heading 与其后的连续内容块区间）
 */
export function groupBlockByHeading(
  editor: BlockNoteEditor<any, any, any>,
  blockId: string,
): DocSection {
  const res: DocSection = {
    blocks: [],
    heading: null,
    startBlock: null,
    endBlock: null,
  }

  try {
    const docs = editor.document as AnyBlock[]
    const heading = getParentHeading(editor, blockId)
    if (!heading)
      return res

    res.heading = heading.block as AnyBlock
    const headingLevel = heading.level
    const startIndex = heading.index + 1

    for (let i = startIndex; i < docs.length; i++) {
      const block = docs[i]
      if ((block as any).type === 'heading') {
        const blockLevel = (block as any).props?.level || 1
        if (blockLevel <= headingLevel)
          break
      }
      res.blocks.push(block)
    }
  }
  catch {
    /** 忽略错误，返回空结构 */
  }

  if (res.heading) {
    res.startBlock = res.heading
    res.endBlock = res.blocks.length > 0
      ? res.blocks[res.blocks.length - 1]
      : res.heading
  }
  else if (res.blocks.length > 0) {
    res.startBlock = res.blocks[0]
    res.endBlock = res.blocks[res.blocks.length - 1]
  }

  return res
}
