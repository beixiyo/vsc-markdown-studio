import type {
  Language,
} from 'tiptap-api/react'
import type { MarkdownDiffPlaygroundProps } from '@/playground/diff/markdown-diff-playground'
import { Button } from 'comps'
import { lazy, useState } from 'react'
import {
  LANGUAGES,
  TiptapI18nProvider,
  useI18n,
} from 'tiptap-api/react'
import { TIPTAP_DATA_ATTR } from 'tiptap-utils'
import { CollaborationSplitPane } from '@/playground/collaboration/split-pane'
import { MarkdownDiffPlayground } from '@/playground/diff/markdown-diff-playground'
import { Editor } from '@/playground/editor'
import { LanguageSwitcher } from './components/LanguageSwitcher'

/**
 * 内部组件：用于暴露全局 i18n 实例
 */
function AppContent() {
  const { i18n: i18nInstance } = useI18n()
  const [mode, setMode] = useState<'editor' | 'collaboration' | 'diff'>('editor')

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
    <div className="flex h-screen min-h-0 flex-col">
      <div className="flex shrink-0 gap-2 items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={ () => setMode('editor') }
            { ...{
              [TIPTAP_DATA_ATTR.activeState]: mode === 'editor'
                ? 'on'
                : 'off',
              [TIPTAP_DATA_ATTR.appearance]: 'emphasized',
            } }
            variant={
              mode === 'editor'
                ? 'primary'
                : 'default'
            }
            className="px-4 py-2 text-sm"
          >
            普通编辑器
          </Button>
          <Button
            size="sm"
            onClick={ () => setMode('collaboration') }
            { ...{
              [TIPTAP_DATA_ATTR.activeState]: mode === 'collaboration'
                ? 'on'
                : 'off',
              [TIPTAP_DATA_ATTR.appearance]: 'emphasized',
            } }
            variant={
              mode === 'collaboration'
                ? 'primary'
                : 'default'
            }
            className="px-4 py-2 text-sm"
          >
            协同编辑
          </Button>
          <Button
            size="sm"
            onClick={ () => setMode('diff') }
            { ...{
              [TIPTAP_DATA_ATTR.activeState]: mode === 'diff'
                ? 'on'
                : 'off',
              [TIPTAP_DATA_ATTR.appearance]: 'emphasized',
            } }
            variant={ mode === 'diff'
              ? 'primary'
              : 'default' }
            className="px-4 py-2 text-sm"
          >
            Markdown Diff
          </Button>
        </div>
        <LanguageSwitcher />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        { mode === 'editor' && <Editor readonly={ false } /> }
        { mode === 'collaboration' && <CollaborationSplitPane /> }
        { mode === 'diff' && <MarkdownDiffPlayground { ...MARKDOWN_DIFF_CONFIG } /> }
      </div>
    </div>
  )
}

const MARKDOWN_DIFF_CONFIG = {
  splitViewMinWidth: 960,
  colors: {
    light: {
      addLine: '#ebf5ec',
      addText: '#c6e4ca',
      deleteLine: '#fdedec',
      deleteText: '#f7c7c5',
      addMarker: '#34c759',
      deleteMarker: '#ff565e',
    },
    dark: {
      addLine: '#323c33',
      addText: '#3e5633',
      deleteLine: '#2d1615',
      deleteText: '#621d21',
      addMarker: '#34c759',
      deleteMarker: '#ff565e',
    },
  },
} satisfies MarkdownDiffPlaygroundProps

const DevAgentation = import.meta.env.DEV
  ? lazy(() => import('agentation').then(m => ({ default: m.Agentation })))
  : () => null

export default function App() {
  return (
    <TiptapI18nProvider
      defaultLanguage={ LANGUAGES.EN_US }
      persistence={ { enabled: true, key: 'tiptap-editor-language' } }
    >
      <DevAgentation />
      <AppContent />
    </TiptapI18nProvider>
  )
}
