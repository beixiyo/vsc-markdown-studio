/**
 * Mermaid 编辑逻辑 Hook
 */
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseMermaidEditorOptions {
  code: string
  updateAttributes?: (attrs: { code: string }) => void
}

/**
 * Mermaid 编辑 Hook
 */
export function useMermaidEditor({
  code,
  updateAttributes,
}: UseMermaidEditorOptions) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /** 如果初始 code 为空，自动进入编辑模式 */
  const [isEditing, setIsEditing] = useState(() => !code)
  const [editCode, setEditCode] = useState('')

  /** 当进入编辑模式时，聚焦到 textarea */
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      /** 设置光标到末尾 */
      const length = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(length, length)
    }
  }, [isEditing])

  /** 进入编辑模式 */
  const handleEdit = useCallback(() => {
    setEditCode(code)
    setIsEditing(true)
  }, [code])

  /** 保存编辑 */
  const handleSave = useCallback(() => {
    if (updateAttributes) {
      updateAttributes({ code: editCode })
    }
    setIsEditing(false)
  }, [editCode, updateAttributes])

  /** 取消编辑 */
  const handleCancel = useCallback(() => {
    setEditCode('')
    setIsEditing(false)
  }, [])

  /** 处理键盘事件 */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    // Escape 取消
    else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }, [handleSave, handleCancel])

  return {
    isEditing,
    editCode,
    textareaRef,
    handleEdit,
    handleSave,
    handleCancel,
    handleKeyDown,
    setEditCode,
  }
}
