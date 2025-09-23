import type { BlockNoteEditor } from '@blocknote/core'
import type { CallbackManager } from './types'
import type { useNotify } from '../useNotify'

/**
 * 创建鼠标移动事件处理器
 */
export function createMouseMoveHandler(editor: BlockNoteEditor<any, any, any>, callbackManager: CallbackManager) {
  let lastHoveredBlockId: string | null = null

  return (event: MouseEvent) => {
    const blockElement = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-id]')

    if (blockElement) {
      const blockId = blockElement.getAttribute('data-id')

      /** 只有当悬浮的块发生变化时才触发回调 */
      if (blockId !== lastHoveredBlockId) {
        lastHoveredBlockId = blockId
        const block = editor.document.find(block => block.id === blockId) || null
        callbackManager.onBlockHoverCallbacks.forEach(callback => callback(block))
      }
    }
    else if (lastHoveredBlockId !== null) {
      /** 鼠标移出编辑器区域 */
      lastHoveredBlockId = null
      callbackManager.onBlockHoverCallbacks.forEach(callback => callback(null))
    }
  }
}

/**
 * 创建编辑器变更事件处理器
 */
export function createEditorChangeHandler(callbackManager: CallbackManager, notifyFns: ReturnType<typeof useNotify>) {
  return (editor: any) => {
    notifyFns.notifyContentChanged()
    notifyFns.notifyBlockTypeChanged()
    callbackManager.onChangeCallbacks.forEach(callback => callback(editor))
  }
}

/**
 * 创建选择变更事件处理器
 */
export function createSelectionChangeHandler(callbackManager: CallbackManager) {
  return (editor: any) => {
    callbackManager.onSelectionChangeCallbacks.forEach(callback => callback(editor))
  }
}
