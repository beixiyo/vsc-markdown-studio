/**
 * AI 功能测试
 * 测试 AI 扩展的各种功能，包括菜单打开、LLM 调用、建议接受/拒绝等
 */

import { getAIExtension } from 'custom-blocknote-ai'

export async function runAITest() {
  const { createResults, asyncTestCase, finalizeTest, clearContent, delay, logTitle } = window.MDTest

  const results = createResults()
  logTitle('AI 功能测试')

  /** 清空内容，准备测试环境 */
  clearContent()

  /** 等待 MDBridge 准备就绪 */
  await window.MDTest.std.waitForMDBridge()

  /** 获取 AI 扩展实例 */
  let aiExtension: any = null
  try {
    aiExtension = getAIExtension(MDBridge.editor)
  }
  catch (error) {
    console.error('无法获取 AI 扩展实例:', error)
    return
  }

  /** 测试 1: 检查初始 AI 菜单状态 */
  await asyncTestCase(results, '检查初始 AI 菜单状态', async () => {
    const state = aiExtension.state.aiMenuState
    return state === 'closed'
      ? 'closed'
      : 'open'
  }, 'closed')

  /** 测试 2: 设置测试内容 */
  await asyncTestCase(results, '设置测试内容', async () => {
    MDBridge.setContent([
      { type: 'paragraph', content: '这是一个测试段落，用于 AI 功能测试。' },
      { type: 'heading', props: { level: 2 }, content: '测试标题' },
      { type: 'paragraph', content: '另一个段落内容。' },
    ])
    const doc = MDBridge.getDocument()
    return doc.length >= 3
      ? 'success'
      : 'failed'
  }, 'success')

  /** 测试 3: 打开 AI 菜单 */
  await asyncTestCase(results, '打开 AI 菜单', async () => {
    const firstBlock = MDBridge.getDocument()[0]
    aiExtension.openAIMenuAtBlock(firstBlock.id)

    /** 等待菜单打开 */
    await delay(100)

    const state = aiExtension.state.aiMenuState
    return state === 'closed'
      ? 'closed'
      : 'open'
  }, 'open')

  /** 测试 4: 调用 LLM 生成内容 */
  await asyncTestCase(results, '调用 LLM 生成内容', async () => {
    try {
      await aiExtension.callLLM('请为这个段落添加一些有趣的描述')

      /** 等待 AI 响应 */
      await delay(2000)

      const state = aiExtension.state.aiMenuState
      return state === 'closed'
        ? 'closed'
        : 'open'
    }
    catch (error) {
      console.warn('LLM 调用可能失败，这是正常的（如果没有配置真实的 AI 服务）')
      return 'error'
    }
  })

  /** 测试 5: 关闭 AI 菜单 */
  await asyncTestCase(results, '关闭 AI 菜单', async () => {
    aiExtension.closeAIMenu()
    await delay(100)

    const state = aiExtension.state.aiMenuState
    return state === 'closed'
      ? 'closed'
      : 'open'
  }, 'closed')

  /** 测试 6: 重新打开菜单并测试接受更改 */
  await asyncTestCase(results, '重新打开菜单并测试接受更改', async () => {
    const firstBlock = MDBridge.getDocument()[0]
    aiExtension.openAIMenuAtBlock(firstBlock.id)
    await delay(100)

    try {
      await aiExtension.callLLM('请优化这个文本')
      await delay(2000)

      /** 尝试接受更改 */
      await aiExtension.acceptChanges()
      await delay(500)

      return 'success'
    }
    catch (error) {
      console.warn('接受更改可能失败，这是正常的（如果没有配置真实的 AI 服务）')
      return 'error'
    }
  })

  /** 测试 7: 测试拒绝更改 */
  await asyncTestCase(results, '测试拒绝更改', async () => {
    const secondBlock = MDBridge.getDocument()[1]
    aiExtension.openAIMenuAtBlock(secondBlock.id)
    await delay(100)

    try {
      await aiExtension.callLLM('请修改这个标题')
      await delay(2000)

      /** 拒绝更改 */
      aiExtension.rejectChanges()
      await delay(500)

      const state = aiExtension.state.aiMenuState
      return state === 'closed'
        ? 'closed'
        : 'open'
    }
    catch (error) {
      console.warn('拒绝更改可能失败，这是正常的（如果没有配置真实的 AI 服务）')
      return 'error'
    }
  })

  /** 测试 8: 验证菜单最终状态 */
  await asyncTestCase(results, '验证菜单最终状态', async () => {
    aiExtension.closeAIMenu()
    await delay(100)

    const state = aiExtension.state.aiMenuState
    return state === 'closed'
      ? 'closed'
      : 'open'
  }, 'closed')

  /** 测试 9: 测试错误处理 */
  await asyncTestCase(results, '测试错误处理', async () => {
    try {
      /** 尝试在无效的块 ID 上打开菜单 */
      aiExtension.openAIMenuAtBlock('invalid-block-id')
      return 'handled'
    }
    catch (error) {
      return 'error'
    }
  })

  /** 测试 10: 测试多次快速操作 */
  await asyncTestCase(results, '测试多次快速操作', async () => {
    const firstBlock = MDBridge.getDocument()[0]

    /** 快速打开和关闭菜单 */
    aiExtension.openAIMenuAtBlock(firstBlock.id)
    await delay(100)
    await aiExtension.closeAIMenu() // 等待异步关闭完成
    await delay(100)
    aiExtension.openAIMenuAtBlock(firstBlock.id)
    await delay(100)
    await aiExtension.closeAIMenu() // 等待异步关闭完成
    await delay(100) // 增加等待时间确保状态更新

    const state = aiExtension.state.aiMenuState
    return state === 'closed'
      ? 'closed'
      : 'open'
  }, 'closed')

  finalizeTest(results)
}
