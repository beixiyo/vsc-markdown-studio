import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, Fragment, useMemo } from 'react'
import { cn } from 'utils'
import { parseShortcutKeys } from 'tiptap-config'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../tooltip'

const buttonVariants = cva(
  'inline-flex items-center justify-center transition-all transition-duration-200 ease-in-out font-medium text-sm leading-tight border-none focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:shrink-0 [&_.tiptap-button-text]:flex-auto [&_.tiptap-button-text]:text-left [&_.tiptap-button-text]:px-0.5',
  {
    variants: {
      variant: {
        default: 'bg-textPrimary/5 text-textPrimary hover:bg-textPrimary/10 active:bg-textPrimary/15',
        ghost: 'bg-transparent text-textPrimary hover:bg-textPrimary/5 active:bg-textPrimary/10',
        primary: 'bg-brand text-background hover:bg-brand/90 active:bg-brand/80',
        subdued: 'bg-textPrimary/5 text-textPrimary hover:bg-textPrimary/10 active:bg-textPrimary/15',
      },
      size: {
        default: 'h-8 min-w-[2rem] px-2 gap-1.5 rounded-xl [&_svg]:w-[14px] [&_svg]:h-[14px] [&_.tiptap-button-dropdown-arrows]:w-3 [&_.tiptap-button-dropdown-arrows]:h-3 [&_.tiptap-button-dropdown-small]:w-2.5 [&_.tiptap-button-dropdown-small]:h-2.5',
        small: 'h-6 min-w-[1.5rem] px-1 gap-1 rounded-lg text-xs [&_svg]:w-[12px] [&_svg]:h-[12px] [&_.tiptap-button-dropdown-arrows]:w-2.5 [&_.tiptap-button-dropdown-arrows]:h-2.5 [&_.tiptap-button-dropdown-small]:w-2 [&_.tiptap-button-dropdown-small]:h-2',
        large: 'h-9 min-w-[2.375rem] px-2.5 gap-2 rounded-xl text-base [&_svg]:w-[18px] [&_svg]:h-[18px] [&_.tiptap-button-dropdown-arrows]:w-3.5 [&_.tiptap-button-dropdown-arrows]:h-3.5 [&_.tiptap-button-dropdown-small]:w-3 [&_.tiptap-button-dropdown-small]:h-3',
      },
      appearance: {

        default: '',
        emphasized: '',
        subdued: 'opacity-70',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: ['default', 'ghost', 'subdued'],
        active: true,
        className: 'bg-textPrimary/15 text-brand',
      },
      {
        variant: 'primary',
        active: true,
        className: 'bg-brand/80',
      },
      {
        variant: 'ghost',
        active: true,
        className: 'bg-textPrimary/10',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      appearance: 'default',
      active: false,
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  showTooltip?: boolean
  tooltip?: React.ReactNode
  shortcutKeys?: string
}

export const ShortcutDisplay: React.FC<{ shortcuts: string[] }> = ({
  shortcuts,
}) => {
  if (shortcuts.length === 0)
    return null

  return (
    <div className="flex items-center gap-0.5 opacity-50 ml-1">
      { shortcuts.map((key, index) => (
        <Fragment key={ index }>
          { index > 0 && <span className="text-[10px]">+</span> }
          <kbd className="text-[10px] uppercase font-sans">{ key }</kbd>
        </Fragment>
      )) }
    </div>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      tooltip,
      showTooltip = true,
      shortcutKeys,
      variant,
      size,
      appearance,
      'aria-label': ariaLabel,
      // @ts-ignore
      'data-active-state': activeState,
      // @ts-ignore
      'data-style': dataStyle,
      ...props
    },
    ref,
  ) => {
    const shortcuts = useMemo<string[]>(
      () => parseShortcutKeys({ shortcutKeys }),
      [shortcutKeys],
    )

    const isActive = activeState === 'on' || props['aria-pressed'] === true
    const currentVariant = (dataStyle as any) || variant

    const buttonClass = cn(
      buttonVariants({
        variant: currentVariant,
        size,
        appearance,
        active: isActive,
      }),
      className,
    )

    if (!tooltip || !showTooltip) {
      return (
        <button
          className={ buttonClass }
          ref={ ref }
          aria-label={ ariaLabel }
          { ...props }
        >
          { children }
        </button>
      )
    }

    return (
      <Tooltip delay={ 200 }>
        <TooltipTrigger
          asChild
        >
          <button
            className={ buttonClass }
            ref={ ref }
            aria-label={ ariaLabel }
            { ...props }
          >
            { children }
          </button>
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-2">
          { tooltip }
          <ShortcutDisplay shortcuts={ shortcuts } />
        </TooltipContent>
      </Tooltip>
    )
  },
)

Button.displayName = 'Button'

export const ButtonGroup = forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    orientation?: 'horizontal' | 'vertical'
  }
>(({ className, children, orientation = 'vertical', ...props }, ref) => {
  return (
    <div
      ref={ ref }
      className={ cn(
        'relative flex',
        orientation === 'vertical' ? 'flex-col items-start justify-center min-w-max' : 'flex-row items-center gap-0.5',
        className,
      ) }
      role="group"
      { ...props }
    >
      { children }
    </div>
  )
})
ButtonGroup.displayName = 'ButtonGroup'

export default Button
