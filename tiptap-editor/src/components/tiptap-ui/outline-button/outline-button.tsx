import { forwardRef, useState, useCallback } from 'react'
import { useTiptapEditor } from 'tiptap-react-hook'
import { Button } from 'tiptap-styles/ui'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useInteractions,
  useMergeRefs,
  FloatingPortal,
} from '@floating-ui/react'
import { ListIcon } from 'tiptap-styles/icons'
import { OutlinePanel } from '@/components/playground/outline-panel'
import type { ButtonProps } from 'tiptap-styles/ui'

export interface OutlineButtonProps extends Omit<ButtonProps, 'type'> {
  /**
   * 浮层打开状态变化回调
   */
  onOpenChange?: (open: boolean) => void
}

/**
 * 大纲按钮组件，点击后显示文档大纲
 */
export const OutlineButton = forwardRef<HTMLButtonElement, OutlineButtonProps>(
  (
    {
      onOpenChange,
      onClick,
      className,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor()
    const [isOpen, setIsOpen] = useState(false)

    const { refs, floatingStyles, context } = useFloating({
      open: isOpen,
      onOpenChange: (open) => {
        setIsOpen(open)
        onOpenChange?.(open)
      },
      placement: 'bottom-start',
      whileElementsMounted: autoUpdate,
      middleware: [
        offset(8),
        flip({
          padding: 8,
        }),
        shift({ padding: 8 }),
      ],
    })

    const dismiss = useDismiss(context)
    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss])

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        setIsOpen((prev) => !prev)
      },
      [onClick]
    )

    const mergedRef = useMergeRefs([ref, refs.setReference])

    return (
      <>
        <Button
          type="button"
          data-style="ghost"
          data-appearance="default"
          role="button"
          tabIndex={ -1 }
          aria-label="大纲"
          aria-expanded={ isOpen }
          tooltip="大纲"
          className={ className }
          { ...buttonProps }
          { ...getReferenceProps({
            onClick: handleClick,
          }) }
          ref={ mergedRef }
        >
          <ListIcon className="tiptap-button-icon" />
        </Button>
        { isOpen && (
          <FloatingPortal>
            <div
              ref={ refs.setFloating }
              style={ floatingStyles }
              { ...getFloatingProps() }
            >
              <OutlinePanel editor={ editor } />
            </div>
          </FloatingPortal>
        ) }
      </>
    )
  }
)

OutlineButton.displayName = 'OutlineButton'

