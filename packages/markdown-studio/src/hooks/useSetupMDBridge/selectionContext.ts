import type { BlockNoteEditor, PartialBlock } from '@blocknote/core'
import type { AnyBlock, SelectionContext, SelectionMode } from '@/types/MDBridge'
import { groupBlockByHeading } from './blockSections'

/**
 * 构建标题分组模式的选区上下文
 */
export function createHeadingSectionContext(
  editor: BlockNoteEditor<any, any, any>,
  blockId: string,
): SelectionContext | null {
  const section = groupBlockByHeading(editor, blockId)
  if (!section.heading) {
    return null
  }

  const markdown = MDBridge.getMarkdown([
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
  if (!block) {
    return null
  }

  const markdown = MDBridge.getMarkdown([
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

    if (context) {
      contexts.push(context)
    }
  })

  return contexts
}
