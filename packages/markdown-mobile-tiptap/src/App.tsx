import { useEditor } from '@tiptap/react'
import { Image } from '@tiptap/extension-image'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { useRef } from 'react'
import { notifyNative } from 'notify'
import { TiptapEditor } from 'tiptap-editor-core'
import { SpeakerNode } from 'tiptap-nodes/speaker'
import { useSetupMDBridge } from './hooks/useSetupMDBridge'
import { useNotify } from './hooks/useNotify'
import { useTheme } from 'hooks'

const extensions = [
  StarterKit.configure({
    horizontalRule: false,
    link: {
      openOnClick: false,
      enableClickSelection: true,
    },
  }),
  Markdown.configure({
    indentation: { style: 'space', size: 2 },
    markedOptions: { gfm: true, breaks: true, pedantic: false },
  }),
  Image,
  TaskList,
  TaskItem.configure({ nested: true }),
  SpeakerNode.configure({
    className: 'font-semibold cursor-pointer',
    speakerMap: {},
    onClick: (attrs) => {
      notifyNative('speakerTapped', { ...attrs })
    },
  }),
  Placeholder.configure({
    placeholder: 'Start writing...',
    emptyEditorClass: 'is-editor-empty',
    emptyNodeClass: 'is-empty',
  }),
]

export default function App() {
  const [theme] = useTheme()
  const editorElRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions,
    content: '',
    editable: true,
    editorProps: {
      attributes: {
        'autocomplete': 'off',
        'autocorrect': 'off',
        'autocapitalize': 'off',
        'aria-label': 'Main content area',
        'class': 'markdown-body',
      },
    },
  })

  useSetupMDBridge(editor)
  useNotify(editor, editorElRef)

  return (
    <div ref={editorElRef} className={theme === 'dark' ? 'dark' : ''}>
      {editor
        ? (
            <TiptapEditor
              editor={editor}
              className="markdown-body min-h-full"
            />
            )
        : null}
    </div>
  )
}
