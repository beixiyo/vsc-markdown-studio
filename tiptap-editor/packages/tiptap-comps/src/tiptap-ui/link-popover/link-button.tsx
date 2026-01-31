'use client'

import { Button } from 'comps'
import { forwardRef } from 'react'
import { LinkIcon } from '../../icons'

export const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        type="button"
        className={ className }
        variant="ghost"
        size="sm"
        role="button"
        tabIndex={ -1 }
        aria-label="Link"
        tooltip="Link"
        ref={ ref }
        { ...props }
      >
        { children || <LinkIcon className="size-4" /> }
      </Button>
    )
  },
)

LinkButton.displayName = 'LinkButton'

type LinkButtonProps = any
