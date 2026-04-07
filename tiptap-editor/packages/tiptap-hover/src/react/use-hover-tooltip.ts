import type { CSSProperties, ReactNode, RefObject } from 'react'
import type { HoverTooltipProps } from './types'
import { type FloatingPlacement, useFloatingPosition } from 'hooks'
import { useMemo, useRef } from 'react'

export type UseHoverTooltipParams = Pick<
  HoverTooltipProps,
  | 'content'
  | 'enabled'
  | 'maxWidth'
  | 'mousePosition'
  | 'offsetDistance'
  | 'placement'
  | 'showArrow'
> & {
  formatContent?: (rawContent: unknown) => ReactNode
}

export type UseHoverTooltipResult = {
  displayContent: ReactNode
  floatingRef: RefObject<HTMLDivElement | null>
  floatingStyles: CSSProperties
  resolvedPlacement: FloatingPlacement
  shouldShow: boolean
}

export function useHoverTooltip(props: UseHoverTooltipParams): UseHoverTooltipResult {
  const {
    enabled = true,
    content,
    mousePosition,
    formatContent,
    offsetDistance = 8,
    placement = 'top-start',
    showArrow: _showArrow = true,
    maxWidth = 300,
  } = props

  const referenceRef = useRef<HTMLDivElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)

  const shouldShow = Boolean(content) && enabled && Boolean(mousePosition)

  const virtualReferenceRect = useMemo(() => {
    if (!mousePosition)
      return null
    return new DOMRect(mousePosition.x, mousePosition.y, 0, 0)
  }, [mousePosition])

  const { style, placement: resolvedPlacement } = useFloatingPosition(
    referenceRef,
    floatingRef,
    {
      enabled: shouldShow,
      placement,
      offset: offsetDistance,
      boundaryPadding: 8,
      flip: true,
      shift: true,
      autoUpdate: true,
      virtualReferenceRect,
    },
  )

  const displayContent = useMemo(() => {
    if (!content)
      return null
    if (formatContent)
      return formatContent(content)
    if (typeof content === 'string')
      return content
    return content
  }, [content, formatContent])

  const floatingStyles: CSSProperties = useMemo(() => ({
    ...style,
    maxWidth: typeof maxWidth === 'number'
      ? `${maxWidth}px`
      : maxWidth,
  }), [style, maxWidth])

  return {
    displayContent,
    floatingRef,
    floatingStyles,
    resolvedPlacement,
    shouldShow,
  }
}
