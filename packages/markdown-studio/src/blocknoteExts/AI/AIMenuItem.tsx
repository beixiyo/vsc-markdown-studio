import type { DefaultReactSuggestionItem } from '@blocknote/react'
import type { AnyBlockNoteEditor } from '@/types/MDBridge'
import { Sparkles } from 'lucide-react'
import { getAIExtension } from './AIExtension'

export function AIMenuItem(editor: AnyBlockNoteEditor): DefaultReactSuggestionItem {
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
