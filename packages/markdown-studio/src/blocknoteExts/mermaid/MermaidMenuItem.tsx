import type { MermaidBlockNoteEditor, MermaidMenuItemConfig } from './types'

/**
 * 生成一个 Slash 菜单项，用于插入 Mermaid 块
 */
export function mermaidMenuItem(): MermaidMenuItemConfig {
  return {
    key: 'mermaid',
    title: 'Mermaid Diagram',
    onItemClick: (editor: MermaidBlockNoteEditor) => {
      const selected = editor.getTextCursorPosition().block
      editor.insertBlocks(
        [
          {
            type: 'mermaid' as const,
            props: {
              diagram: 'graph TD\n  A[Start] --> B{Is it?}\n  B --> C[End]',
              textAlignment: 'center' as const,
            },
          },
        ],
        selected,
        'after',
      )
    },
    aliases: ['mermaid', 'diagram', 'chart', '图表', '流程图'],
    group: 'Media-Code',
    icon: <div className="text-xl">📊</div>,
    hint: '插入 Mermaid 图表',
  }
}
