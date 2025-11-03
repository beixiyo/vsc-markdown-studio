import { createReactInlineContentSpec } from '@blocknote/react'

/**
 * Speaker inline content specification factory
 */
export function createSpeaker(onSpeakerTapped?: (speaker: {
  label: number
  originalLabel: number
  id?: number
  name: string
  speakerName: string
}) => void) {
  return createReactInlineContentSpec(
    {
      type: 'speaker',
      propSchema: {
        id: {
          default: 0,
        },
        name: {
          default: 'Unknown',
        },
        label: {
          default: 0,
        },
        originalLabel: {
          default: 0,
        },
      },
      content: 'none',
    } as const,
    {
      render: props => (
        <span
          className="px-1 font-bold cursor-pointer text-black dark:text-white"
          onClick={ () => {
            const speakerData = {
              label: props.inlineContent.props.label,
              originalLabel: props.inlineContent.props.originalLabel,
              id: props.inlineContent.props.id || undefined,
              name: props.inlineContent.props.name,
              speakerName: `@${props.inlineContent.props.name}`,
            }

            console.log('Speaker 被点击:', speakerData)

            /** 调用回调函数（如果有的话） */
            if (onSpeakerTapped) {
              onSpeakerTapped(speakerData)
            }
          } }
        >
          { props.inlineContent.props.name }
        </span>
      ),

      toExternalHTML(props) {
        const p = props.inlineContent.props
        const extraAttrs: Record<string, string> = {}

        /** 仅在非默认值时输出自定义前缀的 data-speaker-* 属性，避免无意义冗余 */
        if (p.name != null) {
          extraAttrs['data-speaker-name'] = p.name
        }
        if (p.id != null) {
          extraAttrs['data-speaker-id'] = String(p.id)
        }
        if (p.label != null) {
          extraAttrs['data-speaker-label'] = String(p.label)
        }
        if (p.originalLabel != null) {
          extraAttrs['data-speaker-original-label'] = String(p.originalLabel)
        }

        /** 使用 <span> 承载，附带自定义的 data-speaker-* 属性； */
        // Markdown 导出阶段由 rehype 插件转换为 <speaker> 标签
        return (
          <span
            ref={ props.contentRef }
            className="px-1 font-bold text-black dark:text-white"
            { ...extraAttrs }
          >
            { props.inlineContent.props.name }
          </span>
        )
      },
    },
  )
}
