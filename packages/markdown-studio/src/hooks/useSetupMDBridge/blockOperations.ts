import type { Block, BlockNoteEditor } from '@blocknote/core'

/**
 * 滚动到指定块
 */
export function scrollToBlock(editor: BlockNoteEditor, blockId: string) {
  try {
    editor.setTextCursorPosition(blockId, 'start')

    /** 确保编辑器获得焦点 */
    editor.focus()

    /** 查找目标块元素 - BlockNote 使用 ProseMirror 的 DOM 结构 */
    const blockElement = document.querySelector(`[data-id="${blockId}"]`)

    if (blockElement) {
      blockElement.scrollIntoView()
    }
  }
  catch (error) {
    console.warn('跳转到块失败:', error)
  }
}

/**
 * 获取鼠标位置对应的块
 */
export function getBlockAtPosition(editor: BlockNoteEditor, x: number, y: number) {
  try {
    const element = document.elementFromPoint(x, y)
    if (!element)
      return null

    const blockElement = element.closest('[data-id]')
    if (!blockElement)
      return null

    const blockId = blockElement.getAttribute('data-id')
    if (!blockId)
      return null

    return editor.document.find(block => block.id === blockId) || null
  }
  catch (error) {
    console.warn('获取鼠标位置块失败:', error)
    return null
  }
}

/**
 * 从 DOM 元素获取对应的块
 */
export function getBlockFromElement(editor: BlockNoteEditor, element: Element) {
  try {
    const blockElement = element.closest('[data-id]')
    if (!blockElement)
      return null

    const blockId = blockElement.getAttribute('data-id')
    if (!blockId)
      return null

    return editor.document.find(block => block.id === blockId) || null
  }
  catch (error) {
    console.warn('从元素获取块失败:', error)
    return null
  }
}

/**
 * 获取指定块的上级标题
 * @param editor BlockNote 编辑器实例
 * @param blockId 目标块 ID
 * @returns 上级标题块，如果没有找到则返回 null
 */
export function getParentHeading(editor: BlockNoteEditor, blockId: string) {
  try {
    const docs = editor.document
    const currentBlockIndex = docs.findIndex(block => block.id === blockId)

    if (currentBlockIndex === -1) {
      return null
    }

    /** 从当前块向前遍历，查找最近的标题块 */
    for (let i = currentBlockIndex - 1; i >= 0; i--) {
      const block = docs[i]

      /** 检查是否为标题块 (h1, h2, h3, h4, h5, h6) */
      if (block.type === 'heading') {
        return {
          block,
          level: block.props?.level || 1,
          text: extractBlockText(block),
          index: i,
        }
      }
    }

    return null
  }
  catch (error) {
    console.warn('获取上级标题失败:', error)
    return null
  }
}

/**
 * 获取块中的文本内容
 * @param block 块对象
 * @returns 文本内容
 */
export function extractBlockText(block: Block): string {
  try {
    /** 检查 block 是否存在 */
    if (!block || typeof block !== 'object') {
      return ''
    }

    /** 检查 content 属性是否存在且为数组 */
    if (!block.content || !Array.isArray(block.content)) {
      return ''
    }

    return block.content
      .map((item: any) => {
        if (item && item.type === 'text') {
          return item.text || ''
        }
        return ''
      })
      .join('')
      .trim()
  }
  catch (error) {
    console.warn('提取块文本失败:', error)
    return ''
  }
}
