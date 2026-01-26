import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'
import { cn } from 'utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center border font-bold transition-all transition-duration-200 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-backgroundSecondary border-borderSecondary text-textPrimary',
        ghost: 'bg-transparent border-transparent text-textSecondary',
        white: 'bg-white border-border text-black',
        gray: 'bg-backgroundTertiary border-border text-textSecondary',
        green: 'bg-successBg border-success/20 text-success',
      },
      size: {
        default: 'h-5 min-w-[1.25rem] px-1 text-[10px] rounded-md',
        small: 'h-4 min-w-[1rem] px-0.5 text-[9px] rounded',
        large: 'h-6 min-w-[1.5rem] px-1.5 text-xs rounded-lg',
      },
      appearance: {
        default: '',
        subdued: 'opacity-70',
        emphasized: 'border-brand/30 bg-brand/10 text-brand',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      appearance: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  trimText?: boolean
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      variant,
      size,
      appearance,
      trimText = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ ref }
        className={ cn(
          badgeVariants({ variant, size, appearance }),
          trimText && 'truncate max-w-full block',
          className,
        ) }
        { ...props }
      >
        { children }
      </div>
    )
  },
)

Badge.displayName = 'Badge'

export default Badge
