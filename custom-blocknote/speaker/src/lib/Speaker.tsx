import { createReactInlineContentSpec } from '@blocknote/react'

/**
 * Speaker 内联内容规范
 * 用于在编辑器中显示和交互说话人标签
 *
 * @param onSpeakerTapped - 可选的点击回调函数
 */
export function createSpeaker(onSpeakerTapped?: (speaker: {
  originalLabel: number
  id?: number
  name: string
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
        originalLabel: {
          default: 0,
        },
      },
      content: 'none',
    } as const,
    {
      render: props => (
        <span
          className="inline-block cursor-pointer px-0.5 font-bold text-black dark:text-white"
          data-original-label={ props.inlineContent.props.originalLabel }
          data-id={ props.inlineContent.props.id }
          data-name={ props.inlineContent.props.name }
          onClick={ () => {
            const speakerData = {
              originalLabel: props.inlineContent.props.originalLabel,
              id: props.inlineContent.props.id || undefined,
              name: props.inlineContent.props.name,
            }

            /** 调用回调函数（如果有的话） */
            if (onSpeakerTapped) {
              onSpeakerTapped(speakerData)
            }
          } }
        >
          { props.inlineContent.props.name }
        </span>
      ),
    },
  )
}
