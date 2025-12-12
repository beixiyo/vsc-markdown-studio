import type { OperateTestCase, OperateTestSuite } from './types'
import { defaultOperateSuites } from './suites'

/**
 * 统一注册所有内置用例，后续按需填充
 */
export const operateTestSuites: OperateTestSuite[] = [...defaultOperateSuites]

/**
 * 扁平化获取所有用例，便于执行器直接使用
 */
export function collectOperateTestCases(suites: OperateTestSuite[]): OperateTestCase[] {
  return suites.flatMap(suite => suite.cases)
}


