import type { LabelInputBlockNoteEditor, LabelInputMenuItemConfig } from './types'

/**
 * LabelInput 菜单项
 */
export function labelInputMenuItem(): LabelInputMenuItemConfig {
  return {
    key: 'labelInput',
    title: '标签输入块',
    onItemClick: (editor: LabelInputBlockNoteEditor) => {
      const selected = editor.getTextCursorPosition().block
      editor.insertBlocks(
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
        selected,
        'after',
      )
    },
    aliases: ['label', 'labelInput', 'labelBlock'],
    group: '对话',
    icon: <div className="text-xl">🎤</div>,
    hint: '创建标签输入块，标识标签',
  }
}
