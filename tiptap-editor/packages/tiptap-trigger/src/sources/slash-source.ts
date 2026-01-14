import type { Editor } from '@tiptap/core'
import type { SuggestionItem, SuggestionItemContext, SuggestionSource, SuggestionSourceParams } from '../types'
import { createElement } from 'react'
import { AlignLeftIcon, BlockquoteIcon, HeadingOneIcon, HeadingTwoIcon, ListIcon, ListOrderedIcon, SparklesIcon } from 'tiptap-comps/icons'

type SlashAction = (editor: Editor, context: SuggestionItemContext) => void | Promise<void>

type SlashItemConfig = {
  id: string
  title: string
  subtitle?: string
  aliases?: string[]
  icon?: React.ReactNode
  onSelect: SlashAction
}

/**
 * 简单本地 Slash Source：基于预设列表匹配 query
 */
export class SlashMenuSource implements SuggestionSource {
  id = 'slash-menu-source'
  private items: SlashItemConfig[]

  constructor(items: SlashItemConfig[]) {
    this.items = items
  }

  async fetchItems(params: SuggestionSourceParams): Promise<SuggestionItem[]> {
    const { query, triggerId } = params
    const q = query.trim().toLowerCase()

    const matched = this.items.filter((item) => {
      if (!q)
        return true
      if (item.title.toLowerCase().includes(q))
        return true
      return item.aliases?.some(alias => alias.toLowerCase().includes(q)) ?? false
    })

    return matched.map(item => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      aliases: item.aliases,
      icon: item.icon,
      onSelect: (ed, context) => item.onSelect(ed, { ...context, triggerId }),
    }))
  }
}

/**
 * 便捷工厂：基于当前 block 类型构造常见动作
 * （示例：将当前段落切换为 heading / paragraph，或插入新段落）
 */
export function createBasicSlashItems(editor: Editor): SlashItemConfig[] {
  const exec = (command: string, ...args: unknown[]) => {
    const commands = editor.commands as Record<string, (...params: unknown[]) => unknown>
    const fn = commands[command]
    if (typeof fn === 'function') {
      fn(...args)
    }
  }

  return [
    {
      id: 'heading-1',
      title: 'Heading 1',
      subtitle: '大标题',
      aliases: ['h1', 'title'],
      icon: createElement(HeadingOneIcon, { className: 'h-5 w-5' }),
      onSelect: () => {
        exec('setNode', 'heading', { level: 1 })
      },
    },
    {
      id: 'heading-2',
      title: 'Heading 2',
      subtitle: '小标题',
      aliases: ['h2', 'subtitle'],
      icon: createElement(HeadingTwoIcon, { className: 'h-5 w-5' }),
      onSelect: () => {
        exec('setNode', 'heading', { level: 2 })
      },
    },
    {
      id: 'paragraph',
      title: 'Paragraph',
      subtitle: '正文',
      aliases: ['p', 'text'],
      icon: createElement(AlignLeftIcon, { className: 'h-5 w-5' }),
      onSelect: () => {
        exec('setNode', 'paragraph')
      },
    },
    {
      id: 'bullet-list',
      title: 'Bullet List',
      subtitle: '符号列表',
      aliases: ['ul', 'list'],
      icon: createElement(ListIcon, { className: 'h-5 w-5' }),
      onSelect: () => {
        exec('toggleBulletList')
      },
    },
    {
      id: 'ordered-list',
      title: 'Numbered List',
      subtitle: '有序列表',
      aliases: ['ol', 'list'],
      icon: createElement(ListOrderedIcon, { className: 'h-5 w-5' }),
      onSelect: () => {
        exec('toggleOrderedList')
      },
    },
    {
      id: 'blockquote',
      title: 'Blockquote',
      subtitle: '引用',
      aliases: ['quote'],
      icon: createElement(BlockquoteIcon, { className: 'h-5 w-5' }),
      onSelect: () => {
        exec('toggleBlockquote')
      },
    },
    {
      id: 'mermaid',
      title: 'Mermaid',
      subtitle: '图表',
      aliases: ['graph', 'diagram', 'flow'],
      icon: createElement(SparklesIcon, { className: 'h-5 w-5 text-purple-500' }),
      onSelect: () => {
        exec('insertMermaid', '')
      },
    },
  ]
}
