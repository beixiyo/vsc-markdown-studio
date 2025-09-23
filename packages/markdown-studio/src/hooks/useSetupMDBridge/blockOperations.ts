import type { BlockNoteEditor } from '@blocknote/core'

/**
 * 滚动到指定块
 */
export function scrollToBlock(editor: BlockNoteEditor<any, any, any>, blockId: string) {
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
export function getBlockAtPosition(editor: BlockNoteEditor<any, any, any>, x: number, y: number) {
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
export function getBlockFromElement(editor: BlockNoteEditor<any, any, any>, element: Element) {
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
