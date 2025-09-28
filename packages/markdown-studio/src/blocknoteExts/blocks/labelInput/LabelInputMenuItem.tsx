import type { DefaultReactSuggestionItem } from '@blocknote/react'
import type { AnyBlockNoteEditor } from '@/types/MDBridge'
import { Tag } from 'lucide-react'

/**
 * LabelInput 菜单项
 */
export function LabelInputMenuItem(editor: AnyBlockNoteEditor): DefaultReactSuggestionItem {
  return {
    title: '标签输入块',
    onItemClick: () => {
      const selected = editor.getTextCursorPosition().block

      /** 替换当前块为 LabelInput 块 */
      editor.replaceBlocks(
        [selected],
        [
          {
            type: 'labelInput' as const,
            props: {
              label: '标签',
            },
            content: [
              {
                type: 'text',
                text: '',
                styles: {},
              },
            ],
          },
        ],
      )
    },
    aliases: ['label', 'labelInput', 'labelBlock'],
    group: 'Conversation',
    icon: <Tag className="w-5 h-5" />,
  }
}
