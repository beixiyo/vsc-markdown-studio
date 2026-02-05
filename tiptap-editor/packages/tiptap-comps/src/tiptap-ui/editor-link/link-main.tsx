'use client'

import type { FC, KeyboardEvent, RefObject } from 'react'

import { Button, Input } from 'comps'
import { useTiptapEditorT } from 'tiptap-api/react'
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
  const t = useTiptapEditorT()

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      setLink()
    }
  }

  return (
    <div
      className="min-w-max shadow-card border-none rounded-xl"
      { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
    >
      <div className="flex flex-row items-center gap-1 p-1.5">
        <Input
          ref={ inputRef }
          type="url"
          placeholder={ t('link.placeholder') }
          value={ url }
          onChange={ setUrl }
          onKeyDown={ handleKeyDown }
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          containerClassName="min-w-40 h-8 max-w-80 rounded-lg"
          size="sm"
        />

        <div className="flex items-center">
          <Button
            type="button"
            onClick={ setLink }
            tooltip={ t('link.apply') }
            disabled={ !url && !isActive }
            variant="ghost"
            size="sm"
          >
            <CornerDownLeftIcon className={ TIPTAP_UI_STYLES.icon } />
          </Button>

          <Button
            type="button"
            onClick={ openLink }
            tooltip={ t('link.open') }
            disabled={ !url && !isActive }
            variant="ghost"
            size="sm"
          >
            <ExternalLinkIcon className={ TIPTAP_UI_STYLES.icon } />
          </Button>

          <Button
            type="button"
            onClick={ removeLink }
            tooltip={ t('link.remove') }
            disabled={ !url && !isActive }
            variant="ghost"
            size="sm"
          >
            <TrashIcon className={ TIPTAP_UI_STYLES.icon } />
          </Button>
        </div>
      </div>
    </div>
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
