import type { Editor } from '@tiptap/core'
import type { AiController } from './ai-hooks'
import { useMemo } from 'react'
import { getTiptapSelectionPayload } from 'tiptap-ai'
import { createBasicSlashItems, SlashMenuSource, type SuggestionItem, type SuggestionSource } from 'tiptap-trigger'
import { type SuggestionConfig, useSuggestion } from 'tiptap-trigger/react'

export function useAiQuickSource(editor: Editor | null, aiController: AiController | null) {
  return useMemo<SuggestionSource | null>(() => {
    if (!editor || !aiController) {
      return null
    }

    const buildItem = (
      id: string,
      title: string,
      subtitle: string,
      prompt: string,
    ): SuggestionItem => ({
      id,
      title,
      subtitle,
      onSelect: async (ed) => {
        const payload = getTiptapSelectionPayload(ed)
        if (!payload) {
          return
        }
        payload.meta = {
          ...payload.meta,
          prompt,
        }
        await aiController.sendSelection(payload, 'stream')
      },
    })

    return {
      id: 'ai-quick',
      async fetchItems() {
        return [
          buildItem('ai-continue', 'AI 续写', '让 AI 接着写下去', '继续写下去'),
          buildItem('ai-polish', 'AI 润色', '更简洁、更流畅', '润色并精简这段文本'),
          buildItem('ai-translate-en', 'AI 翻译为英文', '英文表达', 'Translate the selection into natural English. Keep it concise.'),
        ]
      },
    }
  }, [editor, aiController])
}

export function useSlashSuggestion(editor: Editor | null, aiQuickSource: SuggestionSource | null) {
  const suggestionConfig = useMemo<SuggestionConfig>(() => {
    if (!editor) {
      return {} as SuggestionConfig
    }

    const sources: SuggestionSource[] = [
      new SlashMenuSource(createBasicSlashItems(editor)),
    ]

    if (aiQuickSource) {
      sources.push(aiQuickSource)
    }

    return {
      slash: {
        character: '/',
        minQueryLength: 0,
        sources,
        deleteTriggerCharacterOnSelect: true,
      },
    }
  }, [editor, aiQuickSource])

  return useSuggestion(editor, suggestionConfig)
}
