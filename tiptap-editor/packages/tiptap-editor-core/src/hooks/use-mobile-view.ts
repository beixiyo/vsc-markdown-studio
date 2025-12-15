import { useEffect, useState } from 'react'

/**
 * 移动端工具栏视图类型
 */
export type MobileView = 'main' | 'highlighter' | 'link'

/**
 * 管理移动端工具栏视图切换，当视口切换为桌面端时自动恢复主视图
 */
export function useMobileView(isMobile: boolean) {
  const [mobileView, setMobileView] = useState<MobileView>('main')

  useEffect(() => {
    if (!isMobile && mobileView !== 'main') {
      setMobileView('main')
    }
  }, [isMobile, mobileView])

  return {
    mobileView,
    setMobileView,
  }
}
