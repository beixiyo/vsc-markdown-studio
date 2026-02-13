'use client'

import type { TiptapCollabProvider } from '@hocuspocus/provider'
import type { Doc } from 'yjs'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import { Highlight } from '@tiptap/extension-highlight'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { CharacterCount } from '@tiptap/extensions'
import { EditorContent, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Button } from 'comps'
import { memo, useCallback, useEffect, useState } from 'react'
import { cn } from 'utils'

const colors = [
  '#958DF1',
  '#F98181',
  '#FBBC88',
  '#FAF594',
  '#70CFF8',
  '#AFC8AD',
  '#EEC759',
  '#FF90BC',
  '#FFC0D9',
  '#DC8686',
  '#7ED7C1',
  '#89B9AD',
  '#D0BFFF',
  '#9BABB8',
]

const names = [
  'Lea Thompson',
  'Cyndi Lauper',
  'Tom Cruise',
  'Madonna',
  'Jerry Hall',
  'Joan Collins',
  'Winona Ryder',
  'Christina Applegate',
  'Alyssa Milano',
  'Molly Ringwald',
]

const defaultContent = `
  <p>Hi 👋, this is a collaborative document.</p>
  <p>Feel free to edit and collaborate in real-time!</p>
`

const getRandomElement = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]

const getRandomColor = () => getRandomElement(colors)
const getRandomName = () => getRandomElement(names)

function getInitialUser() {
  return {
    name: getRandomName(),
    color: getRandomColor(),
  }
}

export type CollaborationEditorProps = {
  ydoc: Doc
  provider: TiptapCollabProvider
  room: string
}

export const CollaborationEditor = memo<CollaborationEditorProps>(({ ydoc, provider, room }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [currentUser, setCurrentUser] = useState(getInitialUser)

  const editor = useEditor({
    enableContentCheck: true,
    onContentError: ({ disableCollaboration }) => {
      disableCollaboration()
    },
    onCreate: ({ editor: currentEditor }) => {
      provider.on('synced', () => {
        if (currentEditor.isEmpty) {
          currentEditor.commands.setContent(defaultContent)
        }
      })
    },
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      Highlight,
      TaskList,
      TaskItem,
      CharacterCount.extend().configure({
        limit: 10000,
      }),
      Collaboration.extend().configure({
        document: ydoc,
      }),
      CollaborationCaret.extend().configure({
        provider,
      }),
    ],
  })

  useEffect(() => {
    /** 更新状态变化 */
    const statusHandler = (event: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      setStatus(event.status)
    }

    provider.on('status', statusHandler)

    return () => {
      provider.off('status', statusHandler)
    }
  }, [provider])

  /** 保存当前用户到 localStorage 并发送到编辑器 */
  useEffect(() => {
    if (editor && currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
      editor.chain().focus().updateUser(currentUser).run()
    }
  }, [editor, currentUser])

  const setName = useCallback(() => {
    const name = (window.prompt('Name', currentUser.name) || '').trim().substring(0, 32)

    if (name) {
      return setCurrentUser({ ...currentUser, name })
    }
  }, [currentUser])

  if (!editor) {
    return null
  }

  const userCount = (editor.storage as any).collaborationCaret?.users?.length || 0

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex gap-2 p-2 border-b border-border">
        <Button
          onClick={ () => editor.chain().focus().toggleBold().run() }
          data-active-state={ editor.isActive('bold')
            ? 'on'
            : 'off' }
          data-appearance="emphasized"
          className="px-3 py-1 text-sm"
        >
          Bold
        </Button>
        <Button
          onClick={ () => editor.chain().focus().toggleItalic().run() }
          data-active-state={ editor.isActive('italic')
            ? 'on'
            : 'off' }
          data-appearance="emphasized"
          className="px-3 py-1 text-sm"
        >
          Italic
        </Button>
        <Button
          onClick={ () => editor.chain().focus().toggleStrike().run() }
          data-active-state={ editor.isActive('strike')
            ? 'on'
            : 'off' }
          data-appearance="emphasized"
          className="px-3 py-1 text-sm"
        >
          Strike
        </Button>
        <Button
          onClick={ () => editor.chain().focus().toggleBulletList().run() }
          data-active-state={ editor.isActive('bulletList')
            ? 'on'
            : 'off' }
          data-appearance="emphasized"
          className="px-3 py-1 text-sm"
        >
          Bullet list
        </Button>
        <Button
          onClick={ () => editor.chain().focus().toggleCode().run() }
          data-active-state={ editor.isActive('code')
            ? 'on'
            : 'off' }
          data-appearance="emphasized"
          className="px-3 py-1 text-sm"
        >
          Code
        </Button>
      </div>

      <EditorContent editor={ editor } className="flex-1 p-4 overflow-auto" />

      <div
        className={ cn(
          'flex items-center justify-between gap-4 px-4 py-2 border-t border-border text-xs text-text2',
          'sticky bottom-0 bg-background z-100',
        ) }
      >
        <label className="flex items-center gap-2">
          <span
            className={ cn(
              'w-2 h-2 rounded-full',
              status === 'connected'
                ? 'bg-systemGreen'
                : 'bg-systemRed',
            ) }
          />
          {status === 'connected'
            ? `${userCount} user${userCount === 1
              ? ''
              : 's'} online in ${room}`
            : 'offline'}
        </label>
        <Button
          onClick={ setName }
          style={ { '--color': currentUser.color } as React.CSSProperties }
          className="px-2 py-1 text-xs relative overflow-hidden text-foreground hover:opacity-80 transition-opacity"
          tooltip={ false }
        >
          <span
            className="absolute inset-0 opacity-50 rounded"
            style={ { backgroundColor: currentUser.color } }
          />
          <span className="relative">
            ✎
            {currentUser.name}
          </span>
        </Button>
      </div>
    </div>
  )
})

CollaborationEditor.displayName = 'CollaborationEditor'
