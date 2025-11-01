import { useBlockNoteEditor, useComponentsContext } from '@blocknote/react'
import { getAIExtension } from 'custom-blocknote-ai'
import { Sparkles } from 'lucide-react'
import { memo, useCallback } from 'react'
import { useSnapshot } from 'valtio'

export const AIButton = memo(() => {
  const components = useComponentsContext()
  const editor = useBlockNoteEditor()

  const aiExtension = getAIExtension(editor)
  const snap = useSnapshot(aiExtension.state)

  const isBusy = snap.aiMenuState !== 'closed'

  const handleClick = useCallback(() => {
    if (isBusy || !editor.isEditable) {
      return
    }

    const selection = editor.getSelection()

    if (!selection || selection.blocks.length === 0) {
      return
    }

    const lastBlock = selection.blocks.at(-1)

    if (!lastBlock) {
      return
    }

    editor.formattingToolbar.closeMenu()
    aiExtension.openAIMenuAtBlock(lastBlock.id)
  }, [aiExtension, editor, isBusy])

  if (!components || !editor) {
    return null
  }

  if (!editor.isEditable || isBusy) {
    return null
  }

  return <components.Generic.Toolbar.Button
    className="bn-button"
    label="AI"
    mainTooltip="AI"
    icon={ <Sparkles className="h-3.5 w-3.5" /> }
    onClick={ handleClick }
  />
})

AIButton.displayName = 'AIButton'
