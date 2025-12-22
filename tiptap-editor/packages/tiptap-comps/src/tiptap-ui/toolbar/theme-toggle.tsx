import { useTheme } from 'hooks'
import { MoonStarIcon, SunIcon } from '../../icons'
import { Button } from '../../ui'

export function ThemeToggle() {
  const [theme, setTheme] = useTheme()
  const isDarkMode = theme === 'dark'

  return (
    <Button
      onClick={ () => setTheme() }
      aria-label={ `Switch to ${isDarkMode
        ? 'light'
        : 'dark'} mode` }
      data-style="ghost"
    >
      { isDarkMode
        ? (
            <MoonStarIcon className="tiptap-button-icon" />
          )
        : (
            <SunIcon className="tiptap-button-icon" />
          ) }
    </Button>
  )
}
