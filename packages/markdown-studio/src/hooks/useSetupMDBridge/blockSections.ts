import type { BlockNoteEditor } from '@blocknote/core'
import type { DocumentSection } from '@/types/BlocknoteExt'
import { getParentHeading } from './blockOperations'

/**
 * 根据块和最后一个块，将块分组，如果块是标题，则将块分组
 */
export function groupBlockByHeading(
  editor: BlockNoteEditor<any, any, any>,
  blockId: string,
): DocumentSection {
  const res: DocumentSection = {
    blocks: [],
    heading: null,
    startBlock: null,
    endBlock: null,
  }

  try {
    const docs = editor.document

    /** 获取上级标题 */
    const heading = getParentHeading(editor, blockId)
    if (!heading) {
      return res
    }

    if (heading) {
      res.heading = heading.block

      /** 从标题块的下一个块开始，收集到下一个同级或更高级标题之前的所有块 */
      const headingLevel = heading.level
      const startIndex = heading.index + 1

      for (let i = startIndex; i < docs.length; i++) {
        const block = docs[i]

        /** 如果遇到同级或更高级的标题，停止收集 */
        if (block.type === 'heading') {
          const blockLevel = block.props?.level || 1
          if (blockLevel <= headingLevel) {
            break
          }
        }

        res.blocks.push(block)
      }
    }
    else {
      /** 如果没有上级标题，从文档开头收集到第一个标题之前的所有块 */
      for (let i = 0; i < docs.length; i++) {
        const block = docs[i]

        if (block.type === 'heading') {
          break
        }

        res.blocks.push(block)
      }
    }
  }
  catch (error) {
    console.warn('分组块失败:', error)
  }

  if (res.heading) {
    res.startBlock = res.heading
    if (res.blocks.length > 0) {
      res.endBlock = res.blocks[res.blocks.length - 1]
    }
    else {
      res.endBlock = res.heading
    }
  }
  else if (res.blocks.length > 0) {
    res.startBlock = res.blocks[0]
    res.endBlock = res.blocks[res.blocks.length - 1]
  }

  return res
}
