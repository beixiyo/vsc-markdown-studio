import type { SuggestionItem } from '../../types'
import { forwardRef, memo } from 'react'
import { cn } from 'tiptap-config'

export interface SuggestionMenuItemProps {
  item: SuggestionItem
  active: boolean
  onMouseEnter: () => void
  onClick: () => void
}

export const SuggestionMenuItem = memo(forwardRef<HTMLButtonElement, SuggestionMenuItemProps>(
  ({ item, active, onMouseEnter, onClick }, ref) => {
    return (
      <button
        ref={ ref }
        type="button"
        onMouseEnter={ onMouseEnter }
        onClick={ onClick }
        className={ cn(
          'flex w-full items-start gap-3 px-3 py-2 text-left',
          'text-[var(--text-color-primary)]',
          'transition-colors duration-150',
          active
            ? 'bg-[var(--bg-color-hover)]'
            : 'bg-transparent border-0 cursor-pointer hover:bg-[var(--bg-color-hover)]',
        ) }
      >
        <div className="mt-[2px] flex h-5 w-5 flex-shrink-0 items-center justify-center text-[var(--text-color-primary)]">
          { item.icon ?? <span className="h-5 w-5" /> }
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-[var(--text-color-primary)]">
            { item.title }
          </span>
          { item.subtitle
            ? (
                <span className="text-xs text-[var(--text-color-secondary)]">
                  { item.subtitle }
                </span>
              )
            : null }
        </div>
      </button>
    )
  },
))

SuggestionMenuItem.displayName = 'SuggestionMenuItem'
