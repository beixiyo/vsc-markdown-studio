/**
 * 块操作 自动化验收脚本（insert/update/remove/replace）
 * 使用方法：在浏览器 Console 中执行 runBlocksTest()
 */

export async function runBlocksTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('1. 插入新块')
  MDTest.testCase(R, '1.1 insertBlocks', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      { type: 'paragraph', content: '第一段' },
      { type: 'paragraph', content: '第二段' },
    ])
    const doc = MDBridge.getDocument()
    const firstId = doc[0].id
    const inserted = MDBridge.insertBlocks(
      [{ type: 'paragraph', content: '插入的段落' }],
      firstId,
      'after',
    )
    const newDoc = MDBridge.getDocument()
    return {
      insertedCount: inserted.length,
      newLength: newDoc.length,
    }
  })

  MDTest.logTitle('2. 更新块')
  MDTest.testCase(R, '2.1 updateBlock', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      { type: 'paragraph', content: '第一段' },
      { type: 'paragraph', content: '第二段' },
    ])
    const doc = MDBridge.getDocument()
    const secondId = doc[1].id
    const updated = MDBridge.updateBlock(secondId, {
      type: 'heading',
      content: '更新后的标题',
      props: { level: 2 },
    })
    return { updatedType: updated.type }
  })

  MDTest.logTitle('3. 删除块')
  MDTest.testCase(R, '3.1 removeBlocks', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      { type: 'paragraph', content: '第一段' },
      { type: 'paragraph', content: '第二段' },
      { type: 'paragraph', content: '第三段' },
    ])
    const doc = MDBridge.getDocument()
    const initial = doc.length
    const lastId = doc[doc.length - 2]?.id
    const removed = MDBridge.removeBlocks([lastId])
    const now = MDBridge.getDocument().length
    return { removedCount: removed.length, lengthReduced: now === initial - 1 }
  })

  MDTest.logTitle('4. 替换所有块')
  MDTest.testCase(R, '4.1 replaceBlocks', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      { type: 'paragraph', content: '旧内容1' },
      { type: 'paragraph', content: '旧内容2' },
    ])
    const allIds = MDBridge.getDocument().map((b: any) => b.id)
    const result = MDBridge.replaceBlocks(allIds, [
      { type: 'heading', content: '全新标题', props: { level: 1 } },
      { type: 'paragraph', content: '替换后的段落' },
    ])
    const newDoc = MDBridge.getDocument()
    return { insertedCount: result.insertedBlocks.length, removedCount: result.removedBlocks.length, newLength: newDoc.length }
  })

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ; (window as any).runBlocksTest = runBlocksTest
}
