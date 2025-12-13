'use client'

import type { EditorProps } from './types'

import { memo, useRef, useState } from 'react'

import { CommentStore } from 'tiptap-comment'

import { useAutoSave } from 'tiptap-api/react'

import { useIsBreakpoint } from 'tiptap-api/react'
import { useWindowSize } from 'tiptap-api/react'
import { TiptapEditor } from './tiptap-editor'
import content from './data/content.json' with { type: 'json' }
import { EditorUI } from './editor-ui'
import { useMobileView } from './hooks/use-mobile-view'

/**
 * 演示版编辑器：集成所有 UI 能力，适合快速体验
 * 若需自定义组合，请直接使用 TiptapEditor + 各 UI 组件自行拼装
 */
export const Editor = memo<EditorProps>(({
  initialMarkdown,
  speakerMap,
  onSpeakerClick,
}) => {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const { mobileView, setMobileView } = useMobileView(isMobile)

  const toolbarRef = useRef<HTMLDivElement>(null)
  const [commentStore] = useState(() => new CommentStore())

  const { debouncedSave, markdown } = useAutoSave({ storageKey: 'tiptap-editor-content' })
  const data = initialMarkdown || content || markdown || ''

  return (
    <TiptapEditor
      data={ data }
      speakerMap={ speakerMap }
      onSpeakerClick={ onSpeakerClick }
      className="max-w-3xl mx-auto p-10"
      onUpdate={ ({ editor }) => {
        debouncedSave(editor)
      } }
    >
      <EditorUI
        isMobile={ isMobile }
        height={ height }
        mobileView={ mobileView }
        setMobileView={ setMobileView }
        commentStore={ commentStore }
        toolbarRef={ toolbarRef }
      />
    </TiptapEditor>
  )
})

Editor.displayName = 'Editor'
