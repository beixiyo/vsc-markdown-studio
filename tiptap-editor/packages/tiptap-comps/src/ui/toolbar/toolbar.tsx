import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { useComposedRef } from 'tiptap-api/react'
import { cn } from 'utils'
import { Separator } from '../separator'
import { useMenuNavigation } from './use-menu-navigation'

type BaseProps = React.HTMLAttributes<HTMLDivElement>

interface ToolbarProps extends BaseProps {
  variant?: 'floating' | 'fixed'
}

function useToolbarNavigation(toolbarRef: React.RefObject<HTMLDivElement | null>) {
  const [items, setItems] = useState<HTMLElement[]>([])

  const collectItems = useCallback(() => {
    if (!toolbarRef.current)
      return []
    return Array.from(
      toolbarRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [role="button"]:not([disabled]), [tabindex="0"]:not([disabled])',
      ),
    )
  }, [toolbarRef])

  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar)
      return

    const updateItems = () => setItems(collectItems())

    updateItems()
    const observer = new MutationObserver(updateItems)
    observer.observe(toolbar, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [collectItems, toolbarRef])

  const { selectedIndex } = useMenuNavigation<HTMLElement>({
    containerRef: toolbarRef,
    items,
    orientation: 'horizontal',
    onSelect: el => el.click(),
    autoSelectFirstItem: false,
  })

  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar)
      return

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (toolbar.contains(target))
        target.setAttribute('data-focus-visible', 'true')
    }

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (toolbar.contains(target))
        target.removeAttribute('data-focus-visible')
    }

    toolbar.addEventListener('focus', handleFocus, true)
    toolbar.addEventListener('blur', handleBlur, true)

    return () => {
      toolbar.removeEventListener('focus', handleFocus, true)
      toolbar.removeEventListener('blur', handleBlur, true)
    }
  }, [toolbarRef])

  useEffect(() => {
    if (selectedIndex !== undefined && items[selectedIndex]) {
      items[selectedIndex].focus()
    }
  }, [selectedIndex, items])
}

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
  ({ children, className, variant = 'fixed', ...props }, ref) => {
    const toolbarRef = useRef<HTMLDivElement>(null)
    const composedRef = useComposedRef(toolbarRef, ref)
    useToolbarNavigation(toolbarRef)

    return (
      <div
        ref={ composedRef }
        role="toolbar"
        aria-label="toolbar"
        className={ cn(
          'flex items-center gap-1',
          variant === 'fixed' && 'sticky top-0 z-10 w-full min-h-[2.75rem] bg-background border-b border-borderSecondary px-2 overflow-x-auto hide-scroll max-md:absolute max-md:top-auto max-md:h-[calc(2.75rem+env(safe-area-inset-bottom,0px))] max-md:border-t max-md:border-b-none max-md:pb-[env(safe-area-inset-bottom,0px)] max-md:flex-nowrap max-md:justify-start',
          variant === 'floating' && 'p-1 rounded-2xl border border-borderSecondary bg-background shadow-card outline-none overflow-hidden max-md:w-full max-md:rounded-none max-md:border-none max-md:shadow-none',
          className,
        ) }
        { ...props }
      >
        { children }
      </div>
    )
  },
)
Toolbar.displayName = 'Toolbar'

export const ToolbarGroup = forwardRef<HTMLDivElement, BaseProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ ref }
      role="group"
      className={ cn('flex items-center gap-0.5 empty:hidden', className) }
      { ...props }
    >
      { children }
    </div>
  ),
)
ToolbarGroup.displayName = 'ToolbarGroup'

export const ToolbarSeparator = forwardRef<HTMLDivElement, BaseProps>(
  ({ ...props }, ref) => (
    <Separator ref={ ref } orientation="vertical" decorative { ...props } />
  ),
)
ToolbarSeparator.displayName = 'ToolbarSeparator'
