/**
 * Speaker 功能 自动化验收脚本
 * 测试 Speaker 内联内容的解析、显示和点击功能
 * 使用方法：在浏览器 Console 中执行 runSpeakerTest()
 */

import type { SpeakerType } from 'custom-blocknote-speaker'

export async function runSpeakerTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()
  const { delay } = window.MDTest

  /** 测试数据 */
  const testSpeakers: SpeakerType[] = [
    { originalLabel: 0, name: 'Bob', id: 69 },
    { originalLabel: 1, name: 'Alice', id: 98 },
  ]

  MDTest.logTitle('1. Speaker 数据格式验证')
  MDTest.testCase(R, '1.1 Speaker 数据格式正确', () => {
    const speaker = testSpeakers[0]
    return {
      hasOriginalLabel: typeof speaker.originalLabel === 'number',
      hasName: typeof speaker.name === 'string',
      hasOptionalId: 'id' in speaker,
    }
  }, { hasOriginalLabel: true, hasName: true, hasOptionalId: true })

  MDTest.logTitle('2. Markdown 解析测试')

  /** 测试内容，包含 speaker 标签 */
  const testContent = `这是一段包含 [speaker:0] 和 [speaker:1] 的测试内容。

[speaker:0] 说：这是第一段话。

[speaker:1] 说：这是第二段话。

还有一段普通文本，没有 speaker 标签。`

  await MDTest.asyncTestCase(R, '2.1 使用 setContentWithSpeakers 设置内容和 speakers', async () => {
    await MDBridge.setContentWithSpeakers({
      content: testContent,
      speakers: testSpeakers,
    })
    await delay(50) // 等待渲染
    return '内容已设置'
  }, '内容已设置')

  await MDTest.asyncTestCase(R, '2.2 验证 Speaker 内联节点已正确插入', async () => {
    const doc = MDBridge.getDocument() as any[]
    const count = doc.flatMap(b => b.content || [])
      .filter((c: any) => c && c.type === 'speaker')
      .length
    return count > 0
  }, true)

  MDTest.logTitle('3. setSpeakers 单独设置测试')

  /** 先设置没有 speakers 的内容 */
  const contentWithoutSpeakers = `这是一段包含 [speaker:0] 和 [speaker:1] 的测试内容，但还没有设置 speakers。`
  await MDTest.asyncTestCase(R, '3.1 先设置不含 speakers 的内容', async () => {
    MDBridge.setMarkdown(contentWithoutSpeakers)
    await delay(50)
    return '内容已设置'
  }, '内容已设置')

  await MDTest.asyncTestCase(R, '3.2 使用 setSpeakers 设置 speakers，应该自动处理现有内容', async () => {
    await MDBridge.setSpeakers(testSpeakers)
    await delay(50)
    return 'Speakers 已设置'
  }, 'Speakers 已设置')

  await MDTest.asyncTestCase(R, '3.3 验证现有内容中的 speaker 标签已被处理', async () => {
    const doc = MDBridge.getDocument() as any[]
    const count = doc.flatMap(b => b.content || [])
      .filter((c: any) => c && c.type === 'speaker')
      .length
    return count > 0
  }, true)

  MDTest.logTitle('4. UI 展示测试')

  /** 创建一个更丰富的测试内容用于 UI 展示 */
  const uiContent = `# Speaker 功能展示

这是一个 Speaker 功能的完整展示页面。

## 基本用法

[speaker:0] 说：这是第一个说话人的内容。

[speaker:1] 说：这是第二个说话人的内容。

## 混合内容

这是一段普通文本，然后 [speaker:0] 在中间插入了一个 speaker 标签，然后是更多文本。

**加粗文本** 和 [speaker:1] 的组合。

## 列表中的 Speaker

1. 第一项，[speaker:0] 在这里
2. 第二项，[speaker:1] 在这里
3. 第三项，普通文本

## 嵌套内容

- 列表项 1
  - 嵌套项，[speaker:0] 在这里
  - 嵌套项，[speaker:1] 在这里`

  await MDTest.asyncTestCase(R, '4.1 设置完整的 UI 展示内容', async () => {
    await MDBridge.setContentWithSpeakers({
      content: uiContent,
      speakers: testSpeakers,
    })
    await delay(50) // 等待渲染
    return 'UI 展示内容已设置'
  }, 'UI 展示内容已设置')

  await MDTest.asyncTestCase(R, '4.2 验证文档包含多个 Speaker', async () => {
    const doc = MDBridge.getDocument() as any[]
    const count = doc.flatMap(b => b.content || [])
      .filter((c: any) => c && c.type === 'speaker')
      .length
    return count >= 4
  }, true)

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ; (window as any).runSpeakerTest = runSpeakerTest
}
