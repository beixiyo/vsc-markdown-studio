import type { OperateTestCase, OperateTestContext, OperateTestLog, OperateTestResult, OperateTestRunnerOptions } from './types'

const now = () => Date.now()

function createLogger(logs: OperateTestLog[]) {
  return (
    message: string,
    level: OperateTestLog['level'] = 'info',
  ) => {
    logs.push({
      level,
      message,
      timestamp: now(),
    })
  }
}

/**
 * 串行执行 operate 测试用例的执行器
 */
export class OperateTestExecutor {
  private running = false

  /**
   * 输出单个用例的控制台日志
   */
  private printResult(
    result: OperateTestResult,
    index: number,
  ) {
    const indexLabel = `#${index + 1}`
    const statusLabel = result.status === 'success'
      ? '✅ 成功'
      : result.status === 'failed'
        ? '❌ 失败'
        : '⏳ 运行中'
    const durationLabel = `${result.durationMs}ms`
    const errorPart = result.errorMessage
      ? ` | 错误：${result.errorMessage}`
      : ''
    console.info(`[operate-test] ${indexLabel} ${result.id} ${statusLabel} (${durationLabel})${errorPart}`)
  }

  /**
   * 串行执行所有用例
   */
  async runAll(
    cases: OperateTestCase[],
    context: OperateTestContext,
    options: OperateTestRunnerOptions = {},
  ): Promise<OperateTestResult[]> {
    if (this.running) {
      throw new Error('测试执行中，请勿重复触发')
    }

    this.running = true
    const results: OperateTestResult[] = []

    try {
      for (let index = 0; index < cases.length; index += 1) {
        const testCase = cases[index]
        const result = await this.runSingle(testCase, context)
        results.push(result)
        options.onUpdate?.(result, index)
        this.printResult(result, index)

        if (result.status === 'failed' && !options.continueOnFail) {
          break
        }
      }

      return results
    }
    finally {
      this.running = false
    }
  }

  /**
   * 执行单个用例
   */
  async runSingle(
    testCase: OperateTestCase,
    context: OperateTestContext,
  ): Promise<OperateTestResult> {
    const startedAt = now()
    const logs: OperateTestLog[] = []
    const log = createLogger(logs)

    let status: OperateTestResult['status'] = 'running'
    let errorMessage: string | undefined

    try {
      await testCase.run(context, log)
      status = 'success'
    }
    catch (error) {
      status = 'failed'
      errorMessage = error instanceof Error
        ? error.message
        : '未知错误'
      log(errorMessage, 'error')
    }
    finally {
      try {
        await testCase.cleanup?.(context)
      }
      catch (cleanupError) {
        log(
          cleanupError instanceof Error
            ? cleanupError.message
            : '清理阶段出现未知错误',
          'warn',
        )
      }
    }

    const finishedAt = now()

    return {
      id: testCase.id,
      title: testCase.title,
      status,
      logs,
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      errorMessage,
    }
  }
}

export const operateTestExecutor = new OperateTestExecutor()
