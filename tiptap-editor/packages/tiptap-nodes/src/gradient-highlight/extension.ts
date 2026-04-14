import TiptapHighlight from '@tiptap/extension-highlight'
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
}).configure({ multicolor: true })
