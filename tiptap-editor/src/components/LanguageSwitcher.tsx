import { Button } from 'comps'
import { SUPPORTED_LANGUAGES } from 'tiptap-api'
import { useLanguage } from 'tiptap-api/react'
import { TIPTAP_DATA_ATTR } from 'tiptap-utils'

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
          { ...{
            [TIPTAP_DATA_ATTR.activeState]: language === lang.value
              ? 'on'
              : 'off',
            [TIPTAP_DATA_ATTR.appearance]: 'emphasized',
          } }
          variant={
            language === lang.value
              ? 'primary'
              : 'default'
          }
        >
          { lang.label }
        </Button>
      )) }
    </div>
  )
}
