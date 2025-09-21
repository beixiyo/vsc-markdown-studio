import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { memo } from 'react'
import { cn } from 'utils'

export const Header = memo<HeaderProps>((props) => {
  const {
    style,
    className,
    sidebarVisible,
    onToggleSidebar,
    titleCount,
  } = props

  return <div
    className={ cn(
      'flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 h-12',
      className,
    ) }
    style={ style }
  >
    <div className="flex items-center gap-4 pl-2">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Markdown Studio
      </h1>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        { titleCount }
        {' '}
        个标题
      </div>
      <button
        onClick={ onToggleSidebar }
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={ sidebarVisible
          ? '隐藏目录'
          : '显示目录' }
      >
        { sidebarVisible
          ? <PanelLeftClose className="w-5 h-5" />
          : <PanelLeftOpen className="w-5 h-5" /> }
      </button>
    </div>
  </div>
})

Header.displayName = 'Header'

export type HeaderProps = {
  sidebarVisible: boolean
  onToggleSidebar: () => void
  titleCount: number
} & React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
