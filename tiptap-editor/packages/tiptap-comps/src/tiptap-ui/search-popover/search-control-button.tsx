'use client'

import type { SearchControlButtonProps } from './types'
import { memo } from 'react'

/** 面板右侧的上一个 / 下一个 / 关闭按钮，统一尺寸与禁用态 */
export const SearchControlButton = memo<SearchControlButtonProps>(({
  label,
  children,
  ...props
}) => (
  <button
    type="button"
    aria-label={ label }
    title={ label }
    className="flex size-6 items-center justify-center rounded-full text-text transition-colors hover:bg-background2 disabled:cursor-default disabled:opacity-30 [&>svg]:size-3.5"
    { ...props }
  >
    { children }
  </button>
))

SearchControlButton.displayName = 'SearchControlButton'
