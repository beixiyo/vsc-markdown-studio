import { memo } from 'react'

type SvgProps = React.ComponentPropsWithoutRef<'svg'>

export const DragHandleIcon = memo(({ className, width = '14', height = '14', ...props }: SvgProps) => {
  return (
    <svg
      width={ width }
      height={ height }
      className={ className }
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      { ...props }
    >
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  )
})

DragHandleIcon.displayName = 'DragHandleIcon'
