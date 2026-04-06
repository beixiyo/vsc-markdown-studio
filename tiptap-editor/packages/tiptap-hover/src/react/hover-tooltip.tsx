'use client'

import { FloatingPortal } from '@floating-ui/react'
import { memo } from 'react'
import { cn } from 'utils'

import type { HoverTooltipProps } from './types'
import { useHoverTooltip } from './use-hover-tooltip'

export const HoverTooltip = memo((props: HoverTooltipProps) => {
  const {
    className,
    style,
    enabled = true,
    content,
    mousePosition,
    formatContent,
    offsetDistance = 8,
    placement = 'top-start',
    showArrow = true,
    maxWidth = 300,
    ...htmlRest
  } = props

  const {
    arrowRef,
    arrowStyle,
    displayContent,
    floatingStyles,
    refs,
    shouldShow,
  } = useHoverTooltip({
    content,
    enabled,
    formatContent,
    maxWidth,
    mousePosition,
    offsetDistance,
    placement,
    showArrow,
  })

  if (!shouldShow)
    return null

  return (
    <FloatingPortal>
      <div
        { ...htmlRest }
        ref={ refs.setFloating }
        className={ cn(
          'pointer-events-none fixed z-50 rounded border border-border bg-background2 px-3 py-2 text-xs leading-tight text-text shadow-md wrap-break-word',
          className,
        ) }
        style={ { ...floatingStyles, ...style } }
      >
        {displayContent}
        {showArrow && (
          <div
            ref={ arrowRef }
            className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-border bg-background2"
            style={ {
              ...arrowStyle,
              clipPath: 'polygon(0% 0%, 100% 100%, 0% 100%)',
            } }
          />
        )}
      </div>
    </FloatingPortal>
  )
})

HoverTooltip.displayName = 'HoverTooltip'
