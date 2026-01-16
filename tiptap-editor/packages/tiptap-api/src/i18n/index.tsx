/**
 * Tiptap Editor i18n 统一导出
 *
 * 封装 i18n 功能，使 tiptap-editor 相关包无需直接依赖 i18n
 */

import type { I18nProviderProps } from 'i18n/react'
import { I18nProvider } from 'i18n/react'
import React, { useMemo } from 'react'
import { tiptapEditorResources } from './resources'

/** 导出 tiptap-editor 特定的 i18n 功能 */
export * from './hooks'
export { tiptapEditorResources } from './resources'

export {
  type Language,
  LANGUAGES,
} from 'i18n'

export type {
  Resources,
  TFunction,
  TranslateOptions,
  Translations,
} from 'i18n'

/** 重新导出 i18n/react 的核心 API，方便外部使用 */
export {
  useI18n,
  useI18nInstance,
  useLanguage,
  useResources,
  useStorage,
  useT,
} from 'i18n/react'

export type {
  I18nContextValue,
  I18nProviderProps,
} from 'i18n/react'

/**
 * Tiptap Editor 特定的 I18nProvider
 * 自动注入了 Tiptap Editor 的默认翻译资源
 */
export interface TiptapI18nProviderProps extends Omit<I18nProviderProps, 'children'> {
  children?: React.ReactNode
}

export function TiptapI18nProvider({
  children,
  resources,
  ...props
}: TiptapI18nProviderProps) {
  const mergedResources = useMemo(() => {
    if (!resources)
      return tiptapEditorResources

    // 深度合并默认资源和自定义资源
    const result = { ...tiptapEditorResources } as any
    const customResources = resources as any

    Object.keys(customResources).forEach((lang) => {
      const langResources = customResources[lang]
      if (result[lang]) {
        const mergedLang = { ...result[lang] }
        Object.keys(langResources).forEach((key) => {
          if (
            typeof langResources[key] === 'object'
            && langResources[key] !== null
            && !Array.isArray(langResources[key])
          ) {
            mergedLang[key] = {
              ...(mergedLang[key] || {}),
              ...langResources[key],
            }
          }
          else {
            mergedLang[key] = langResources[key]
          }
        })
        result[lang] = mergedLang
      }
      else {
        result[lang] = langResources
      }
    })
    return result
  }, [resources])

  return (
    <I18nProvider { ...props } resources={ mergedResources }>
      { children }
    </I18nProvider>
  )
}
