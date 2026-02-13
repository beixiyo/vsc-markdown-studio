import { Button } from 'comps'
import { SUPPORTED_LANGUAGES } from 'tiptap-api'
import { useLanguage } from 'tiptap-api/react'

/**
 * 语言切换组件
 */
export function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage()

  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-text2">
        语言:
      </span>
      { SUPPORTED_LANGUAGES.map(lang => (
        <Button
          size="sm"
          key={ lang.value }
          onClick={ () => changeLanguage(lang.value) }
          data-active-state={ language === lang.value
            ? 'on'
            : 'off' }
          variant={
            language === lang.value
              ? 'primary'
              : 'default'
          }
          data-appearance="emphasized"
        >
          { lang.label }
        </Button>
      )) }
    </div>
  )
}
