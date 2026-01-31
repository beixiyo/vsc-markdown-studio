import type { ButtonProps } from 'comps'
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useMergeRefs,
} from '@floating-ui/react'
import { Button } from 'comps'
import { forwardRef, useCallback, useState } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { ListIcon } from '../../icons'
import { TIPTAP_UI_STYLES } from '../constants'
import { OutlinePanel } from './outline-panel'

/** 大纲按钮，点击后显示文档大纲 */
export const OutlineButton = forwardRef<HTMLButtonElement, OutlineButtonProps>(
  (
    {
      onOpenChange,
      onClick,
      className,
      ...buttonProps
    },
    ref,
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
        if (event.defaultPrevented)
          return
        setIsOpen(prev => !prev)
      },
      [onClick],
    )

    const mergedRef = useMergeRefs([ref, refs.setReference])

    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="sm"
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
          <ListIcon className={ TIPTAP_UI_STYLES.icon } />
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
  },
)

OutlineButton.displayName = 'OutlineButton'

export interface OutlineButtonProps extends Omit<ButtonProps, 'type'> {
  /** 浮层打开状态变化回调 */
  onOpenChange?: (open: boolean) => void
}
