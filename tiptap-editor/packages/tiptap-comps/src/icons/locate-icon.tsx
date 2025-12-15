import { memo } from 'react'

type SvgProps = React.ComponentPropsWithoutRef<'svg'>

export const LocateIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={ className }
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      { ...props }
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 3C13 2.44772 12.5523 2 12 2C11.4477 2 11 2.44772 11 3V4.07089C7.05159 4.55347 4 7.87934 4 12C4 16.1207 7.05159 19.4465 11 19.9291V21C11 21.5523 11.4477 22 12 22C12.5523 22 13 21.5523 13 21V19.9291C16.9484 19.4465 20 16.1207 20 12C20 7.87934 16.9484 4.55347 13 4.07089V3ZM12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6ZM12 9C13.6569 9 15 10.3431 15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9Z"
        fill="currentColor"
      />
    </svg>
  )
})

LocateIcon.displayName = 'LocateIcon'

