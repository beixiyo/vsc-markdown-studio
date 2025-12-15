import { memo } from 'react'

type SvgProps = React.ComponentPropsWithoutRef<'svg'>

export const EditIcon = memo(({ className, ...props }: SvgProps) => {
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
        d="M17.4142 2.58579C16.6332 1.80474 15.3668 1.80474 14.5858 2.58579L4.58579 12.5858C4.21071 12.9609 4 13.4696 4 14V20C4 21.1046 4.89543 22 6 22H12C12.5304 22 13.0391 21.7893 13.4142 21.4142L23.4142 11.4142C24.1953 10.6332 24.1953 9.36683 23.4142 8.58579L17.4142 2.58579ZM16 4L20 8L18 10L14 6L16 4ZM6 14L13 7L17 11L10 18H6V14Z"
        fill="currentColor"
      />
    </svg>
  )
})

EditIcon.displayName = 'EditIcon'
