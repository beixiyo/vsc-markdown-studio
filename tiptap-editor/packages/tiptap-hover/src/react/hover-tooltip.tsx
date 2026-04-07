'use client'

import type { FloatingPlacement } from 'hooks'
import type { HTMLAttributes } from 'react'
import type { EditorHoverTooltipProps, HoverTooltipProps } from './types'
import { SafePortal } from 'comps'
import { memo } from 'react'

import { cn } from 'utils'
import { useEditorHoverTooltip } from './use-editor-hover-tooltip'
import { useHoverTooltip } from './use-hover-tooltip'

const HOVER_TOOLTIP_EDITOR_IDLE: EditorHoverTooltipProps = {
  editor: null,
  enabled: false,
}

function isEditorModeProps(props: HoverTooltipProps): props is EditorHoverTooltipProps {
  return 'editor' in props
}

function arrowAnchorClass(placement: FloatingPlacement): string {
  const side = placement.split('-')[0]
  switch (side) {
    case 'top':
      return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
    case 'bottom':
      return 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
    case 'left':
      return 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2'
    case 'right':
      return 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2'
    default:
      return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
  }
}

const DOM_PROP_KEYS = new Set([
  'editor',
  'throttleDelay',
  'disableOnDrag',
  'disableOnSelection',
  'formatContent',
  'content',
  'mousePosition',
  'enabled',
  'offsetDistance',
  'placement',
  'showArrow',
  'maxWidth',
  'className',
  'style',
])

function pickDomRest(props: HoverTooltipProps): Record<string, unknown> {
  const out: Record<string, unknown> = { ...props }
  for (const k of DOM_PROP_KEYS)
    delete out[k]

  return out
}

// Helper function to format the hover content
function renderContent(content: React.ReactNode) {
  if (typeof content !== 'string') {
    return content
  }

  const entries = content.split(' | ')
  if (entries.length <= 1) {
    return content
  }

  return (
    <div className="flex flex-col gap-1">
      { entries.map((entry, index) => {
        const parts = entry.split(': ')
        if (parts.length < 2) {
          return (
            <div key={ index } className="text-text">
              { entry }
            </div>
          )
        }

        const label = parts[0]
        const value = parts.slice(1).join(': ')

        return (
          <div key={ index } className="flex gap-1.5">
            <span className="text-systemOrange font-medium whitespace-nowrap">
              { label }
              :
            </span>
            <span className="text-text">{ value }</span>
          </div>
        )
      }) }
    </div>
  )
}

export const HoverTooltip = memo((props: HoverTooltipProps) => {
  const {
    className,
    style,
    enabled = true,
    offsetDistance = 8,
    placement = 'top-start',
    showArrow = true,
    maxWidth = 300,
  } = props

  const editorMode = isEditorModeProps(props)
  const editorDerived = useEditorHoverTooltip(editorMode ? props : HOVER_TOOLTIP_EDITOR_IDLE)

  const content = editorMode
    ? editorDerived.formattedContent
    : props.content
  const mousePosition = editorMode
    ? editorDerived.mousePosition
    : props.mousePosition
  const formatContent = editorMode
    ? undefined
    : props.formatContent

  const {
    displayContent,
    floatingRef,
    floatingStyles,
    resolvedPlacement,
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

  const htmlRest = pickDomRest(props)

  if (!shouldShow)
    return null

  return (
    <SafePortal>
      <div
        { ...htmlRest as HTMLAttributes<HTMLDivElement> }
        ref={ floatingRef }
        className={ cn(
          'pointer-events-none z-50 rounded border border-border bg-background2 px-3 py-2 text-xs leading-tight text-text shadow-md wrap-break-word',
          className,
        ) }
        style={ { ...floatingStyles, ...style } }
      >
        { renderContent(displayContent) }
        { showArrow && (
          <div
            className={ cn(
              'absolute size-2 rotate-45 border border-border bg-background2',
              arrowAnchorClass(resolvedPlacement),
            ) }
            style={ { clipPath: 'polygon(0% 0%, 100% 100%, 0% 100%)' } }
          />
        ) }
      </div>
    </SafePortal>
  )
})

HoverTooltip.displayName = 'HoverTooltip'
