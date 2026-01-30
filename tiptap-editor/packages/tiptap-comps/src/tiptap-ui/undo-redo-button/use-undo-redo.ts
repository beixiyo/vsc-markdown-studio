import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useState } from 'react'
import { useHistoryLabels, useTiptapEditor } from 'tiptap-api/react'
import { isNodeTypeSelected } from 'tiptap-utils'
import { Redo2Icon, Undo2Icon } from '../../icons'

/** 撤销/重做快捷键映射 */
export const UNDO_REDO_SHORTCUT_KEYS: Record<UndoRedoAction, string> = {
  undo: 'mod+z',
  redo: 'mod+shift+z',
}

/**
 * 历史操作标签（已废弃，请使用 useHistoryLabels hook）
 * @deprecated 使用 useHistoryLabels hook 替代
 */
export const historyActionLabels: Record<UndoRedoAction, string> = {
  undo: 'Undo',
  redo: 'Redo',
}

/** 撤销/重做对应的图标组件 */
export const historyIcons = {
  undo: Undo2Icon,
  redo: Redo2Icon,
}

/** 判断当前是否可执行指定的历史操作（撤销或重做） */
export function canExecuteUndoRedoAction(
  editor: Editor | null,
  action: UndoRedoAction,
): boolean {
  if (!editor || !editor.isEditable)
    return false
  if (isNodeTypeSelected(editor, ['image']))
    return false

  return action === 'undo'
    ? editor.can().undo()
    : editor.can().redo()
}

/** 在编辑器中执行指定的历史操作（撤销或重做） */
export function executeUndoRedoAction(
  editor: Editor | null,
  action: UndoRedoAction,
): boolean {
  if (!editor || !editor.isEditable)
    return false
  if (!canExecuteUndoRedoAction(editor, action))
    return false

  const chain = editor.chain().focus()
  return action === 'undo'
    ? chain.undo().run()
    : chain.redo().run()
}

/** 根据配置判断历史按钮是否应显示 */
export function shouldShowButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
  action: UndoRedoAction
}): boolean {
  const { editor, hideWhenUnavailable, action } = props

  if (!editor || !editor.isEditable)
    return false

  if (hideWhenUnavailable && !editor.isActive('code')) {
    return canExecuteUndoRedoAction(editor, action)
  }

  return true
}

/**
 * 提供撤销/重做能力的 Hook，用于 Tiptap 编辑器
 *
 * @example
 * ```tsx
 * // 简单用法
 * function MySimpleUndoButton() {
 *   const { isVisible, handleAction } = useUndoRedo({ action: "undo" })
 *   if (!isVisible) return null
 *   return <button onClick={handleAction}>撤销</button>
 * }
 *
 * // 带配置的用法
 * function MyAdvancedRedoButton() {
 *   const { isVisible, handleAction, label } = useUndoRedo({
 *     editor: myEditor,
 *     action: "redo",
 *     hideWhenUnavailable: true,
 *     onExecuted: () => console.log('已执行')
 *   })
 *   if (!isVisible) return null
 *   return <MyButton onClick={handleAction} aria-label={label}>重做</MyButton>
 * }
 * ```
 */
export function useUndoRedo(config: UseUndoRedoConfig) {
  const {
    editor: providedEditor,
    action,
    hideWhenUnavailable = false,
    onExecuted,
  } = config

  const { editor } = useTiptapEditor(providedEditor)
  const historyLabels = useHistoryLabels()
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canExecute = canExecuteUndoRedoAction(editor, action)

  useEffect(() => {
    if (!editor)
      return

    const handleUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable, action }))
    }

    handleUpdate()

    editor.on('transaction', handleUpdate)

    return () => {
      editor.off('transaction', handleUpdate)
    }
  }, [editor, hideWhenUnavailable, action])

  const handleAction = useCallback(() => {
    if (!editor)
      return false

    const success = executeUndoRedoAction(editor, action)
    if (success) {
      onExecuted?.()
    }
    return success
  }, [editor, action, onExecuted])

  return {
    isVisible,
    handleAction,
    canExecute,
    label: historyLabels[action],
    shortcutKeys: UNDO_REDO_SHORTCUT_KEYS[action],
    Icon: historyIcons[action],
  }
}

/** 历史操作类型：撤销 | 重做 */
export type UndoRedoAction = 'undo' | 'redo'

/** useUndoRedo Hook 的配置项 */
export interface UseUndoRedoConfig {
  /** Tiptap 编辑器实例 */
  editor?: Editor | null
  /** 要执行的历史操作（撤销或重做） */
  action: UndoRedoAction
  /** 当操作不可用时是否隐藏按钮，默认 false */
  hideWhenUnavailable?: boolean
  /** 操作成功执行后的回调 */
  onExecuted?: () => void
}
