/* eslint-disable no-console */
/**
 * 统一测试工具，挂载到 window.MDTest
 * - 只关心：构造用例数据 → 调用统一断言函数
 * - 兼容同步/异步用例
 */

export { runAITest } from './ai.test'
export { runBlockClickTest } from './block-click.test'
export { runBlockDetectionTest } from './block-detection.test'
export { runBlockHoverTest as runHeadingHoverTest } from './block-hover.test'
export { runBlockSelectionTest } from './block-selection.test'
export { runBlocksTest } from './blocks.test'
export { runCommandsTest } from './commands.test'
export { runContentTest } from './content.test'
export { runCursorSelectionTest } from './cursor-selection.test'
export { runDocumentTest } from './document.test'
export { runEditorStateTest } from './editor-state.test'
export { runEventsTest } from './events.test'
export { runHistoryOperationsTest } from './history-operations.test'
export { runImgTest } from './img.test'
export { runLinkOperationsTest } from './link-operations.test'
export { runMermaidTest } from './mermaid.test'
export { runNestingMoveTest } from './nesting-move.test'
export { runSpeakerTest } from './speaker.test'
export { runStateSelectionHistoryTest } from './state-selection-history.test'
export { runStylesTextLinksTest } from './styles-text-links.test'
export { runTextOperationsTest } from './text-operations.test'
export { runUIShowcaseTest } from './ui-showcase.test'

export function loadTestTools() {
  function createResults(): TestResults {
    return { total: 0, passed: 0, failed: 0, errors: [] }
  }

  /** 清空内容的辅助函数 */
  function clearContent() {
    MDBridge?.setContent([{ type: 'paragraph', content: '' }])
  }

  function deepEqual(a: any, b: any): boolean {
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    }
    catch {
      return a === b
    }
  }

  function logTitle(title: string) {
    /** 统一风格的分节标题 */
    console.log(`\n=== ${title} ===`)
  }

  function delay(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms))
  }

  async function waitForBridge(predicate: (w: Window & typeof globalThis) => boolean, timeoutMs = 5000) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      try {
        if (predicate(window))
          return true
      }
      catch { }
      await delay(50)
    }
    return false
  }

  function testCase(results: TestResults, name: string, fn: TestCaseFn, expected?: any) {
    results.total++
    try {
      const r = fn()
      if (typeof expected !== 'undefined') {
        if (deepEqual(r, expected)) {
          results.passed++
          console.log(`✅ ${name}`)
        }
        else {
          results.failed++
          results.errors.push(`${name}: 结果不匹配`)
          console.log(`❌ ${name} - 结果不匹配`)
          console.log('预期:', expected)
          console.log('实际:', r)
        }
      }
      else {
        results.passed++
        console.log(`✅ ${name}`)
        console.log('结果:', r)
      }
    }
    catch (e: any) {
      results.failed++
      results.errors.push(`${name}: ${e?.message || 'Unknown Error'}`)
      console.log(`❌ ${name} - 出错:`, e?.message || e)
    }
  }

  async function asyncTestCase(results: TestResults, name: string, fn: AsyncTestCaseFn, expected?: any) {
    results.total++
    try {
      const r = await fn()
      if (typeof expected !== 'undefined') {
        if (deepEqual(r, expected)) {
          results.passed++
          console.log(`✅ ${name}`)
        }
        else {
          results.failed++
          results.errors.push(`${name}: 结果不匹配`)
          console.log(`❌ ${name} - 结果不匹配`)
          console.log('预期:', expected)
          console.log('实际:', r)
        }
      }
      else {
        results.passed++
        console.log(`✅ ${name}`)
        console.log('结果:', r)
      }
    }
    catch (e: any) {
      results.failed++
      results.errors.push(`${name}: ${e?.message || 'Unknown Error'}`)
      console.log(`❌ ${name} - 出错:`, e?.message || e)
    }
  }

  function printSummary(results: TestResults) {
    console.log('\n📊 测试结果汇总')
    console.log('='.repeat(50))
    console.log(`总测试数: ${results.total}`)

    if (results.failed > 0 || results.passed !== results.total) {
      console.log(`✅ 通过: ${results.passed}`)
      console.log(`❌ 失败: ${results.failed}`)
      console.log(`📈 通过率: ${results.total
        ? ((results.passed / results.total) * 100).toFixed(1)
        : '0.0'}%`)

      if (results.errors.length) {
        console.log('\n❌ 错误详情:')
        results.errors.forEach((err, i) => {
          console.log(`${i + 1}. ${err}`)
        })
      }
    }
    else {
      console.log(`🎉 全部通过: ${results.passed}/${results.total}`)
      console.log('✨ 测试成功，所有功能正常！')
    }
  }

  function finalizeTest(results: TestResults) {
    if (results.failed > 0) {
      // On failure, throw an error with details and DO NOT print summary here.
      const errorDetails = results.errors.map((err, i) => `${i + 1}. ${err}`).join('\n')
      const summary = `总测试数: ${results.total}, 通过: ${results.passed}, 失败: ${results.failed}`
      throw new Error(`\n📊 测试结果汇总\n==================================================\n${summary}\n\n❌ 错误详情:\n${errorDetails}`)
    }
    else {
      // On success, print the summary.
      printSummary(results)
    }
  }

  const TestKit = {
    createResults,
    deepEqual,
    logTitle,
    delay,
    waitForBridge,
    testCase,
    asyncTestCase,
    finalizeTest,
    clearContent,
    std: {
      waitForMDBridge: (timeoutMs?: number) => waitForBridge(w => !!w.MDBridge, timeoutMs),
      waitForBlockNoteBridge: (timeoutMs?: number) => waitForBridge(w => !!w.MDBridge, timeoutMs),
    },
  }

  /** 挂到 window，便于在 Console 中直接使用 */
  window.MDTest = TestKit
}

type TestResults = {
  total: number
  passed: number
  failed: number
  errors: string[]
}

type TestCaseFn = () => any
type AsyncTestCaseFn = () => Promise<any>
