import type { Editor as TiptapEditor } from '@tiptap/core'
import { useCallback, useMemo, useState } from 'react'
import { createMarkdownOperate } from 'tiptap-api'
import { collectOperateTestCases, operateTestExecutor, type OperateTestSuite } from '../../features/operate-tests'

/**
 * operate 测试运行状态与触发方法
 */
export type UseOperateTestsResult = {
  /**
   * 是否正在运行测试
   */
  operateRunning: boolean
  /**
   * 运行所有测试套件
   */
  runAllOperateTests: () => Promise<void>
  /**
   * 按套件 ID 运行单个测试套件
   */
  runOperateSuite: (suiteId: string) => Promise<void>
}

/**
 * 封装 operate 测试运行逻辑
 */
export function useOperateTests(
  editor: TiptapEditor | null,
  operateTestSuites: OperateTestSuite[],
): UseOperateTestsResult {
  const operate = useMemo(() => createMarkdownOperate(editor), [editor])
  const [operateRunning, setOperateRunning] = useState(false)

  const runAllOperateTests = useCallback(async () => {
    if (!editor)
      return
    setOperateRunning(true)
    try {
      const cases = collectOperateTestCases(operateTestSuites)
      await operateTestExecutor.runAll(cases, { editor, operate })
    }
    finally {
      setOperateRunning(false)
    }
  }, [editor, operate, operateTestSuites])

  const runOperateSuite = useCallback(async (suiteId: string) => {
    if (!editor)
      return
    const suite = operateTestSuites.find(item => item.id === suiteId)
    if (!suite)
      return
    setOperateRunning(true)
    try {
      await operateTestExecutor.runAll(suite.cases, { editor, operate })
    }
    finally {
      setOperateRunning(false)
    }
  }, [editor, operate, operateTestSuites])

  return {
    operateRunning,
    runAllOperateTests,
    runOperateSuite,
  }
}
