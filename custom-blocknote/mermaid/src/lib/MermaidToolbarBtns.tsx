import type { MermaidBlock, MermaidBlockNoteEditor } from './types'
import { useBlockNoteEditor, useComponentsContext, useSelectedBlocks } from '@blocknote/react'
import { ClipboardCopy, Edit3, Trash2 } from 'lucide-react'
import { memo, useCallback, useMemo } from 'react'
import { mermaidEvents } from './constants'

/**
 * Mermaid 编辑按钮
 */
export const MermaidEditButton = memo(() => {
  const Components = useComponentsContext()!
  const editor = useBlockNoteEditor() as MermaidBlockNoteEditor
  const selectedBlocks = useSelectedBlocks(editor) as unknown as MermaidBlock[]

  const mermaidBlock = useMemo<undefined | MermaidBlock>(() => {
    if (selectedBlocks.length !== 1)
      return undefined

    const block = selectedBlocks[0]
    return block.type === 'mermaid'
      ? block
      : undefined
  }, [selectedBlocks])

  const onClick = useCallback(() => {
    if (!mermaidBlock)
      return

    editor.focus()
    /** 通过事件系统通知 MermaidRenderer 进入编辑模式 */
    mermaidEvents.emit('change', {
      id: mermaidBlock.id,
      mode: 'edit',
    })
  }, [editor, mermaidBlock])

  if (!mermaidBlock || !editor.isEditable) {
    return null
  }

  return (
    <Components.FormattingToolbar.Button
      className="bn-button"
      label="编辑 Mermaid 代码"
      mainTooltip="编辑 Mermaid 代码"
      secondaryTooltip="点击打开代码编辑器"
      icon={ <Edit3 size={ 18 } /> }
      onClick={ onClick }
    />
  )
})

MermaidEditButton.displayName = 'MermaidEditButton'

/**
 * Mermaid 复制代码按钮
 */
export const MermaidCopyButton = memo(() => {
  const Components = useComponentsContext()!
  const editor = useBlockNoteEditor() as MermaidBlockNoteEditor
  const selectedBlocks = useSelectedBlocks(editor) as unknown as MermaidBlock[]

  const mermaidBlock = useMemo<undefined | MermaidBlock>(() => {
    if (selectedBlocks.length !== 1)
      return undefined
    const block = selectedBlocks[0]
    return block.type === 'mermaid'
      ? block
      : undefined
  }, [selectedBlocks])

  const onClick = useCallback(async () => {
    if (!mermaidBlock?.props?.diagram)
      return

    try {
      await navigator.clipboard.writeText(mermaidBlock.props.diagram)
      /** 这里可以添加成功提示 */
    }
    catch (error) {
      console.error('复制失败:', error)
    }

    editor.focus()
  }, [editor, mermaidBlock])

  if (!mermaidBlock || !editor.isEditable) {
    return null
  }

  return (
    <Components.FormattingToolbar.Button
      className="bn-button"
      label="复制 Mermaid 代码"
      mainTooltip="复制 Mermaid 代码"
      secondaryTooltip="将源代码复制到剪贴板"
      icon={ <ClipboardCopy size={ 18 } /> }
      onClick={ onClick }
    />
  )
})

MermaidCopyButton.displayName = 'MermaidCopyButton'

/**
 * Mermaid 删除按钮
 */
export const MermaidDeleteButton = memo(() => {
  const Components = useComponentsContext()!
  const editor = useBlockNoteEditor() as MermaidBlockNoteEditor
  const selectedBlocks = useSelectedBlocks(editor) as unknown as MermaidBlock[]

  const mermaidBlock = useMemo<undefined | MermaidBlock>(() => {
    if (selectedBlocks.length !== 1)
      return undefined
    const block = selectedBlocks[0]
    return block.type === 'mermaid'
      ? block
      : undefined
  }, [selectedBlocks])

  const onClick = useCallback(() => {
    if (!mermaidBlock)
      return
    editor.focus()
    editor.removeBlocks([mermaidBlock])
  }, [editor, mermaidBlock])

  if (!mermaidBlock || !editor.isEditable) {
    return null
  }

  return (
    <Components.FormattingToolbar.Button
      className="bn-button"
      label="删除 Mermaid 图表"
      mainTooltip="删除图表"
      secondaryTooltip="删除当前 Mermaid 图表块"
      icon={ <Trash2 size={ 18 } /> }
      onClick={ onClick }
    />
  )
})

MermaidDeleteButton.displayName = 'MermaidDeleteButton'
