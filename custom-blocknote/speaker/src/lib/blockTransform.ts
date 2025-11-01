import type { Block, BlockNoteEditor } from '@blocknote/core'
import type { SpeakerType } from './types'

/**
 * 设置 Markdown 内容并应用 speakers，将占位符转为内联节点
 */
export async function setContentWithSpeakers(
  editor: BlockNoteEditor<any, any, any>,
  content: string,
  speakers: SpeakerType[],
) {
  const blocks = editor.tryParseMarkdownToBlocks(content || '') as unknown as Block[]
  const replaced = transformBlocks(blocks, Array.isArray(speakers)
    ? speakers
    : [])
  const idsToRemove = editor.document.map(b => b.id)
  editor.replaceBlocks(idsToRemove, replaced)
}

/**
 * 对当前文档应用 speakers，将占位符转为内联节点
 */
export async function setSpeakers(
  editor: BlockNoteEditor<any, any, any>,
  speakers: SpeakerType[],
) {
  const replaced = transformBlocks(editor.document as unknown as Block[], Array.isArray(speakers)
    ? speakers
    : [])
  const idsToRemove = editor.document.map(b => b.id)
  editor.replaceBlocks(idsToRemove, replaced)
}

/**
 * Speaker 占位符解析工具
 * 将文本中的 [speaker:X] 片段转换为 BlockNote 内联节点 { type: 'speaker', props }
 */

/**
 * 将一段纯文本拆分为包含 speaker 内联节点的内容数组
 * - 保留样式：当提供 styles 时，普通文本片段会以 StyledText 的形式返回
 */
function splitTextWithSpeakers(
  text: string,
  speakersMap: Map<number, SpeakerType>,
  styles?: Record<string, any>,
) {
  const result: any[] = []
  if (!text)
    return result

  const regex = /\[speaker:(\d+)\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const [full, numStr] = match
    const start = match.index
    const end = start + full.length

    const prefix = text.slice(lastIndex, start)
    if (prefix) {
      result.push(
        styles
          ? { type: 'text', text: prefix, styles }
          : prefix,
      )
    }

    const originalLabel = Number.parseInt(numStr)
    const s = speakersMap.get(originalLabel)
    if (s) {
      result.push({
        type: 'speaker',
        props: {
          originalLabel: s.originalLabel,
          id: typeof s.id === 'number'
            ? s.id
            : 0,
          name: s.name,
        },
      })
    }
    else {
      const fallback = full
      result.push(
        styles
          ? { type: 'text', text: fallback, styles }
          : fallback,
      )
    }

    lastIndex = end
  }

  const tail = text.slice(lastIndex)
  if (tail) {
    result.push(
      styles
        ? { type: 'text', text: tail, styles }
        : tail,
    )
  }

  return result
}

/**
 * 将块的 content 中的占位符替换为 speaker 内联节点
 * - 仅处理字符串与 type==='text' 的项
 * - 保留非文本/链接等其它内联元素
 */
function transformInlineContent(content: any[] | undefined, speakersMap: Map<number, SpeakerType>) {
  if (!Array.isArray(content) || content.length === 0)
    return content

  const transformed: any[] = []
  for (const item of content) {
    if (typeof item === 'string') {
      const parts = splitTextWithSpeakers(item, speakersMap)
      transformed.push(...parts)
      continue
    }

    if (item && item.type === 'text' && typeof item.text === 'string') {
      const parts = splitTextWithSpeakers(item.text, speakersMap, item.styles || {})
      transformed.push(...parts)
      continue
    }

    /** 其它内联元素保持不变 */
    transformed.push(item)
  }

  return transformed
}

/**
 * 递归处理块数组，将占位符替换为 speaker 内联节点
 */
function transformBlocks(blocks: Block[], speakers: SpeakerType[]) {
  const map = new Map<number, SpeakerType>()
  for (const s of speakers) map.set(s.originalLabel, s)

  const walk = (items: Block[]): Block[] => {
    return items.map(b => ({
      ...b,
      content: transformInlineContent(b.content as any[], map) as any,
      children: b.children && b.children.length > 0
        ? walk(b.children as any)
        : [],
    }))
  }

  return walk(blocks)
}
