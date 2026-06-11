import TiptapHighlight from '@tiptap/extension-highlight'
import { escapeHtmlAttr } from '../markdown-utils'
import { gradientStylesMap, type GradientStyleType, isGradientType } from './constants'

/**
 * 把渐变 key 翻译为一段文字渐变的 inline style
 */
function gradientInlineStyle(key: GradientStyleType): string {
  const { gradient } = gradientStylesMap[key]
  return [
    `background: ${gradient}`,
    '-webkit-background-clip: text',
    'background-clip: text',
    '-webkit-text-fill-color: transparent',
    'font-weight: 600',
  ].join('; ')
}

/**
 * `@tiptap/extension-highlight` 的扩展：
 * - `color` 命中 `gradientStylesMap` 时，渲染为文字渐变（inline style 包含 `background-clip: text`）
 * - 其它值走默认行为：`background-color: <color>`
 *
 * 用法：`editor.chain().setHighlight({ color: 'mysticPurpleBlue' }).run()`
 */
export const GradientHighlight = TiptapHighlight.extend({
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: element => element.getAttribute('data-color') || element.style.backgroundColor,
        renderHTML: (attributes) => {
          const color = attributes.color as string | null
          if (!color)
            return {}

          if (isGradientType(color)) {
            return {
              'data-color': color,
              'style': gradientInlineStyle(color),
            }
          }

          return {
            'data-color': color,
            'style': `background-color: ${color}; color: inherit`,
          }
        },
      },
    }
  },

  /**
   * Markdown 序列化
   *
   * - 无 color：保持官方 `==text==` 语法（tokenizer / parseMarkdown 均继承自
   *   @tiptap/extension-highlight，无需重写）
   * - 有 color：降级为 `<mark data-color="...">`，markdown 表达不了颜色；
   *   导入侧由 @tiptap/markdown 的成对内联 HTML 解析路径（合并 token →
   *   本扩展 parseHTML）自动还原 color，外部 GFM 渲染器降级显示默认黄底
   */
  renderMarkdown: (node, helpers) => {
    const color = node.attrs?.color as string | null
    const children = helpers.renderChildren(node)
    return color
      ? `<mark data-color="${escapeHtmlAttr(color)}">${children}</mark>`
      : `==${children}==`
  },
}).configure({ multicolor: true })
