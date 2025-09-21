import type { MermaidBlockConfig } from './types'
import { defaultProps } from '@blocknote/core'
import { createReactBlockSpec } from '@blocknote/react'
import { MermaidRenderer } from './MermaidRenderer'

/**
 * BlockNote Mermaid 块定义
 */
export const MermaidBlock = createReactBlockSpec(
  {
    type: 'mermaid',
    content: 'none',
    propSchema: {
      /** Mermaid 源码字符串 */
      diagram: {
        default: 'graph TD\n  A[Start] --> B{Is it?}\n  B --> C[End]',
        type: 'string',
      },
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
    },
  } satisfies MermaidBlockConfig,
  {
    render: props => <MermaidRenderer { ...props } />,
    toExternalHTML: ({ block }) => {
      return (
        <pre className="language-mermaid"><code>{ block.props.diagram }</code></pre>
      )
    },
    parse: (el) => {
      /** 从 <pre><code class="language-mermaid">...</code></pre> 解析回块 props */
      const pre = el.tagName === 'PRE'
        ? el
        : el.querySelector('pre')
      const codeEl = pre?.querySelector('code.language-mermaid') as HTMLElement | null
      if (codeEl && codeEl.textContent) {
        return { diagram: codeEl.textContent }
      }
      return undefined
    },
  },
)
