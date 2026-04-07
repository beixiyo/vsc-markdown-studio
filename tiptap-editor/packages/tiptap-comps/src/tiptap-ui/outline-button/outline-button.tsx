import type { ButtonProps } from 'comps'
import { Button, SafePortal } from 'comps'
import { useClickOutside, useComposedRef, useFloatingPosition } from 'hooks'
import { forwardRef, useCallback, useRef, useState } from 'react'
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

    const triggerRef = useRef<HTMLButtonElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    const { setRef: mergedRef } = useComposedRef<HTMLButtonElement>({
      ref,
      onMounted: (node) => {
        triggerRef.current = node
      },
    })

    const { style: floatingStyle } = useFloatingPosition(triggerRef, contentRef, {
      enabled: isOpen,
      placement: 'bottom-start',
      offset: 8,
      flip: true,
      shift: true,
      boundaryPadding: 8,
    })

    const close = useCallback(() => {
      setIsOpen(false)
      onOpenChange?.(false)
    }, [onOpenChange])

    useClickOutside([
      triggerRef as React.RefObject<HTMLElement>,
      contentRef as React.RefObject<HTMLElement>
    ], close, { enabled: isOpen })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented)
          return
        
        const nextOpen = !isOpen
        setIsOpen(nextOpen)
        onOpenChange?.(nextOpen)
      },
      [onClick, isOpen, onOpenChange],
    )

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
          onClick={ handleClick }
          ref={ mergedRef }
        >
          <ListIcon className={ TIPTAP_UI_STYLES.icon } />
        </Button>
        <SafePortal>
          { isOpen && (
            <div
              ref={ contentRef }
              style={ { ...floatingStyle, zIndex: 50 } }
            >
              <OutlinePanel editor={ editor } />
            </div>
          ) }
        </SafePortal>
      </>
    )
  },
)

OutlineButton.displayName = 'OutlineButton'

export interface OutlineButtonProps extends Omit<ButtonProps, 'type'> {
  /** 浮层打开状态变化回调 */
  onOpenChange?: (open: boolean) => void
}
