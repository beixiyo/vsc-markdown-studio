'use client'

import { Button } from 'comps'
import { forwardRef } from 'react'
import { useTiptapEditorT } from 'tiptap-api/react'
import { LinkIcon } from '../../icons'
import { TIPTAP_UI_STYLES } from '../constants'

export const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(
  ({ className, children, ...props }, ref) => {
    const t = useTiptapEditorT()

    return (
      <Button
        type="button"
        className={ className }
        variant="ghost"
        size="sm"
        role="button"
        tabIndex={ -1 }
        aria-label={ t('link.link') }
        tooltip={ t('link.link') }
        ref={ ref }
        { ...props }
      >
        { children || <LinkIcon className={ TIPTAP_UI_STYLES.icon } /> }
      </Button>
    )
  },
)

LinkButton.displayName = 'LinkButton'

export type LinkButtonProps = any
