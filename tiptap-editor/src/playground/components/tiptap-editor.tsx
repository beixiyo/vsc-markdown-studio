'use client'

import type { EditorContentProps } from '../types'
import { EditorContent, EditorContext } from '@tiptap/react'

import { memo, useEffect } from 'react'
import { useDefaultEditor } from '../hooks/use-default-editor'

export const TiptapEditor = memo<EditorContentProps>(({
  data,
  speakerMap,
  onSpeakerClick,
  children,
  className,
  style,
  onUpdate,
  ref,
}) => {
  const contentType = typeof data === 'string'
    ? 'markdown'
    : 'json'
  const editor = useDefaultEditor({
    speakerMap,
    onSpeakerClick,
    /** 编辑器初始内容（从 JSON 文件导入或 Markdown 字符串） */
    content: data || '',
    /** 明确告诉 Tiptap 当前内容类型，Markdown 字符串会被正确解析 */
    contentType,
    /** 监听编辑器内容更新 */
    onUpdate,
  })

  useEffect(() => {
    if (!editor || !data) {
      return
    }
    editor.commands.setContent(
      data,
      { contentType },
    )
  }, [editor, data, contentType])

  useEffect(() => {
    if (ref) {
      ref.current = editor
    }
  }, [editor, ref])

  return (
    <EditorContext value={ { editor } }>
      { children }
      <EditorContent
        editor={ editor }
        role="presentation"
        className={ className }
        style={ style }
      />
    </EditorContext>
  )
})

TiptapEditor.displayName = 'EditorContentComponent'
