import { markInputRule } from '@tiptap/core'
import Italic from '@tiptap/extension-italic'

/**
 * 允许无空格边界的 *text* / _text_ 触发斜体；
 * 避免匹配 **bold**（通过排除相邻的第二个 * 或 _）。
 * 同时允许中文等无空格语言场景。
 */
const starInputRegex = /(?<!\*)\*([^*]+?)\*(?!\*)$/
const underscoreInputRegex = /(?<!_)_([^_]+?)_(?!_)$/

export const ItalicNoSpace = Italic.extend({
  addInputRules() {
    return [
      markInputRule({ find: starInputRegex, type: this.type }),
      markInputRule({ find: underscoreInputRegex, type: this.type }),
    ]
  },
})
