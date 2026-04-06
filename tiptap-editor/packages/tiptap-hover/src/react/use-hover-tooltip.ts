import {
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  type UseFloatingReturn,
} from '@floating-ui/react'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import type { HoverTooltipProps } from './types'

export type UseHoverTooltipParams = Pick<
  HoverTooltipProps,
  | 'content'
  | 'enabled'
  | 'formatContent'
  | 'maxWidth'
  | 'mousePosition'
  | 'offsetDistance'
  | 'placement'
  | 'showArrow'
>

export type UseHoverTooltipResult = {
  arrowRef: RefObject<HTMLDivElement | null>
  arrowStyle: CSSProperties
  displayContent: ReactNode
  floatingStyles: CSSProperties
  refs: UseFloatingReturn['refs']
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
    showArrow = true,
    maxWidth = 300,
  } = props

  const arrowRef = useRef<HTMLDivElement>(null)

  const { refs, floatingStyles, middlewareData } = useFloating({
    placement,
    open: Boolean(content) && enabled,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetDistance),
      flip({
        crossAxis: placement.includes('-'),
        fallbackAxisSideDirection: 'start',
        padding: 8,
      }),
      shift({ padding: 8 }),
      ...(showArrow
        ? [arrow({ element: arrowRef })]
        : []),
    ],
  })

  useEffect(() => {
    if (!enabled || !mousePosition)
      return

    const virtualElement = {
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        x: mousePosition.x,
        y: mousePosition.y,
        top: mousePosition.y,
        right: mousePosition.x,
        bottom: mousePosition.y,
        left: mousePosition.x,
      }),
      contextElement: document.body,
    }

    refs.setReference(virtualElement)
  }, [enabled, mousePosition, refs])

  const displayContent = useMemo(() => {
    if (!content)
      return null
    if (formatContent)
      return formatContent(content)
    if (typeof content === 'string')
      return content
    return content
  }, [content, formatContent])

  const shouldShow = Boolean(content) && enabled && Boolean(mousePosition)

  const arrowStyle
    = showArrow && middlewareData.arrow
      ? {
          left: middlewareData.arrow.x != null
            ? `${middlewareData.arrow.x}px`
            : '',
          top: middlewareData.arrow.y != null
            ? `${middlewareData.arrow.y}px`
            : '',
        }
      : {}

  const mergedFloatingStyle = {
    ...floatingStyles,
    maxWidth: typeof maxWidth === 'number'
      ? `${maxWidth}px`
      : maxWidth,
  }

  return {
    arrowRef,
    arrowStyle,
    displayContent,
    floatingStyles: mergedFloatingStyle,
    refs,
    shouldShow,
  }
}
