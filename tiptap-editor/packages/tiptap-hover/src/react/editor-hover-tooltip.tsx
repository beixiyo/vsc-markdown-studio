import { memo } from 'react'

import { HoverTooltip } from './hover-tooltip'
import type { EditorHoverTooltipProps } from './types'
import { useEditorHoverTooltip } from './use-editor-hover-tooltip'

/**
 * 仅展示 Hover 探测结果的 Tooltip，不负责编辑器内高亮（高亮由 HoverContextHighlight 扩展在插件 view 中同步）
 */
export const EditorHoverTooltip = memo((props: EditorHoverTooltipProps) => {
  const {
    enabled = true,
    offsetDistance = 8,
    placement = 'top-start',
  } = props

  const { formattedContent, mousePosition } = useEditorHoverTooltip(props)

  return (
    <HoverTooltip
      enabled={ enabled }
      content={ formattedContent }
      mousePosition={ mousePosition }
      offsetDistance={ offsetDistance }
      placement={ placement }
    />
  )
})

EditorHoverTooltip.displayName = 'EditorHoverTooltip'
