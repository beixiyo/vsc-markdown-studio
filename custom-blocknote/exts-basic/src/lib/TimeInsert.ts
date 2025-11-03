import { createBlockNoteExtension } from '@blocknote/core'

export const TimeInsert = createBlockNoteExtension({
  key: 'TimeInsert',
  keyboardShortcuts: {
    // Note: "Mod" is Ctrl on Windows/Linux and Cmd on Mac
    'Mod-Shift-D': ({ editor }) => {
      const now = new Date()
      const timestamp = now.toLocaleString()
      editor.insertInlineContent(timestamp)
      return true
    },
  },
})
