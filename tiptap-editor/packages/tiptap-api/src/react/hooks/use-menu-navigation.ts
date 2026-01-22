import type { Editor } from '@tiptap/react'
import { useEffect, useState } from 'react'

/**
 * 菜单导航方向
 * - "horizontal": 水平导航（使用左右方向键）
 * - "vertical": 垂直导航（使用上下方向键）
 * - "both": 双向导航（同时支持水平和垂直）
 */
type Orientation = 'horizontal' | 'vertical' | 'both'

interface MenuNavigationOptions<T> {
  /**
   * Tiptap 编辑器实例，如果与 Tiptap 编辑器一起使用。
   */
  editor?: Editor | null
  /**
   * 用于处理键盘事件的容器元素引用。
   */
  containerRef?: React.RefObject<HTMLElement | null>
  /**
   * 影响所选项目的搜索查询。
   */
  query?: string
  /**
   * 要导航的项目数组。
   */
  items: T[]
  /**
   * 选择项目时触发的回调函数。
   */
  onSelect?: (item: T) => void
  /**
   * 菜单应关闭时触发的回调函数。
   */
  onClose?: () => void
  /**
   * 菜单的导航方向。
   * @default "vertical"
   */
  orientation?: Orientation
  /**
   * 是否在菜单打开时自动选择第一项。
   * @default true
   */
  autoSelectFirstItem?: boolean
}

/**
 * 为下拉菜单、命令面板和自动完成组件实现键盘导航的自定义 Hook
 *
 * 提供完整的键盘导航支持，包括方向键导航、Tab 键切换、Home/End 键跳转、
 * Enter 键选择和 Escape 键关闭。支持 Tiptap 编辑器和常规 DOM 元素。
 *
 * @example
 * ```tsx
 * // 在命令面板中使用
 * const { selectedIndex } = useMenuNavigation({
 *   items: commands,
 *   onSelect: (command) => executeCommand(command),
 *   onClose: () => setOpen(false),
 *   orientation: "vertical"
 * });
 *
 * // 在 Tiptap 编辑器中使用
 * const { selectedIndex } = useMenuNavigation({
 *   editor,
 *   items: suggestions,
 *   onSelect: (suggestion) => insertSuggestion(suggestion)
 * });
 * ```
 *
 * @template T - 菜单项的类型
 * @param options - 菜单导航的配置选项
 * @param options.editor - Tiptap 编辑器实例，如果导航与编辑器集成
 * @param options.containerRef - 容器元素的 React ref，用于监听键盘事件
 * @param options.query - 搜索查询，当查询变化时重置选中项
 * @param options.items - 要导航的项目数组
 * @param options.onSelect - 选择项目时的回调函数
 * @param options.onClose - 关闭菜单时的回调函数
 * @param options.orientation - 导航方向，默认为 "vertical"
 * @param options.autoSelectFirstItem - 是否自动选择第一项，默认为 true
 * @returns 包含选中索引和设置函数的对象
 *   - selectedIndex: 当前选中项的索引，如果没有项目则为 undefined
 *   - setSelectedIndex: 手动设置选中索引的函数
 *
 * @note
 * - 支持以下键盘操作：
 *   - ArrowUp/ArrowDown: 垂直导航
 *   - ArrowLeft/ArrowRight: 水平导航
 *   - Tab/Shift+Tab: 向前/向后导航
 *   - Home/End: 跳转到第一项/最后一项
 *   - Enter: 选择当前项
 *   - Escape: 关闭菜单
 * - 当 items 数组为空时，selectedIndex 为 undefined
 */
export function useMenuNavigation<T>({
  editor,
  containerRef,
  query,
  items,
  onSelect,
  onClose,
  orientation = 'vertical',
  autoSelectFirstItem = true,
}: MenuNavigationOptions<T>) {
  const [selectedIndex, setSelectedIndex] = useState<number>(
    autoSelectFirstItem
      ? 0
      : -1,
  )

  useEffect(() => {
    const handleKeyboardNavigation = (event: KeyboardEvent) => {
      if (!items.length)
        return false

      const moveNext = () =>
        setSelectedIndex((currentIndex) => {
          if (currentIndex === -1)
            return 0
          return (currentIndex + 1) % items.length
        })

      const movePrev = () =>
        setSelectedIndex((currentIndex) => {
          if (currentIndex === -1)
            return items.length - 1
          return (currentIndex - 1 + items.length) % items.length
        })

      switch (event.key) {
        case 'ArrowUp': {
          if (orientation === 'horizontal')
            return false
          event.preventDefault()
          movePrev()
          return true
        }

        case 'ArrowDown': {
          if (orientation === 'horizontal')
            return false
          event.preventDefault()
          moveNext()
          return true
        }

        case 'ArrowLeft': {
          if (orientation === 'vertical')
            return false
          event.preventDefault()
          movePrev()
          return true
        }

        case 'ArrowRight': {
          if (orientation === 'vertical')
            return false
          event.preventDefault()
          moveNext()
          return true
        }

        case 'Tab': {
          event.preventDefault()
          if (event.shiftKey) {
            movePrev()
          }
          else {
            moveNext()
          }
          return true
        }

        case 'Home': {
          event.preventDefault()
          setSelectedIndex(0)
          return true
        }

        case 'End': {
          event.preventDefault()
          setSelectedIndex(items.length - 1)
          return true
        }

        case 'Enter': {
          if (event.isComposing)
            return false
          event.preventDefault()
          if (selectedIndex !== -1 && items[selectedIndex]) {
            onSelect?.(items[selectedIndex])
          }
          return true
        }

        case 'Escape': {
          event.preventDefault()
          onClose?.()
          return true
        }

        default:
          return false
      }
    }

    let targetElement: HTMLElement | null = null

    if (editor) {
      try {
        targetElement = editor.view?.dom
      }
      catch (e) {
        // 视图不可用
      }
    }
    else if (containerRef?.current) {
      targetElement = containerRef.current
    }

    if (targetElement) {
      targetElement.addEventListener('keydown', handleKeyboardNavigation, true)

      return () => {
        targetElement?.removeEventListener(
          'keydown',
          handleKeyboardNavigation,
          true,
        )
      }
    }

    return undefined
  }, [
    editor,
    containerRef,
    items,
    selectedIndex,
    onSelect,
    onClose,
    orientation,
  ])

  useEffect(() => {
    if (query) {
      setSelectedIndex(autoSelectFirstItem
        ? 0
        : -1)
    }
  }, [query, autoSelectFirstItem])

  return {
    selectedIndex: items.length
      ? selectedIndex
      : undefined,
    setSelectedIndex,
  }
}
