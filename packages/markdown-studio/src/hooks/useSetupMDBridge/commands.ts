import type { BlockNoteEditor } from '@blocknote/core'
import type { useNotify } from '../useNotify'

/**
 * 创建命令对象
 */
export function createCommands(editor: BlockNoteEditor<any, any, any>, notifyFns: ReturnType<typeof useNotify>) {
  return {
    setHeading: (level: 1 | 2 | 3) => {
      const currentBlock = editor.getTextCursorPosition().block
      if (currentBlock) {
        editor.updateBlock(currentBlock, { type: 'heading', props: { level } })
        notifyFns.notifyBlockTypeChanged()
      }
    },
    setParagraph: () => {
      const currentBlock = editor.getTextCursorPosition().block
      if (currentBlock) {
        editor.updateBlock(currentBlock, { type: 'paragraph' })
        notifyFns.notifyBlockTypeChanged()
      }
    },
    setOrderedList: () => {
      const currentBlock = editor.getTextCursorPosition().block
      if (currentBlock) {
        editor.updateBlock(currentBlock, { type: 'numberedListItem' })
        notifyFns.notifyBlockTypeChanged()
      }
    },
    setUnorderedList: () => {
      const currentBlock = editor.getTextCursorPosition().block
      if (currentBlock) {
        editor.updateBlock(currentBlock, { type: 'bulletListItem' })
        notifyFns.notifyBlockTypeChanged()
      }
    },
    setBold: () => {
      editor.toggleStyles({ bold: true })
      notifyFns.notifyBlockTypeChanged()
    },
    setItalic: () => {
      editor.toggleStyles({ italic: true })
      notifyFns.notifyBlockTypeChanged()
    },
    setCheckList: () => {
      const currentBlock = editor.getTextCursorPosition().block
      if (currentBlock) {
        editor.updateBlock(currentBlock, { type: 'checkListItem' })
        notifyFns.notifyBlockTypeChanged()
      }
    },
  }
}
