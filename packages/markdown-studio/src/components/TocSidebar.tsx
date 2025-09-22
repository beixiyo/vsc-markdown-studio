import type { TocSection } from '../hooks/useToc'
import { Dropdown, type DropdownSection } from 'comps'
import { memo } from 'react'
import { cn } from 'utils'

export const TocSidebar = memo<TocSidebarProps>(({
  tocSections,
  currentBlockId,
  onItemClick,
  className,
}) => {
  /** 将 TocSection 转换为 Dropdown 组件需要的格式 */
  const dropdownItems: DropdownSection[] = tocSections.map(section => ({
    name: section.name,
    items: section.items.map(item => ({
      id: item.id,
      customContent: (
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center min-w-0 gap-2">
            <div
              className={ cn(
                'w-1 h-4 rounded-full transition-colors duration-200 flex-shrink-0',
                currentBlockId === item.blockId
                  ? 'bg-blue-500'
                  : 'bg-transparent',
              ) }
            />
            <div
              className={ cn(
                'truncate text-sm font-medium transition-colors duration-200',
                currentBlockId === item.blockId
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-900 dark:text-gray-100',
              ) }
              style={ { paddingLeft: `${(item.level - 1) * 12}px` } }
            >
              { item.text }
            </div>
          </div>
          <span className={ cn(
            'text-xs font-medium px-1.5 py-0.5 rounded-md',
            getTagColor(item.level),
          ) }>
            H
            { item.level }
          </span>
        </div>
      ),
    })),
  }))

  return (
    <div className={ cn('bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700', className) }>
      <Dropdown
        key={ dropdownItems.length }
        items={ dropdownItems }
        selectedId={ currentBlockId
          ? `heading-${currentBlockId}`
          : null }
        onClick={ onItemClick }
        accordion={ false }
        className="flex-1 overflow-y-auto"
        itemClassName="border-b border-gray-100 dark:border-gray-700 last:border-b-0"
        sectionHeaderClassName="truncate text-sm font-medium text-gray-700 dark:text-gray-300"
        itemActiveClassName="bg-blue-50 dark:bg-blue-500/10"
        itemInactiveClassName="hover:bg-gray-50 dark:hover:bg-gray-700/50"
      />
    </div>
  )
})

TocSidebar.displayName = 'TocSidebar'

export type TocSidebarProps = {
  /** 目录分组数据 */
  tocSections: TocSection[]
  /** 当前选中的块 ID */
  currentBlockId: string | null
  /** 点击项目时的回调 */
  onItemClick?: (id: string) => void
  /** 自定义样式类 */
  className?: string
}

/**
 * 根据标题级别获取标签颜色
 */
function getTagColor(level: number): string {
  const colors = [
    'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400', // H1
    'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400', // H2
    'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400', // H3
    'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400', // H4
    'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400', // H5
    'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400', // H6
  ]

  return colors[Math.min(level - 1, colors.length - 1)] || colors[0]
}
