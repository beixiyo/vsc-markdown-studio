/**
 * Tiptap Editor 国际化资源
 * 聚合各语言文案，对外导出 tiptapEditorResources
 */
import type { Resources } from 'i18n'
import { LANGUAGES } from 'i18n'
import { enUS } from './locales/en-US'
import { ja } from './locales/ja-JP'
import { zhCN } from './locales/zh-CN'

export const tiptapEditorResources: Resources = {
  [LANGUAGES.ZH_CN]: zhCN,
  [LANGUAGES.EN_US]: enUS,
  [LANGUAGES.JA_JP]: ja,
}
