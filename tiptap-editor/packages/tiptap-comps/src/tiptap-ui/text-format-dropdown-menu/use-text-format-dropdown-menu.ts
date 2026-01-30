'use client'

import type { Editor } from '@tiptap/react'

// --- Hooks ---
import { useTiptapEditor } from 'tiptap-api/react'

import {
  canToggleBlockquote,
  isBlockquoteActive,
} from './use-blockquote'
import {
  canToggle,
  isHeadingActive,
  type Level,
} from './use-heading'
import {
  canToggleList,
  isListActive,
  type ListType,
} from './use-list'

/**
 * Configuration for the text format dropdown menu functionality
 */
export interface UseTextFormatDropdownMenuConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Available heading levels to show in the dropdown
   * @default [1, 2, 3]
   */
  headingLevels?: Level[]
  /**
   * Available list types to show in the dropdown
   * @default ['bulletList', 'orderedList', 'taskList']
   */
  listTypes?: ListType[]
  /**
   * Whether the dropdown should hide when formats are not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
}

/**
 * Custom hook that provides text format dropdown menu functionality for Tiptap editor
 */
export function useTextFormatDropdownMenu(config?: UseTextFormatDropdownMenuConfig) {
  const {
    editor: providedEditor,
    headingLevels = [1, 2, 3],
    listTypes = ['bulletList', 'orderedList', 'taskList'],
    hideWhenUnavailable = false,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)

  /** 检查各种格式是否可用 */
  const canToggleHeading = headingLevels.some(level => canToggle(editor, level))
  const canToggleAnyList = listTypes.some(type => canToggleList(editor, type))
  const canToggleBlockquoteState = canToggleBlockquote(editor)
  const canToggleAny = canToggleHeading || canToggleAnyList || canToggleBlockquoteState || true // 段落总是可用

  const isVisible = !hideWhenUnavailable || canToggleAny

  /** 检查当前激活的格式 */
  const isHeadingActiveState = isHeadingActive(editor)
  const isAnyListActive = listTypes.some(type => isListActive(editor, type))
  const isBlockquoteActiveState = isBlockquoteActive(editor)
  const isParagraphActive = editor
    ? editor.isActive('paragraph')
    && !isHeadingActiveState
    && !isAnyListActive
    && !isBlockquoteActiveState
    : false

  const activeHeadingLevel = headingLevels.find(level => editor?.isActive('heading', { level }))

  const isActive = isHeadingActiveState || isAnyListActive || isBlockquoteActiveState || isParagraphActive

  /** 确定当前激活的类型和图标 */
  const activeType = isHeadingActiveState
    ? 'heading'
    : isAnyListActive
      ? 'list'
      : isBlockquoteActiveState
        ? 'blockquote'
        : isParagraphActive
          ? 'paragraph'
          : null

  return {
    isVisible,
    activeType,
    activeHeadingLevel,
    isActive,
    canToggle: canToggleAny,
    headingLevels,
    listTypes,
    label: '文本格式',
  }
}
