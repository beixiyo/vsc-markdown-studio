/**
 * 文件作用：创建并返回编辑器与 DOM 的事件处理器，统一分发到 CallbackManager，并触发通知
 * 一句话概括：将鼠标/点击/编辑器变更事件节流与广播
 * 被谁使用：`useSetupMDBridge/index.ts` 注册这些事件处理器
 */
import type { BlockNoteEditor } from '@blocknote/core'
import type { CallbackManager } from './types'
import { throttle } from '@jl-org/tool'

/**
 * 创建鼠标移动事件处理器
 */
export function createMouseMoveHandler(editor: BlockNoteEditor, callbackManager: CallbackManager) {
  let lastHoveredBlockId: string | null = null

  const hanlderMouseMove = (event: MouseEvent) => {
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

  return throttle(hanlderMouseMove, 16, { makeSureNotToMissTask: true })
}

/**
 * 创建鼠标点击事件处理器
 */
export function createMouseClickHandler(editor: BlockNoteEditor, callbackManager: CallbackManager) {
  const handleMouseClick = (event: MouseEvent) => {
    const blockElement = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-id]')

    if (blockElement) {
      const blockId = blockElement.getAttribute('data-id')
      const block = editor.document.find(block => block.id === blockId) || null
      callbackManager.onBlockClickCallbacks.forEach(callback => callback(block))
    }
    else {
      /** 点击在编辑器区域外 */
      callbackManager.onBlockClickCallbacks.forEach(callback => callback(null))
    }
  }

  return handleMouseClick
}

/**
 * 创建编辑器变更事件处理器
 */
export function createEditorChangeHandler(callbackManager: CallbackManager) {
  return (editor: BlockNoteEditor) => {
    callbackManager.onChangeCallbacks.forEach(callback => callback(editor))
  }
}

/**
 * 创建选择变更事件处理器
 */
export function createSelectionChangeHandler(callbackManager: CallbackManager) {
  return (editor: BlockNoteEditor) => {
    callbackManager.onSelectionChangeCallbacks.forEach(callback => callback(editor))
  }
}
