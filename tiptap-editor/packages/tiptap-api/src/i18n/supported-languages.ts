/**
 * Tiptap Editor 内置支持的语言列表
 * 与 tiptapEditorResources 中的语言一一对应，供语言切换器等外部直接使用
 */
import type { Language } from 'i18n'
import { LANGUAGES } from 'i18n'

export interface SupportedLanguageOption {
  value: Language
  label: string
}

/**
 * 内置支持的语言选项（value + 展示用 label）
 * 与 resources 中已配置的翻译语言保持一致
 */
export const SUPPORTED_LANGUAGES: readonly SupportedLanguageOption[] = [
  { value: LANGUAGES.ZH_CN, label: '中文' },
  { value: LANGUAGES.EN_US, label: 'English' },
  { value: LANGUAGES.JA_JP, label: '日語' },
  { value: LANGUAGES.ZH_TW, label: '繁體中文' },
] as const
