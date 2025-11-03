/**
 * 嵌套与移动 自动化验收脚本（nest/unnest/moveUp/moveDown）
 * 使用方法：在浏览器 Console 中执行 runNestingMoveTest()
 */

export async function runNestingMoveTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('1. 嵌套能力')
  MDTest.testCase(R, '1.1 canNestBlock 类型', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      { type: 'paragraph', content: '第一段' },
      { type: 'paragraph', content: '第二段' },
    ])
    const v = MDBridge.canNestBlock()
    return { isBoolean: typeof v === 'boolean' }
  }, { isBoolean: true })

  MDTest.testCase(R, '1.2 nestBlock 执行', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      { type: 'paragraph', content: '第一段' },
      { type: 'paragraph', content: '第二段' },
    ])
    MDBridge.nestBlock()
    return { success: true }
  })

  MDTest.testCase(R, '1.3 canUnnestBlock 类型', () => {
    const v = MDBridge.canUnnestBlock()
    return { isBoolean: typeof v === 'boolean' }
  }, { isBoolean: true })

  MDTest.testCase(R, '1.4 unnestBlock 执行', () => {
    MDBridge.unnestBlock()
    return { success: true }
  })

  MDTest.logTitle('2. 块移动')
  MDTest.testCase(R, '2.1 moveBlocksUp()', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      { type: 'paragraph', content: '第一段' },
      { type: 'paragraph', content: '第二段' },
    ])
    MDBridge.moveBlocksUp()
    return { success: true }
  })

  MDTest.testCase(R, '2.2 moveBlocksDown()', () => {
    MDBridge.moveBlocksDown()
    return { success: true }
  })

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runNestingMoveTest = runNestingMoveTest
}
