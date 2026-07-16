'use client'

import type { Editor } from '@tiptap/core'
import type { EditorContentProps } from './types'
import { EditorContent, EditorContext } from '@tiptap/react'
import { forwardRef, memo, useImperativeHandle } from 'react'

const InnerTiptapEditor = forwardRef<Editor | null, EditorContentProps>(({
  editor,
  children,
  className,
  style,
}, ref) => {
  useImperativeHandle(ref, () => editor as Editor, [editor])

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

export const TiptapEditor = memo(InnerTiptapEditor) as typeof InnerTiptapEditor

TiptapEditor.displayName = 'TiptapEditor'
