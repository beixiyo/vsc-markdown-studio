import { Button, LANGUAGES, useLanguage } from 'tiptap-comps'

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
      <span className="text-sm text-[var(--tt-text-color-secondary)]">
        语言:
      </span>
      {languages.map(lang => (
        <Button
          key={ lang.value }
          onClick={ () => changeLanguage(lang.value) }
          data-active-state={ language === lang.value
            ? 'on'
            : 'off' }
          data-appearance="emphasized"
          className="px-3 py-1 text-sm"
        >
          {lang.label}
        </Button>
      ))}
    </div>
  )
}
