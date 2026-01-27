import { useTheme } from 'hooks'
import { MoonStarIcon, SunIcon } from '../../icons'
import { Button } from 'comps'

export function ThemeToggle() {
  const [theme, setTheme] = useTheme()
  const isDarkMode = theme === 'dark'

  return (
    <Button
      onClick={ () => setTheme() }
      aria-label={ `Switch to ${isDarkMode
        ? 'light'
        : 'dark'} mode` }
      variant="ghost"
      size="sm"
    >
      { isDarkMode
        ? (
            <MoonStarIcon className="size-4" />
          )
        : (
            <SunIcon className="size-4" />
          ) }
    </Button>
  )
}
