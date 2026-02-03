import type { Editor } from '@tiptap/core'
import type { SuggestionItem, SuggestionItemContext, SuggestionSource, SuggestionSourceParams } from '../types'
import { getI18nInstance } from 'i18n'
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

export type CreateBasicSlashItemsOptions = {
  /** 要排除的菜单项 id，例如 ['mermaid'] 可隐藏 Mermaid 项 */
  excludeIds?: string[]
}

/**
 * 便捷工厂：基于当前 block 类型构造常见动作
 * （示例：将当前段落切换为 heading / paragraph，或插入新段落）
 * @param options.excludeIds 要排除的项 id 列表，用户可据此自定义不显示的项（如不要 mermaid）
 */
export function createBasicSlashItems(editor: Editor, options?: CreateBasicSlashItemsOptions): SlashItemConfig[] {
  const i18n = getI18nInstance()
  const excludeSet = options?.excludeIds?.length
    ? new Set(options.excludeIds)
    : null
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
      subtitle: i18n.t('slash.heading1'),
      aliases: ['h1', 'title'],
      icon: createElement(HeadingOneIcon, { className: 'h-5 w-5' }),
      onSelect: () => {
        exec('setNode', 'heading', { level: 1 })
      },
    },
    {
      id: 'heading-2',
      title: 'Heading 2',
      subtitle: i18n.t('slash.heading2'),
      aliases: ['h2', 'subtitle'],
      icon: createElement(HeadingTwoIcon, { className: 'h-5 w-5' }),
      onSelect: () => {
        exec('setNode', 'heading', { level: 2 })
      },
    },
    {
      id: 'paragraph',
      title: 'Paragraph',
      subtitle: i18n.t('slash.paragraph'),
      aliases: ['p', 'text'],
      icon: createElement(AlignLeftIcon, { className: 'h-5 w-5' }),
      onSelect: () => {
        exec('setNode', 'paragraph')
      },
    },
    {
      id: 'bullet-list',
      title: 'Bullet List',
      subtitle: i18n.t('slash.bulletList'),
      aliases: ['ul', 'list'],
      icon: createElement(ListIcon, { className: 'h-5 w-5' }),
      onSelect: () => {
        exec('toggleBulletList')
      },
    },
    {
      id: 'ordered-list',
      title: 'Numbered List',
      subtitle: i18n.t('slash.orderedList'),
      aliases: ['ol', 'list'],
      icon: createElement(ListOrderedIcon, { className: 'h-5 w-5' }),
      onSelect: () => {
        exec('toggleOrderedList')
      },
    },
    {
      id: 'blockquote',
      title: 'Blockquote',
      subtitle: i18n.t('slash.blockquote'),
      aliases: ['quote'],
      icon: createElement(BlockquoteIcon, { className: 'h-5 w-5' }),
      onSelect: () => {
        exec('toggleBlockquote')
      },
    },
    {
      id: 'mermaid',
      title: 'Mermaid',
      subtitle: i18n.t('slash.mermaid'),
      aliases: ['graph', 'diagram', 'flow'],
      icon: createElement(SparklesIcon, { className: 'h-5 w-5 text-purple-500' }),
      onSelect: (ed: Editor) => {
        ed.chain()
          .focus()
          .insertContent([
            { type: 'mermaid', attrs: { id: `mermaid-${Math.random().toString(36).slice(2)}`, code: '' } },
            { type: 'paragraph' },
          ])
          .run()
      },
    },
  ].filter(item => !excludeSet || !excludeSet.has(item.id))
}
