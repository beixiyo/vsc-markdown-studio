import { markInputRule } from '@tiptap/core'
import Bold from '@tiptap/extension-bold'

/**
 * 允许无空格边界的 **text** / __text__ 触发加粗；
 * 同时允许中文等无空格语言场景。
 */
const starInputRegex = /\*\*([^*]+?)\*\*$/
const underscoreInputRegex = /__([^_]+?)__$/

export const BoldNoSpace = Bold.extend({
  addInputRules() {
    return [
      markInputRule({ find: starInputRegex, type: this.type }),
      markInputRule({ find: underscoreInputRegex, type: this.type }),
    ]
  },
})
