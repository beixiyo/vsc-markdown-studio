import type { Editor } from '@tiptap/react'
import type { OperateTestSuite } from '@/features/operate-tests'
import { Button } from 'comps'
import { memo } from 'react'
import { useOperateTests } from '@/features/operate-tests/use-operate-tests'
import { TestSection } from './test-section'

/**
 * 批量操作用例测试区：运行全部 / 按套件运行
 */
export const OperateTestSection = memo<OperateTestSectionProps>(({ editor, suites }) => {
  const {
    operateRunning,
    runAllOperateTests,
    runOperateSuite,
  } = useOperateTests(editor, suites)

  const totalCases = suites.reduce((acc, suite) => acc + (suite.cases?.length ?? 0), 0)

  return (
    <TestSection title="批量用例" className="gap-2">
      <Button
        size="sm"
        className="w-full justify-between"
        disabled={ !editor || operateRunning || totalCases === 0 }
        onClick={ runAllOperateTests }
      >
        运行全部
        <span className="text-xs opacity-70">
          { totalCases }
          {' '}
          项
        </span>
      </Button>

      { suites.length === 0
        ? <p className="text-xs text-text2">暂无测试用例</p>
        : suites.map(suite => (
            <Button
              key={ suite.id }
              size="sm"
              variant="ghost"
              className="w-full justify-between"
              disabled={ !editor || operateRunning }
              onClick={ () => runOperateSuite(suite.id) }
            >
              { suite.title }
              <span className="text-xs text-text2">
                { suite.cases?.length ?? 0 }
                {' '}
                项
              </span>
            </Button>
          )) }
    </TestSection>
  )
})

OperateTestSection.displayName = 'OperateTestSection'

export type OperateTestSectionProps = {
  /** 编辑器实例 */
  editor: Editor | null
  /** 操作测试套件 */
  suites: OperateTestSuite[]
}
