import type { BlockNoteEditor } from '@blocknote/core'
import type { DefaultReactSuggestionItem } from '@blocknote/react'
import { Sparkles } from 'lucide-react'
import { getAIExtension } from './AIExtension'

/**
 * 生成一个 Slash 菜单项，用于触发 AI Writing 流程
 */
export function AIMenuItem(editor: BlockNoteEditor<any, any, any>): DefaultReactSuggestionItem {
  const aiExtension = getAIExtension(editor)

  return {
    onItemClick: () => {
      const cursor = editor.getTextCursorPosition()
      const targetBlock = cursor.prevBlock
        && cursor.block.content
        && Array.isArray(cursor.block.content)
        && cursor.block.content.length === 0
        ? cursor.prevBlock
        : cursor.block

      if (!targetBlock) {
        return
      }

      aiExtension.openAIMenuAtBlock(targetBlock.id)
    },
    icon: <Sparkles className="h-4 w-4" />,
    title: 'AI Writing',
    aliases: ['ai', 'writing'],
    group: 'AI',
  }
}
