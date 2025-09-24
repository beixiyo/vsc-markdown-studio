import type { BlockNoteEditor } from '@blocknote/core'
import { useCallback, useEffect, useState } from 'react'

export interface TocItem {
  id: string
  level: number
  text: string
  blockId: string
}

export interface TocSection {
  name: string
  items: TocItem[]
}

/**
 * 解析 BlockNote 编辑器中的标题块，生成目录结构
 */
export function useToc(editor: BlockNoteEditor<any, any, any> | null) {
  const [tocSections, setTocSections] = useState<TocSection[]>([])
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null)

  /** 解析标题块 */
  const parseHeadings = useCallback((blocks: any[]): TocItem[] => {
    return blocks
      .filter(block => block.type === 'heading')
      .map(block => ({
        id: `heading-${block.id}`,
        level: block.props?.level || 1,
        text: block.content?.map((c: any) => c.text).join('') || '',
        blockId: block.id,
      }))
  }, [])

  /** 将标题按级别分组 */
  const groupHeadingsByLevel = useCallback((headings: TocItem[]): TocSection[] => {
    if (headings.length === 0)
      return []

    const sections: TocSection[] = []
    let currentSection: TocItem[] = []
    let currentLevel = headings[0].level

    headings.forEach((heading, index) => {
      if (heading.level === 1 || heading.level < currentLevel) {
        /** 遇到一级标题或更高级别的标题，开始新的分组 */
        if (currentSection.length > 0) {
          sections.push({
            name: currentSection[0].text || `标题组 ${sections.length + 1}`,
            items: currentSection,
          })
        }
        currentSection = [heading]
        currentLevel = heading.level
      }
      else if (heading.level === currentLevel) {
        /** 同级标题，添加到当前分组 */
        currentSection.push(heading)
      }
      else {
        /** 子级标题，添加到当前分组的最后一项 */
        currentSection.push(heading)
      }
    })

    /** 添加最后一个分组 */
    if (currentSection.length > 0) {
      sections.push({
        name: currentSection[0].text || `标题组 ${sections.length + 1}`,
        items: currentSection,
      })
    }

    return sections
  }, [])

  /** 更新目录 */
  const updateToc = useCallback(() => {
    if (!editor)
      return

    const blocks = editor.document
    const headings = parseHeadings(blocks)
    const sections = groupHeadingsByLevel(headings)
    setTocSections(sections)
  }, [editor, parseHeadings, groupHeadingsByLevel])

  /** 跳转到指定块 */
  const scrollToBlock = useCallback((blockId: string) => {
    setCurrentBlockId(blockId)
    MDBridge?.scrollToBlock(blockId)
  }, [])

  /** 监听编辑器内容变化 */
  useEffect(() => {
    if (!editor)
      return

    /** 初始更新 */
    updateToc()

    /** 监听文档变化 */
    const unsubscribe = editor.onChange(() => {
      updateToc()
    })

    return unsubscribe
  }, [editor, updateToc])

  /** 监听光标位置变化（用于高亮当前阅读位置） */
  useEffect(() => {
    if (!editor)
      return

    const unsubscribe = editor.onSelectionChange(() => {
      const selection = editor.getTextCursorPosition()
      if (selection?.block) {
        setCurrentBlockId(selection.block.id)
      }
    })

    return unsubscribe
  }, [editor])

  return {
    tocSections,
    currentBlockId,
    scrollToBlock,
    updateToc,
  }
}
