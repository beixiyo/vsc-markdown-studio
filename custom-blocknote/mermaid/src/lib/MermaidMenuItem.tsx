import type { BlockNoteEditor } from '@blocknote/core'
import type { DefaultReactSuggestionItem } from '@blocknote/react'
import { Workflow } from 'lucide-react'

/**
 * 生成一个 Slash 菜单项，用于插入 Mermaid 块
 */
export function MermaidMenuItem(editor: BlockNoteEditor<any, any, any>): DefaultReactSuggestionItem {
  return {
    title: 'Mermaid Diagram',
    onItemClick: () => {
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
    icon: <Workflow className="w-5 h-5" />,
  }
}
