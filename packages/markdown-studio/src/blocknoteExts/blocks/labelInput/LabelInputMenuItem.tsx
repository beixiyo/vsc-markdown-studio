import type { LabelInputBlockNoteEditor, LabelInputMenuItemConfig } from './types'
import { Tag } from 'lucide-react'

/**
 * LabelInput 菜单项
 */
export function labelInputMenuItem(): LabelInputMenuItemConfig {
  return {
    key: 'labelInput',
    title: '标签输入块',
    onItemClick: (editor: LabelInputBlockNoteEditor) => {
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
    hint: '创建标签输入块，标识标签',
  }
}
