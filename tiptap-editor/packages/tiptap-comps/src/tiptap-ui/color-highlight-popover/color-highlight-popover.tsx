import { useEditorState } from '@tiptap/react'
import { Popover } from 'comps'
import { memo } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { HighlighterIcon } from '../../icons'
import { useColorHighlight, type UseColorHighlightConfig } from '../color-highlight-button'
import { ColorHighlightPopoverButton } from './color-highlight-popover-button'
import { ColorHighlightPopoverContent } from './color-highlight-popover-content'
import { DEFAULT_HIGHLIGHT_COLORS } from './constants'

export interface ColorHighlightPopoverProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  Pick<
    UseColorHighlightConfig,
    'editor' | 'hideWhenUnavailable' | 'onApplied'
  > {
  /**
   * Optional colors to use in the highlight popover.
   * If not provided, defaults to a predefined set of colors.
   */
  colors?: string[]
}

export const ColorHighlightPopover = memo(({
  editor: providedEditor,
  colors = DEFAULT_HIGHLIGHT_COLORS,
  hideWhenUnavailable = false,
  onApplied,
  ...props
}: ColorHighlightPopoverProps) => {
  const { editor } = useTiptapEditor(providedEditor)
  const { isVisible, canColorHighlight, isActive, label }
    = useColorHighlight({
      editor,
      hideWhenUnavailable,
      onApplied,
    })

  const activeColor = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor || !isActive)
        return null
      return ctx.editor.getAttributes('highlight').color as string || null
    },
  })

  if (!isVisible)
    return null

  return (
    <Popover
      trigger="click"
      content={ <ColorHighlightPopoverContent
        editor={ editor }
        colors={ colors }
      /> }
    >
      <ColorHighlightPopoverButton
        disabled={ !canColorHighlight }
        data-active-state={ isActive
          ? 'on'
          : 'off' }
        data-disabled={ !canColorHighlight }
        aria-pressed={ isActive }
        aria-label={ label }
        tooltip={ label }
        activeColor={ activeColor }
        { ...props }
      >
        <HighlighterIcon className="size-4" />
      </ColorHighlightPopoverButton>
    </Popover>
  )
})

ColorHighlightPopover.displayName = 'ColorHighlightPopover'
