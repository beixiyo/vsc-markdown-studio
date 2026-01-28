'use client'

import type { Editor } from '@tiptap/react'
import type { UseLinkPopoverConfig } from './use-link-popover'
import { Button, Card, Input, Popover, type PopoverRef } from 'comps'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'

import { forwardRef, useCallback, useEffect, useRef } from 'react'
import { useIsBreakpoint, useTiptapEditor } from 'tiptap-api/react'
import {
  CornerDownLeftIcon,
  ExternalLinkIcon,
  LinkIcon,
  TrashIcon,
} from '../../icons'

import { useLinkPopover } from './use-link-popover'

export interface LinkMainProps {
  /**
   * The URL to set for the link.
   */
  url: string
  /**
   * Function to update the URL state.
   */
  setUrl: (url: string) => void
  /**
   * Function to set the link in the editor.
   */
  setLink: () => void
  /**
   * Function to remove the link from the editor.
   */
  removeLink: () => void
  /**
   * Function to open the link.
   */
  openLink: () => void
  /**
   * Whether the link is currently active in the editor.
   */
  isActive: boolean
}

export interface LinkPopoverProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  UseLinkPopoverConfig {
  /**
   * Callback for when the popover opens or closes.
   */
  onOpenChange?: (isOpen: boolean) => void
  /**
   * Whether to automatically open the popover when a link is active.
   * @default true
   */
  autoOpenOnLinkActive?: boolean
}

/**
 * Link button component for triggering the link popover
 */
export const LinkButton = forwardRef<HTMLButtonElement, any>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        type="button"
        className={ className }
        variant="ghost"
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

/**
 * Main content component for the link popover
 */
const LinkMain: React.FC<LinkMainProps> = ({
  url,
  setUrl,
  setLink,
  removeLink,
  openLink,
  isActive,
}) => {
  const isMobile = useIsBreakpoint()

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      setLink()
    }
  }

  return (
    <Card
      padding="none"
      bordered={ !isMobile }
      shadow={ isMobile ? 'none' : 'md' }
      className="min-w-max"
      { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
    >
      <div className="flex flex-row items-center gap-1 p-1">
        <Input
          type="url"
          placeholder="Paste a link..."
          value={ url }
          onChange={ setUrl }
          onKeyDown={ handleKeyDown }
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          containerClassName="w-48 h-8"
          size="sm"
        />

        <div className="flex flex-row items-center">
          <Button
            type="button"
            onClick={ setLink }
            tooltip="Apply link"
            disabled={ !url && !isActive }
            variant="ghost"
            size="sm"
          >
            <CornerDownLeftIcon className="size-4" />
          </Button>
        </div>

        <div className="w-px h-4 bg-border/50 mx-1" />

        <div className="flex flex-row items-center gap-0.5">
          <Button
            type="button"
            onClick={ openLink }
            tooltip="Open in new window"
            disabled={ !url && !isActive }
            variant="ghost"
            size="sm"
          >
            <ExternalLinkIcon className="size-4" />
          </Button>

          <Button
            type="button"
            onClick={ removeLink }
            tooltip="Remove link"
            disabled={ !url && !isActive }
            variant="ghost"
            size="sm"
          >
            <TrashIcon className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

/**
 * Link content component for standalone use
 */
export const LinkContent: React.FC<{
  editor?: Editor | null
}> = ({ editor }) => {
  const linkPopover = useLinkPopover({
    editor,
  })

  return <LinkMain { ...linkPopover } />
}

/**
 * Link popover component for Tiptap editors.
 *
 * For custom popover implementations, use the `useLinkPopover` hook instead.
 */
export const LinkPopover = forwardRef<HTMLButtonElement, LinkPopoverProps>(
  (
    {
      editor: providedEditor,
      hideWhenUnavailable = false,
      onSetLink,
      onOpenChange,
      autoOpenOnLinkActive = true,
      onClick,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const popoverRef = useRef<PopoverRef>(null)

    const {
      isVisible,
      canSet,
      isActive,
      url,
      setUrl,
      setLink,
      removeLink,
      openLink,
      label,
      Icon,
    } = useLinkPopover({
      editor,
      hideWhenUnavailable,
      onSetLink,
    })

    const handleSetLink = useCallback(() => {
      setLink()
      popoverRef.current?.close()
    }, [setLink])

    useEffect(() => {
      if (autoOpenOnLinkActive && isActive) {
        popoverRef.current?.open()
      }
    }, [autoOpenOnLinkActive, isActive])

    if (!isVisible) {
      return null
    }

    return (
      <Popover
        ref={ popoverRef }
        contentClassName='p-0'
        trigger="click"
        onOpen={ () => onOpenChange?.(true) }
        onClose={ () => onOpenChange?.(false) }
        content={
          <LinkMain
            url={ url }
            setUrl={ setUrl }
            setLink={ handleSetLink }
            removeLink={ removeLink }
            openLink={ openLink }
            isActive={ isActive }
          />
        }
      >
        <LinkButton
          disabled={ !canSet }
          data-active-state={ isActive
            ? 'on'
            : 'off' }
          data-disabled={ !canSet }
          aria-label={ label }
          aria-pressed={ isActive }
          onClick={ onClick }
          { ...buttonProps }
          ref={ ref }
        >
          { children ?? <Icon className="size-4" /> }
        </LinkButton>
      </Popover>
    )
  },
)

LinkPopover.displayName = 'LinkPopover'

export default LinkPopover
