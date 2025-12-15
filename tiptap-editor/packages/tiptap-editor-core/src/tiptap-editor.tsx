'use client'

import type { EditorContentProps } from './types'
import { EditorContent, EditorContext } from '@tiptap/react'
import { memo } from 'react'

export const TiptapEditor = memo<EditorContentProps>(({
  editor,
  children,
  className,
  style,
  ref,
}) => {
  if (ref?.current) {
    ref.current = editor
  }

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

TiptapEditor.displayName = 'TiptapEditor'

