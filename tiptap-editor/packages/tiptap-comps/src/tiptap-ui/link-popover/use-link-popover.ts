import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useState } from 'react'

// --- Hooks ---
import { useTiptapEditor, useTiptapEditorT } from 'tiptap-api/react'

// --- Lib ---
import {
  isMarkInSchema,
  isNodeTypeSelected,
  normalizeLinkUrl,
  sanitizeUrl,
} from 'tiptap-utils'
// --- Icons ---
import { LinkIcon } from '../../icons'

/**
 * 检查当前编辑器状态是否可以设置链接
 */
export function canSetLink(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable)
    return false

  // 第三个参数 'true' 用于检查当前选区是否在图片标题内，如果是则阻止设置链接
  // 如果选区在图片标题内，则不能设置链接
  if (isNodeTypeSelected(editor, ['image'], true))
    return false
  return editor.can().setMark('link')
}

/**
 * 检查编辑器中当前是否有激活的链接
 */
export function isLinkActive(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable)
    return false
  return editor.isActive('link')
}

/**
 * 判断是否应该显示链接按钮
 */
export function shouldShowLinkButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  const linkInSchema = isMarkInSchema('link', editor)

  if (!linkInSchema || !editor) {
    return false
  }

  if (hideWhenUnavailable && !editor.isActive('code')) {
    return canSetLink(editor)
  }

  return true
}

/**
 * 用于处理 Tiptap 编辑器中链接操作的自定义 Hook
 */
export function useLinkHandler(props: LinkHandlerProps) {
  const { editor, onSetLink } = props
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!editor)
      return

    // 挂载时立即获取 URL
    const { href } = editor.getAttributes('link')

    if (isLinkActive(editor) && url === null) {
      setUrl(href || '')
    }
  }, [editor, url])

  useEffect(() => {
    if (!editor)
      return

    const updateLinkState = () => {
      const { href } = editor.getAttributes('link')
      setUrl(href || '')
    }

    editor.on('selectionUpdate', updateLinkState)
    return () => {
      editor.off('selectionUpdate', updateLinkState)
    }
  }, [editor])

  const setLink = useCallback(() => {
    if (!url || !editor)
      return

    // 保存前规范化 URL：无协议时自动补 https://，避免存成 example.com 被浏览器解析成当前页相对路径
    const hrefToStore = normalizeLinkUrl(url) || url

    const { selection } = editor.state
    const isEmpty = selection.empty

    let chain = editor.chain().focus()

    chain = chain.extendMarkRange('link').setLink({ href: hrefToStore })

    if (isEmpty) {
      chain = chain.insertContent({ type: 'text', text: url })
    }

    chain.run()

    setUrl(null)

    onSetLink?.()
  }, [editor, onSetLink, url])

  const removeLink = useCallback(() => {
    if (!editor)
      return
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .setMeta('preventAutolink', true)
      .run()
    setUrl('')
  }, [editor])

  const openLink = useCallback(
    (target: string = '_blank', features: string = 'noopener,noreferrer') => {
      if (!url)
        return

      const safeUrl = sanitizeUrl(url, window.location.href)
      if (safeUrl !== '#') {
        window.open(safeUrl, target, features)
      }
    },
    [url],
  )

  return {
    url: url || '',
    setUrl,
    setLink,
    removeLink,
    openLink,
  }
}

/**
 * 用于链接弹出框状态管理的自定义 Hook
 */
export function useLinkState(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}) {
  const { editor, hideWhenUnavailable = false } = props

  const canSet = canSetLink(editor)
  const isActive = isLinkActive(editor)

  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!editor)
      return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowLinkButton({
          editor,
          hideWhenUnavailable,
        }),
      )
    }

    handleSelectionUpdate()

    editor.on('selectionUpdate', handleSelectionUpdate)

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  return {
    isVisible,
    canSet,
    isActive,
  }
}

/**
 * 为 Tiptap 编辑器提供链接弹出框功能的主 Hook
 *
 * @example
 * ```tsx
 * // 简单用法
 * function MyLinkButton() {
 *   const { isVisible, canSet, isActive, Icon, label } = useLinkPopover()
 *
 *   if (!isVisible) return null
 *
 *   return <button disabled={!canSet}>Link</button>
 * }
 *
 * // 高级用法（带配置）
 * function MyAdvancedLinkButton() {
 *   const { isVisible, canSet, isActive, Icon, label } = useLinkPopover({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onSetLink: () => console.log('Link set!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       disabled={!canSet}
 *       aria-label={label}
 *       aria-pressed={isActive}
 *     >
 *       <Icon />
 *       {label}
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useLinkPopover(config?: UseLinkPopoverConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onSetLink,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const t = useTiptapEditorT()

  const { isVisible, canSet, isActive } = useLinkState({
    editor,
    hideWhenUnavailable,
  })

  const linkHandler = useLinkHandler({
    editor,
    onSetLink,
  })

  return {
    isVisible,
    canSet,
    isActive,
    label: t('link.link'),
    Icon: LinkIcon,
    ...linkHandler,
  }
}

// ==================== 类型定义 ====================

/**
 * 链接弹出框功能的配置项
 */
export interface UseLinkPopoverConfig {
  /**
   * Tiptap 编辑器实例
   */
  editor?: Editor | null
  /**
   * 当链接不可用时是否隐藏链接弹出框
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * 设置链接时的回调函数
   */
  onSetLink?: () => void
}

/**
 * 链接处理器的配置项
 */
export interface LinkHandlerProps {
  /**
   * Tiptap 编辑器实例
   */
  editor: Editor | null
  /**
   * 设置链接时的回调函数
   */
  onSetLink?: () => void
}
