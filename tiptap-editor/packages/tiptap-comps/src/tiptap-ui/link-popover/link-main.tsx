'use client'

import type { FC, KeyboardEvent, RefObject } from 'react'

import { Button, Card, Input } from 'comps'

import { useIsBreakpoint } from 'tiptap-api/react'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import {
  CornerDownLeftIcon,
  ExternalLinkIcon,
  TrashIcon,
} from '../../icons'
import { TIPTAP_UI_STYLES } from '../constants'

export const LinkMain: FC<LinkMainProps> = ({
  url,
  setUrl,
  setLink,
  removeLink,
  openLink,
  isActive,
  inputRef,
}) => {
  const isMobile = useIsBreakpoint()

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      setLink()
    }
  }

  return (
    <Card
      padding="none"
      bordered={ !isMobile }
      shadow={
        isMobile
          ? 'none'
          : 'md'
      }
      className="min-w-max"
      { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
    >
      <div className="flex flex-row items-center gap-1 p-1">
        <Input
          ref={ inputRef }
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
            <CornerDownLeftIcon className={ TIPTAP_UI_STYLES.icon } />
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
            <ExternalLinkIcon className={ TIPTAP_UI_STYLES.icon } />
          </Button>

          <Button
            type="button"
            onClick={ removeLink }
            tooltip="Remove link"
            disabled={ !url && !isActive }
            variant="ghost"
            size="sm"
          >
            <TrashIcon className={ TIPTAP_UI_STYLES.icon } />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export interface LinkMainProps {
  /** 链接的 URL */
  url: string
  /** 更新 URL 状态 */
  setUrl: (url: string) => void
  /** 在编辑器中设置链接 */
  setLink: () => void
  /** 从编辑器中移除链接 */
  removeLink: () => void
  /** 打开链接 */
  openLink: () => void
  /** 当前选区是否命中链接 */
  isActive: boolean
  inputRef?: RefObject<HTMLInputElement | null>
}
