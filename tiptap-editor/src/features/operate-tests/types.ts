import type { Editor } from '@tiptap/core'
import type { MarkdownOperate } from 'tiptap-api'

export type OperateTestStatus = 'pending' | 'running' | 'success' | 'failed'

/**
 * 测试上下文，传递 editor 与 operate 对象，便于在测试中复用
 */
export type OperateTestContext = {
  editor: Editor | null
  operate: MarkdownOperate
}

/**
 * 测试日志条目，记录时间与文案
 */
export type OperateTestLog = {
  timestamp: number
  message: string
  level?: 'info' | 'warn' | 'error'
}

/**
 * 记录测试执行结果
 */
export type OperateTestResult = {
  id: string
  title: string
  status: OperateTestStatus
  logs: OperateTestLog[]
  startedAt: number
  finishedAt: number
  durationMs: number
  errorMessage?: string
}

/**
 * 单个测试用例定义
 */
export type OperateTestCase = {
  id: string
  title: string
  description?: string
  run: (
    context: OperateTestContext,
    logger: (message: string, level?: OperateTestLog['level']) => void
  ) => Promise<void> | void
  cleanup?: (context: OperateTestContext) => Promise<void> | void
}

/**
 * 测试套件，便于分组展示
 */
export type OperateTestSuite = {
  id: string
  title: string
  description?: string
  cases: OperateTestCase[]
}

/**
 * 执行器配置
 */
export type OperateTestRunnerOptions = {
  /**
   * 进度更新回调
   */
  onUpdate?: (result: OperateTestResult, index: number) => void
  /**
   * 在第一次用例失败后是否继续执行后续用例
   * @default false
   */
  continueOnFail?: boolean
}


