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
    if (!editor)
      return

    try {
      /** 使用 BlockNote 的 API 跳转到指定块 */
      editor.setTextCursorPosition(blockId, 'start')
      setCurrentBlockId(blockId)

      /** 确保编辑器获得焦点 */
      editor.focus()

      /** 尝试多种方法滚动到该块 */
      setTimeout(() => {
        /** 方法1: 查找 BlockNote 的块元素 */
        let blockElement = document.querySelector(`[data-node-type="heading"][data-id="${blockId}"]`)

        /** 方法2: 如果没找到，尝试查找包含该块ID的元素 */
        if (!blockElement) {
          blockElement = document.querySelector(`[data-id="${blockId}"]`)
        }

        /** 方法3: 查找所有标题元素，通过文本内容匹配 */
        if (!blockElement) {
          const allHeadings = document.querySelectorAll('[data-node-type="heading"]')
          const blocks = editor.document
          const targetBlock = blocks.find(block => block.id === blockId)

          if (targetBlock) {
            const targetText = targetBlock.content?.map((c: any) => c.text).join('') || ''
            for (const heading of allHeadings) {
              if (heading.textContent?.includes(targetText)) {
                blockElement = heading
                break
              }
            }
          }
        }

        if (blockElement) {
          blockElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
          })
        }
        else {
          console.warn('未找到目标块元素:', blockId)
        }
      }, 150)
    }
    catch (error) {
      console.warn('跳转到块失败:', error)
    }
  }, [editor])

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
