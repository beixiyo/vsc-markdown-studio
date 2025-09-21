import { useBlockNoteEditor, useComponentsContext, useSelectedBlocks } from '@blocknote/react'
import { Popover } from 'comps'
import { motion } from 'framer-motion'
import { ChevronDown, Palette } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { GRADIENT_STYLES, type GradientStyleType } from '../types/gradient'

/**
 * 渐变样式下拉菜单组件
 */
export const GradientDropdown = memo(() => {
  const editor = useBlockNoteEditor()
  const Components = useComponentsContext()!
  const selectedBlocks = useSelectedBlocks(editor)
  const [isOpen, setIsOpen] = useState(false)

  /** 检查是否选中了支持文本样式的块 */
  const shouldShow = useMemo(() => {
    if (selectedBlocks.length === 0)
      return false

    /** 检查是否选中了 Mermaid 块 */
    const hasMermaidBlock = selectedBlocks.some(block => (block as any).type === 'mermaid')
    if (hasMermaidBlock)
      return false

    /** 检查是否选中了支持文本样式的块 */
    const supportedTypes = ['paragraph', 'heading', 'bulletListItem', 'numberedListItem', 'checkListItem']
    return selectedBlocks.some(block => supportedTypes.includes(block.type))
  }, [selectedBlocks])

  if (!shouldShow) {
    return null
  }

  const gradientStyles = Object.entries(GRADIENT_STYLES) as [GradientStyleType, typeof GRADIENT_STYLES[GradientStyleType]][]

  return (
    <Popover
      trigger="click"
      position="bottom"
      clickOutsideToClose
      contentClassName="w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-0"
      onOpen={ () => setIsOpen(true) }
      onClose={ () => setIsOpen(false) }
      content={
        <div className="py-2 max-h-80 overflow-y-auto">
          { gradientStyles.map(([styleType, config]) => {
            const isActive = (editor.getActiveStyles() as any)[styleType]

            return (
              <button
                key={ styleType }
                onClick={ () => {
                  window.MDBridge?.command.setGradientStyle(styleType)
                } }
                className={ `w-full px-4 py-3 text-left text-sm transition-all duration-200 flex items-center gap-3 group ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }` }
              >
                <div
                  className={ `w-5 h-5 rounded-full border shadow-sm ${isActive
                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'border-gray-200 dark:border-gray-600'
                  }` }
                  style={ { background: config.gradient } }
                />
                <span className={ `group-hover:text-gray-900 dark:group-hover:text-gray-100 ${isActive
                  ? 'text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300'
                }` }>
                  { config.label }
                </span>
                { isActive && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                ) }
              </button>
            )
          }) }
        </div>
      }
    >
      <Components.FormattingToolbar.Button
        label="渐变样式"
        mainTooltip="渐变样式"
        icon={ <Palette size={ 16 } /> }
        className="relative"
      >
        <motion.div
          animate={ {
            rotate: isOpen
              ? 180
              : 0,
          } }
          transition={ { duration: 0.2 } }
          className="ml-1"
        >
          <ChevronDown size={ 12 } />
        </motion.div>
      </Components.FormattingToolbar.Button>
    </Popover>
  )
})

GradientDropdown.displayName = 'GradientDropdown'
