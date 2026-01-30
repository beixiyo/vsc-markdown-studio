'use client'

import type { Editor } from '@tiptap/react'
import type { FC } from 'react'

import { LinkMain } from './link-main'
import { useLinkPopover } from './use-link-popover'

export const LinkContent: FC<LinkContentProps> = ({ editor }) => {
  const linkPopover = useLinkPopover({
    editor,
  })

  return <LinkMain { ...linkPopover } />
}

export interface LinkContentProps {
  /** 编辑器实例 */
  editor?: Editor | null
}
