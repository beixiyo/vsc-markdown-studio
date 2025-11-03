import type { Block, BlockNoteEditor } from '@blocknote/core'
import type { SpeakerType } from './types'

/**
 * 将一段 Markdown 设置到编辑器并同步应用 speakers 占位符解析
 *
 * @description
 * - 会先把传入的 Markdown 解析为 BlockNote 的 Block 数组
 * - 在所有块及其子块的内联内容中，识别并把 `[speaker:X]` 占位符替换为内联节点 `{ type: 'speaker', props }`
 * - 未匹配到的占位符会保留为原样文本；文本样式会在拆分后保留到新的普通文本片段；非文本类内联元素保持不变
 * - 最终使用转换后的 Block 数组整体替换编辑器当前文档（会替换整篇文档）
 *
 * 使用时机
 * - 首次加载或需要整体替换文档时，且手里已经有 Markdown 文本和 speakers 映射
 * - 希望一次性让内容与 speakers 一起生效
 *
 * 参数
 * @param editor BlockNote 编辑器实例
 * @param content Markdown 文本，支持包含 `[speaker:X]` 占位符
 * @param speakers Speaker 列表，按 `originalLabel` 建立映射；当 `id` 未提供时，内联节点中的 `id` 会设置为 `null`
 *
 * 返回值
 * - 无返回值（通过副作用替换编辑器文档）
 *
 * 限制
 * - 仅匹配形如 `[speaker:数字]` 的占位符（正则：`/\[speaker:(\d+)\]/g`）
 *
 * 示例
 * @example
 * await setContentWithSpeakers(editor, 'Hi [speaker:0]', [
 *   { originalLabel: 0, name: 'Bob', id: 1 }
 * ])
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
 * 在不改变现有 Markdown 内容前提下，对当前文档应用/更新 speakers 解析
 *
 * @description
 * - 基于当前编辑器文档的 Block 数组执行占位符替换，规则与 {@link setContentWithSpeakers} 相同
 * - 在文本或 `type ==='text'` 的内联项中识别 `[speaker:X]`，替换为 `{ type: 'speaker', props }`
 * - 未匹配到的占位符保留为原样文本；文本样式保留；其它内联元素不变；对子节点递归处理
 * - 使用转换后的 Block 数组整体替换当前文档
 *
 * 使用时机
 * - 文档内容已在编辑器中，随后才获取或更新 speakers 映射（例如异步到达或切换数据源）
 *
 * 参数
 * @param editor BlockNote 编辑器实例
 * @param speakers Speaker 列表，按 `originalLabel` 建立映射；当 `id` 未提供时，内联节点中的 `id` 会设置为 `null`
 *
 * 返回值
 * - 无返回值（通过副作用替换编辑器文档）
 *
 * 示例
 * @example
 * // 先设置内容，再单独应用 speakers
 * editor.setMarkdown('A [speaker:0] B')
 * await setSpeakers(editor, [{ originalLabel: 0, name: 'Bob', id: 1 }])
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
          id: s.id || null,
          name: s.name,
          label: s.label ?? 0,
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
