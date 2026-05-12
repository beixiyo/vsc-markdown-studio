'use client'

import type { Editor } from '@tiptap/react'
import { Button } from 'comps'
import { memo, useCallback } from 'react'
import { getSelectionSection } from 'tiptap-api'
import { useTiptapEditor } from 'tiptap-api/react'

export interface SectionTestButtonProps {
  editor?: Editor | null
  className?: string
}

export const SectionTestButton = memo<SectionTestButtonProps>(
  ({ editor: providedEditor, className }) => {
    const { editor } = useTiptapEditor(providedEditor)

    const handleClick = useCallback(() => {
      const section = getSelectionSection(editor)
      if (!section) {
        console.warn('[SectionTest] editor 未就绪')
        return
      }

      const body = section.sectionMarkdown || section.sectionText

      console.group('[SectionTest] getSelectionSection')
      console.log('heading:', section.heading)
      console.log('selectedText:', section.selectedText || '（无选区）')
      console.log('sectionRange:', section.sectionRange)
      console.log('sectionMarkdown:', section.sectionMarkdown)
      console.log('sectionText:', section.sectionText)
      console.groupEnd()

      const headingInfo = section.heading
        ? `📌 标题: [H${section.heading.level}] ${section.heading.text}\n`
        : '📌 标题: （无，文档开头）\n'

      const selectedInfo = section.selectedText
        ? `✏️ 选中文本: "${section.selectedText}"\n`
        : '✏️ 选中文本: （无选区，仅光标）\n'

      const rangeInfo = `📐 Section 范围: [${section.sectionRange.from}, ${section.sectionRange.to}]\n`
      const preview = body.length > 200
        ? `${body.slice(0, 200)}...`
        : body
      const sectionInfo = `📄 Section Markdown:\n${preview}`

      alert(`${headingInfo}${selectedInfo}${rangeInfo}${sectionInfo}`)
    }, [editor])

    return (
      <Button
        size="sm"
        onClick={ handleClick }
        className={ className }
        tooltip="获取选区所属 Section（含标题上下文）"
        aria-label="获取选区 Section"
      >
        Section
      </Button>
    )
  },
)

SectionTestButton.displayName = 'SectionTestButton'
