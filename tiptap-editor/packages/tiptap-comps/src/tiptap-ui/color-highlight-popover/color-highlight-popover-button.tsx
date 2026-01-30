import { Button } from 'comps'
import { forwardRef } from 'react'
import { cn } from 'utils'
import { HighlighterIcon } from '../../icons'

/** 高亮弹层触发器按钮 */
export const ColorHighlightPopoverButton = forwardRef<
  HTMLButtonElement,
  ColorHighlightPopoverButtonProps
>(({ className, children, activeColor, ...props }, ref) => (
  <Button
    type="button"
    className={ cn('relative', className) }
    variant="ghost"
    role="button"
    tabIndex={ -1 }
    aria-label="Highlight text"
    ref={ ref }
    { ...props }
  >
    <div className="flex flex-col items-center">
      { children ?? <HighlighterIcon className="size-4" /> }
      { activeColor && (
        <div
          className="absolute bottom-1 h-1 w-4 rounded-full"
          style={ { backgroundColor: activeColor } }
        />
      ) }
    </div>
  </Button>
))

ColorHighlightPopoverButton.displayName = 'ColorHighlightPopoverButton'

export interface ColorHighlightPopoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  children?: React.ReactNode
  /** 当前选中的高亮颜色，用于底部色条展示 */
  activeColor?: string | null
  tooltip?: string
}
