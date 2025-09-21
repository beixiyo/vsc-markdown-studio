import type { LabelInputBlockConfig } from './types'
import { defaultProps } from '@blocknote/core'
import { createReactBlockSpec } from '@blocknote/react'
import { LabelInputRenderer } from './LabelInputRenderer'

/**
 * BlockNote LabelInput 块定义
 */
export const LabelInputBlock = createReactBlockSpec(
  {
    type: 'labelInput',
    content: 'inline',
    propSchema: {
      /** 标签文本 */
      label: {
        default: '标签',
        type: 'string',
      },
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
    },
  } satisfies LabelInputBlockConfig,
  {
    render: props => <LabelInputRenderer { ...props } />,
    toExternalHTML: ({ block }) => {
      const text = block.content
        .filter(item => item.type === 'text')
        .map(item => (item as any).text)
        .join('')

      return (
        <div className="label-input-block">
          <div className="label-input-label">{block.props.label}</div>
          <div className="label-input-content">{text}</div>
        </div>
      )
    },
    parse: (el) => {
      /** 从 HTML 解析回块 props */
      const labelEl = el.querySelector('.label-input-label')
      const contentEl = el.querySelector('.label-input-content')

      if (labelEl && contentEl) {
        return {
          label: labelEl.textContent || '标签',
        }
      }
      return undefined
    },
  },
)
