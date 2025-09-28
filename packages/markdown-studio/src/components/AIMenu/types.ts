import type { CSSProperties, HTMLAttributes, PropsWithChildren } from 'react'

export type MyAIMenuProps = {
  /**
   * 菜单额外 className 控制外观
   */
  className?: string
  /**
   * 菜单内联样式
   */
  style?: CSSProperties
}
& PropsWithChildren<HTMLAttributes<HTMLElement>>
