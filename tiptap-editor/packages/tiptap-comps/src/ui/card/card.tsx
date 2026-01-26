'use client'

import { forwardRef } from 'react'
import { cn } from 'utils'

const Card = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ ref }
        className={ cn(
          'relative flex flex-col items-center bg-background border border-borderSecondary rounded-2xl shadow-card overflow-hidden word-wrap break-word outline-none',
          className,
        ) }
        { ...props }
      />
    )
  },
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ ref }
        className={ cn('flex items-center justify-between w-full p-1.5 border-b border-borderSecondary flex-none', className) }
        { ...props }
      />
    )
  },
)
CardHeader.displayName = 'CardHeader'

const CardBody = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ ref }
        className={ cn('p-1.5 flex-auto overflow-y-auto', className) }
        { ...props }
      />
    )
  },
)
CardBody.displayName = 'CardBody'

const CardItemGroup = forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    orientation?: 'horizontal' | 'vertical'
  }
>(({ className, orientation = 'vertical', ...props }, ref) => {
  return (
    <div
      ref={ ref }
      className={ cn(
        'relative flex min-w-max',
        orientation === 'vertical' ? 'flex-col justify-center' : 'flex-row items-center gap-1',
        className,
      ) }
      { ...props }
    />
  )
})
CardItemGroup.displayName = 'CardItemGroup'

const CardGroupLabel = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ ref }
        className={ cn('pt-3 px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-textPrimary/30 leading-none', className) }
        { ...props }
      />
    )
  },
)
CardGroupLabel.displayName = 'CardGroupLabel'

const CardFooter = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ ref }
        className={ cn('p-1.5 flex-none border-t border-borderSecondary', className) }
        { ...props }
      />
    )
  },
)
CardFooter.displayName = 'CardFooter'

export { Card, CardBody, CardFooter, CardGroupLabel, CardHeader, CardItemGroup }
