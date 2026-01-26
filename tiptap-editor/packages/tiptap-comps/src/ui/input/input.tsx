import { cn } from 'utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={ type }
      className={ cn(
        'block w-full h-8 px-2 py-1.5 text-sm font-normal leading-normal bg-transparent appearance-none outline-none rounded-lg placeholder:text-textPrimary/40 transition-colors',
        className,
      ) }
      { ...props }
    />
  )
}

function InputGroup({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={ cn(
        'relative flex items-stretch w-full overflow-hidden transition-all',
        className,
      ) }
      { ...props }
    >
      { children }
    </div>
  )
}

export { Input, InputGroup }
