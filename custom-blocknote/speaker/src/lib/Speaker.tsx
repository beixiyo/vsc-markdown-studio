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
          className="px-1 font-bold cursor-pointer text-white dark:text-black"
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
    },
  )
}
