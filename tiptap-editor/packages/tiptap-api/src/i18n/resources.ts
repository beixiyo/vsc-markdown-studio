/**
 * Tiptap Editor 国际化资源
 * 聚合各语言文案，对外导出 tiptapEditorResources
 */
import type { Resources } from 'i18n'
import { LANGUAGES } from 'i18n'
import { enUS } from './locales/en-US'
import { ja } from './locales/ja-JP'
import { zhCN } from './locales/zh-CN'
import { zhTW } from './locales/zh-TW'

/**
 * 统一挂在包级命名空间 `tiptap` 根 key 下，与其它包（comps 等）的资源隔离，
 * 避免通用词跨包碰撞。访问由 useTiptapEditorT 自动注入 `tiptap` 前缀，
 * 非 React 处（扩展/触发源）则用 `i18n.t('tiptap.xxx')` 完整路径。
 */
export const tiptapEditorResources: Resources = {
  [LANGUAGES.ZH_CN]: { tiptap: zhCN },
  [LANGUAGES.ZH_TW]: { tiptap: zhTW },
  [LANGUAGES.EN_US]: { tiptap: enUS },
  [LANGUAGES.JA_JP]: { tiptap: ja },
}
