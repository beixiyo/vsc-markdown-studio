/**
 * Tiptap Editor i18n 统一导出
 *
 * 封装 i18n 功能，使 tiptap-editor 相关包无需直接依赖 i18n
 */

import type { I18nProviderProps } from 'i18n/react'
import { deepMerge } from '@jl-org/tool'
import { getI18nInstance } from 'i18n'
import { I18nProvider } from 'i18n/react'
import React, { useMemo } from 'react'
import { tiptapEditorResources } from './resources'

/** 导出 tiptap-editor 特定的 i18n 功能 */
export * from './hooks'
export { tiptapEditorResources } from './resources'

export {
  getFirstAvailableLocale,
  LANGUAGE_TO_LOCALE,
  LANGUAGES,
  resolveLocaleCandidates,
} from 'i18n'

export type {
  Language,
  LanguageToLocaleMap,
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
 * 支持通过 languageToLocale 传入自定义 fallback 映射
 */
export interface TiptapI18nProviderProps extends Omit<I18nProviderProps, 'children'> {
  children?: React.ReactNode
}

export function TiptapI18nProvider({
  children,
  resources,
  languageToLocale,
  ...props
}: TiptapI18nProviderProps) {
  const globalI18n = useMemo(() => {
    const res = resources
      ? deepMerge(tiptapEditorResources, resources)
      : tiptapEditorResources

    /** 立即同步到全局单例，确保非 React 组件在初始化时就能拿到资源 */
    const i18n = getI18nInstance()
    i18n.mergeResources(res, true)
    if (languageToLocale) {
      i18n.setLanguageToLocale(languageToLocale)
    }
    if (props.defaultLanguage) {
      i18n.changeLanguage(props.defaultLanguage)
    }

    return i18n
  }, [resources, props.defaultLanguage, languageToLocale])

  return (
    <I18nProvider { ...props } instance={ globalI18n }>
      { children }
    </I18nProvider>
  )
}
