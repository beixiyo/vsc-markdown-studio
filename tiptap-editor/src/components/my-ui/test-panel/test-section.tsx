import { memo } from 'react'
import { cn } from 'utils'

/**
 * 测试面板内的分区块：小标题 + flex-wrap 按钮容器
 */
export const TestSection = memo<TestSectionProps>((props) => {
  const {
    title,
    className,
    children,
  } = props

  return (
    <section className={ cn('flex flex-col gap-1.5', className) }>
      <h4 className="text-xs font-medium text-text2">{ title }</h4>
      <div className="flex flex-wrap items-center gap-1.5">{ children }</div>
    </section>
  )
})

TestSection.displayName = 'TestSection'

export type TestSectionProps = {
  /** 分区标题 */
  title: string
}
& React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>
