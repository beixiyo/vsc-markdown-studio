import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import { useRef } from 'react'
import { BlockNoteSchema } from '@blocknote/core'
import { GradientStyles } from 'custom-blocknote-gradient-styles'
import { createSpeaker } from 'custom-blocknote-speaker'
import { useSetupMDBridge } from './hooks/useSetupMDBridge'
import './styles/index.scss'
import { useTheme } from 'hooks'
import { notifyNative } from 'notify'
import { useNotifyChnage } from './hooks/useNotify'

export default function App() {
  const editor = useCreateBlockNote({
    schema: BlockNoteSchema.create().extend({
      inlineContentSpecs: {
        speaker: createSpeaker(speaker => {
          notifyNative('speakerTapped', speaker)
        }),
      },
      styleSpecs: {
        gradient: GradientStyles,
      },
    }),
  })

  const [theme] = useTheme()
  const editorElRef = useRef<HTMLDivElement>(null)

  useSetupMDBridge(editor)
  useNotifyChnage(editor, editorElRef)

  return (
    <div ref={ editorElRef }>
      <BlockNoteView
        className='markdown-body'
        theme={ theme }
        editor={ editor }
        formattingToolbar={ false }
        slashMenu={ false }
        sideMenu={ false }
        emojiPicker={ false }
      />
    </div>
  )
}
