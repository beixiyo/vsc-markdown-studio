/**
 * 文件作用：基于 blockId 生成选区上下文（标题分组 / 单块）与对应 markdown
 * 一句话概括：把选中块转换为可消费的上下文数据（纯函数，无业务依赖）
 */
import type { BlockNoteEditor, PartialBlock } from '@blocknote/core'
import type { AnyBlock } from './types'
import { groupBlockByHeading } from './sections'

/**
 * 选区模式
 */
export type SelectionMode = 'headingSection' | 'block'

/**
 * 选区上下文信息
 */
export interface SelectionContext {
  /** 选区模式 */
  mode: SelectionMode
  /** 当模式为标题分组时的分组数据 */
  section: ReturnType<typeof groupBlockByHeading> | null
  /** 与选区关联的块 */
  block: AnyBlock | null
  /** 当前模式下对应的 Markdown 内容 */
  markdown: string
}

/**
 * 构建标题分组模式的选区上下文
 */
export function createHeadingSectionContext(
  editor: BlockNoteEditor<any, any, any>,
  blockId: string,
): SelectionContext | null {
  const section = groupBlockByHeading(editor, blockId)
  if (!section.heading)
    return null

  const markdown = editor.blocksToMarkdownLossy([
    section.heading as PartialBlock<any, any, any>,
    ...section.blocks,
  ])

  return {
    mode: 'headingSection',
    section,
    block: section.heading,
    markdown,
  }
}

/**
 * 构建单块模式的选区上下文
 */
export function createBlockContext(
  editor: BlockNoteEditor<any, any, any>,
  blockId: string,
): SelectionContext | null {
  const block = editor.document.find(item => item.id === blockId) as AnyBlock | undefined
  if (!block)
    return null

  const markdown = editor.blocksToMarkdownLossy([
    block as PartialBlock<any, any, any>,
  ])

  return {
    mode: 'block',
    section: null,
    block,
    markdown,
  }
}

/**
 * 根据需要的模式批量生成上下文
 */
export function createSelectionContexts(
  editor: BlockNoteEditor<any, any, any>,
  blockId: string,
  modes: SelectionMode[],
): SelectionContext[] {
  const contexts: SelectionContext[] = []

  modes.forEach((mode) => {
    const context = mode === 'headingSection'
      ? createHeadingSectionContext(editor, blockId)
      : createBlockContext(editor, blockId)

    if (context)
      contexts.push(context)
  })

  return contexts
}

/**
 * 生成指定模式的空上下文
 * 用于在某些模式未生成上下文时，提供占位以便下游消费
 */
export function normalizeContext(mode: SelectionMode): SelectionContext {
  return {
    mode,
    section: null,
    block: null,
    markdown: '',
  }
}

/**
 * 根据请求的模式列表，补全缺失的上下文（使用空上下文占位）
 */
export function ensureContexts(
  contexts: SelectionContext[],
  modes: SelectionMode[],
): SelectionContext[] {
  const modeToContext = new Map<SelectionMode, SelectionContext>()
  contexts.forEach(ctx => modeToContext.set(ctx.mode, ctx))

  const ensured: SelectionContext[] = []
  modes.forEach((mode) => {
    ensured.push(modeToContext.get(mode) ?? normalizeContext(mode))
  })

  return ensured
}

/**
 * 从上下文中获取标题分组的标题块
 */
export function getHeadingFromContexts(contexts: SelectionContext[]): AnyBlock | null {
  const heading = contexts.find(item => item.mode === 'headingSection')
  return heading?.section?.heading ?? null
}
