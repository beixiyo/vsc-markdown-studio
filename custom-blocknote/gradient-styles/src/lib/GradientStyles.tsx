/**
 * @link https://www.blocknotejs.org/docs/features/custom-schemas/custom-styles
 */

import { createReactStyleSpec } from '@blocknote/react'
import { gradientStylesMap, type GradientStyleType } from './constans'

/**
 * 渐变样式组件
 * 基于 BlockNote 的自定义样式规范创建，用于在编辑器中渲染渐变文本
 *
 * @example
 * ```tsx
 * // 在 BlockNote 架构中使用
 * const schema = BlockNoteSchema.create().extend({
 *   styleSpecs: {
 *     gradientStyles: GradientStyles,
 *   },
 * })
 * ```
 *
 * @example
 * ```ts
 * // 通过 MDBridge 应用渐变样式
 * MDBridge.addStyles({ gradient: 'mysticPurpleBlue' })
 * ```
 */
export const GradientStyles = createReactStyleSpec(
  {
    type: 'gradient',
    propSchema: 'string',
  },
  {
    render: (props) => {
      const data = gradientStylesMap[props.value as GradientStyleType]
      return <span
        className={ data.className }
        ref={ props.contentRef }
      />
    },
  },
)
