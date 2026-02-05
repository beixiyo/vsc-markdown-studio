'use client'

import type { Editor } from '@tiptap/react'
import type { FC } from 'react'
import { useRef } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { EditorLinkPanel } from './editor-link-panel'
import { useLinkPopover } from './use-link-popover'

export const LinkContent: FC<LinkContentProps> = ({ editor: providedEditor }) => {
  const { editor } = useTiptapEditor(providedEditor)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    url,
    setUrl,
    setLink,
    removeLink,
    openLink,
    isActive,
  } = useLinkPopover({ editor })

  return (
    <EditorLinkPanel
      url={ url }
      setUrl={ setUrl }
      applyLink={ setLink }
      removeLink={ removeLink }
      openLink={ openLink }
      isActive={ isActive }
      inputRef={ inputRef }
    />
  )
}

export interface LinkContentProps {
  /** 编辑器实例 */
  editor?: Editor | null
}
