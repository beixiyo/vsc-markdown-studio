import type { BlockNoteEditor } from '@blocknote/core'
import { useEffect } from 'react'
import { notifyNative } from './notify'

export function useNotify(
  editor: BlockNoteEditor<any, any, any> | null,
  editorElRef: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!editor || !editorElRef.current) {
      return
    }

    notifyNative('milkdownReady')

    const ob = new ResizeObserver(() => {
      notifyNative('heightChanged', editorElRef.current?.clientHeight ?? 0)
    })
    ob.observe(editorElRef.current)

    return () => {
      ob.disconnect()
    }
  }, [editor, editorElRef])

  // ======================
  // * Fns
  // ======================
  const notifyBlockTypeChanged = () => {
    if (!editor)
      return

    const currentCursorPosition = editor.getTextCursorPosition()
    const block = currentCursorPosition.block
    const type = block.type
    let typeString = ''
    if (type === 'heading') {
      const level = block.props.level
      typeString = `h${level}`
    }
    else {
      if (type === 'bulletListItem') {
        typeString = 'unordered_list'
      }
      else if (type === 'numberedListItem') {
        typeString = 'ordered_list'
      }
      else if (type === 'checkListItem') {
        typeString = 'check_list'
      }
      else {
        typeString = type
      }
    }

    notifyNative('blockTypeChanged', typeString)
  }

  const notifyContentChanged = () => {
    if (!editor)
      return

    notifyNative('contentChanged', editor.blocksToMarkdownLossy())
  }

  const notifyLabelClicked = (data: { blockId: string, label: string }) => {
    notifyNative('labelClicked', data)
  }

  return {
    notifyBlockTypeChanged,
    notifyContentChanged,
    notifyLabelClicked,
  }
}
