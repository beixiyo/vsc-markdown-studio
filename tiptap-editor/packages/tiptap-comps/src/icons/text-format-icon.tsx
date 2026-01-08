import { memo } from 'react'

type SvgProps = React.ComponentPropsWithoutRef<'svg'>

export const TextFormatIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={ className }
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      { ...props }
    >
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20V4m7 2V4H5v2m9 14h-4" />
    </svg>
  )
})

TextFormatIcon.displayName = 'TextFormatIcon'
