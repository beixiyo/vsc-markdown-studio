import { useState } from 'react'
import { Button } from 'tiptap-comps'
import {
  LANGUAGES,
  TiptapI18nProvider,
  useI18nInstance,
} from 'tiptap-api/react'
import { CollaborationSplitPane } from '@/playground/collaboration/split-pane'
import { Editor } from '@/playground/editor'
import { LanguageSwitcher } from './components/LanguageSwitcher'

/**
 * 内部组件：用于暴露全局 i18n 实例
 */
function AppContent() {
  const i18nInstance = useI18nInstance()
  const [mode, setMode] = useState<'editor' | 'collaboration'>('editor')

  /** 暴露全局函数到 window 对象，方便在控制台测试 */
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.switchLanguage = (lang: Language) => {
      i18nInstance.changeLanguage(lang)
      console.log(`语言已切换为: ${lang}`)
    }
    // @ts-ignore
    window.getCurrentLanguage = () => {
      const currentLang = i18nInstance.getLanguage()
      console.log(`当前语言: ${currentLang}`)
      return currentLang
    }
    (window as any).availableLanguages = [LANGUAGES.ZH_CN, LANGUAGES.EN_US]
  }

  return (
    <div className="h-screen">
      <div className="flex gap-2 items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex gap-2">
          <Button
            size='sm'
            onClick={ () => setMode('editor') }
            data-active-state={ mode === 'editor'
              ? 'on'
              : 'off' }
            data-appearance="emphasized"
            className="px-4 py-2 text-sm"
          >
            普通编辑器
          </Button>
          <Button
            size='sm'
            onClick={ () => setMode('collaboration') }
            data-active-state={ mode === 'collaboration'
              ? 'on'
              : 'off' }
            data-appearance="emphasized"
            className="px-4 py-2 text-sm"
          >
            协同编辑
          </Button>
        </div>
        <LanguageSwitcher />
      </div>

      { mode === 'editor'
        ? <Editor
          // initialMarkdown="[speaker:1] 和 [speaker:2]"
          speakerMap={ {
            1: { name: 'Alice', id: 'u1' },
          } }
          onSpeakerClick={ (attrs) => {
            console.log('speaker click', attrs)
          } }
        />
        : <CollaborationSplitPane /> }
    </div>
  )
}

export default function App() {
  return (
    <TiptapI18nProvider
      defaultLanguage={ LANGUAGES.EN_US }
      storage={ { enabled: true, key: 'tiptap-editor-language' } }
    >
      <AppContent />
    </TiptapI18nProvider>
  )
}
