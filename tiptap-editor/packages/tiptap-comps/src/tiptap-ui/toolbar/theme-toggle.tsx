import { Button } from 'comps'
import { useTheme } from 'hooks'
import { MoonStarIcon, SunIcon } from '../../icons'
import { TIPTAP_UI_STYLES } from '../constants'

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
            <MoonStarIcon className={ TIPTAP_UI_STYLES.icon } />
          )
        : (
            <SunIcon className={ TIPTAP_UI_STYLES.icon } />
          ) }
    </Button>
  )
}
