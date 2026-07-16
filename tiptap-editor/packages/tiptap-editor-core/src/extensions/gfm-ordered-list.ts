import type { JSONContent, MarkdownParseHelpers, MarkdownToken } from '@tiptap/core'
import { OrderedList } from '@tiptap/extension-list'

/**
 * 兼容合法 GFM 缩进与 task 语义的有序列表
 *
 * `@tiptap/extension-list@3.26.0` 会忽略四空格嵌套项中已解析好的 inline tokens，
 * 这里将普通列表项交回 ListItem handler，并补齐有序 task item 的语义
 */
export const GfmOrderedList = OrderedList.extend({
  parseMarkdown: (token, helpers) => {
    if (token.type !== 'list' || !token.ordered)
      return []

    const start = getOrderedItemNumber(token.items?.[0]) ?? token.start ?? 1
    const groups = groupOrderedListItems(token.items || [], start)

    if (groups.some(group => group.task)) {
      return groups.map(group => group.task
        ? createTaskList(group.items, helpers)
        : createOrderedList(group.items, group.start, helpers))
    }

    return createOrderedList(token.items || [], start, helpers)
  },
})

function createOrderedList(
  items: MarkdownToken[],
  start: number,
  helpers: MarkdownParseHelpers,
): JSONContent {
  return {
    type: 'orderedList',
    attrs: start === 1
      ? undefined
      : { start },
    content: helpers.parseChildren(items.map(item => normalizeContinuation(item, helpers))),
  }
}

function createTaskList(items: MarkdownToken[], helpers: MarkdownParseHelpers): JSONContent {
  return {
    type: 'taskList',
    content: items.map(item => createTaskItem(item, helpers)),
  }
}

function createTaskItem(item: MarkdownToken, helpers: MarkdownParseHelpers): JSONContent {
  const task = getOrderedTask(item)
  const content: JSONContent[] = [{
    type: 'paragraph',
    content: task?.text
      ? helpers.parseInline(helpers.tokenizeInline?.(task.text) || [])
      : [],
  }]

  if (item.tokens && item.tokens.length > 1)
    content.push(...helpers.parseChildren(item.tokens.slice(1)))

  return {
    type: 'taskItem',
    attrs: { checked: task?.checked ?? false },
    content,
  }
}

function groupOrderedListItems(items: MarkdownToken[], fallbackStart: number): OrderedListGroup[] {
  const groups: OrderedListGroup[] = []

  items.forEach((item, index) => {
    const task = !!getOrderedTask(item)
    const previous = groups.at(-1)
    if (previous?.task === task) {
      previous.items.push(item)
      return
    }

    groups.push({
      task,
      start: getOrderedItemNumber(item) ?? fallbackStart + index,
      items: [item],
    })
  })

  return groups
}

function getOrderedTask(item: MarkdownToken): OrderedTask | undefined {
  const firstToken = item.tokens?.[0]
  const text = firstToken?.text || firstToken?.raw || item.text || ''
  const match = text.match(/^\[([ xX])\]\s+(.*)$/s)
  if (!match)
    return undefined

  return {
    checked: match[1].toLowerCase() === 'x',
    text: match[2],
  }
}

function normalizeContinuation(item: MarkdownToken, helpers: MarkdownParseHelpers): MarkdownToken {
  const firstToken = item.tokens?.[0]
  if (!firstToken || (firstToken.type !== 'text' && firstToken.type !== 'paragraph'))
    return item

  const text = firstToken.text || firstToken.raw || ''
  const normalized = text.replace(/\n[ \t]+(?=\S)/g, '\n')
  if (normalized === text)
    return item

  return {
    ...item,
    tokens: [
      {
        ...firstToken,
        raw: normalized,
        text: normalized,
        tokens: helpers.tokenizeInline?.(normalized) || firstToken.tokens,
      },
      ...(item.tokens?.slice(1) || []),
    ],
  }
}

function getOrderedItemNumber(item?: MarkdownToken): number | undefined {
  if (!item)
    return undefined

  const value = item.raw?.match(/^\s*(\d+)[.)]\s+/)?.[1]
  return value === undefined
    ? undefined
    : Number(value)
}

type OrderedListGroup = {
  task: boolean
  start: number
  items: MarkdownToken[]
}

type OrderedTask = {
  checked: boolean
  text: string
}
