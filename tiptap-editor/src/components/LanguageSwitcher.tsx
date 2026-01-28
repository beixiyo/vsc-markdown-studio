import { Button } from 'tiptap-comps'
import { LANGUAGES, useLanguage } from 'tiptap-api/react'

/**
 * 语言切换组件
 */
export function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage()

  const languages = [
    { value: LANGUAGES.ZH_CN, label: '中文' },
    { value: LANGUAGES.EN_US, label: 'English' },
  ]

  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-textSecondary">
        语言:
      </span>
      { languages.map(lang => (
        <Button
          size='sm'
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
