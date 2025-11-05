const SCROLL_THRESHOLD = 5 // 滚动阈值（像素）
const CLICK_MAX_TIME = 300 // 最大点击时间（毫秒）

/**
 * 设置清单项的事件监听器
 * @param container 容器元素
 * @param paragraph 文本段落元素
 * @param toggle 切换函数
 */
export function setupChecklistEvents(
  container: HTMLElement,
  paragraph: HTMLElement,
  toggle: () => void,
): void {
  /** 触摸状态 */
  const touchState: TouchState = {
    startY: 0,
    startX: 0,
    startTime: 0,
    hasScrolled: false,
  }

  /** 检查是否点击在文本编辑区域 */
  const isTextArea = (target: EventTarget | null): boolean => {
    return target === paragraph || paragraph.contains(target as Node)
  }

  /** 桌面端点击处理 */
  const handleDesktopClick = (e: Event) => {
    if (isTextArea(e.target))
      return
    e.preventDefault()
    e.stopPropagation()
    toggle()
  }

  /** 触摸开始 */
  const handleTouchStart = (e: TouchEvent) => {
    if (isTextArea(e.target))
      return
    const touch = e.touches[0]
    touchState.startY = touch.clientY
    touchState.startX = touch.clientX
    touchState.startTime = Date.now()
    touchState.hasScrolled = false
  }

  /** 触摸移动 */
  const handleTouchMove = (e: TouchEvent) => {
    if (!touchState.startTime)
      return
    const touch = e.touches[0]
    const deltaY = Math.abs(touch.clientY - touchState.startY)
    const deltaX = Math.abs(touch.clientX - touchState.startX)
    /** 如果移动距离超过阈值，认为是滚动意图 */
    if (deltaY > SCROLL_THRESHOLD || deltaX > SCROLL_THRESHOLD) {
      touchState.hasScrolled = true
    }
  }

  /** 触摸结束 */
  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchState.startTime)
      return
    const timeDiff = Date.now() - touchState.startTime

    /** 只有在没有滚动且时间足够短的情况下才触发切换 */
    if (!touchState.hasScrolled && timeDiff < CLICK_MAX_TIME) {
      if (isTextArea(e.target)) {
        touchState.startTime = 0
        return
      }
      e.preventDefault()
      e.stopPropagation()
      toggle()
    }

    /** 重置状态 */
    touchState.startTime = 0
    touchState.hasScrolled = false
  }

  /** 桌面端事件 */
  container.addEventListener('click', handleDesktopClick)
  container.addEventListener('mousedown', handleDesktopClick)

  /** 移动端触摸事件 */
  container.addEventListener('touchstart', handleTouchStart, { passive: true })
  container.addEventListener('touchmove', handleTouchMove, { passive: true })
  container.addEventListener('touchend', handleTouchEnd)
}

/**
 * 清单项事件处理
 * 区分点击和滚动，避免在移动端阻止滚动
 */
interface TouchState {
  startY: number
  startX: number
  startTime: number
  hasScrolled: boolean
}
