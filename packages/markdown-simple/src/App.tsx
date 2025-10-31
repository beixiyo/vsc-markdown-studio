import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'

import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import './blocknote.scss'
import 'styles/index.css'

export default function App() {
  const editor = useCreateBlockNote()

  return (
    <BlockNoteView
      editor={ editor }
      formattingToolbar={ false }
      slashMenu={ false }
      sideMenu={ false }
      emojiPicker={ false }
    />
  )
}
