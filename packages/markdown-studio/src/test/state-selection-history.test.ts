/**
 * 状态 / 选区 / 历史 自动化验收脚本
 * 使用方法：在浏览器 Console 中执行 runStateSelectionHistoryTest()
 */

export async function runStateSelectionHistoryTest() {
  const { MDTest } = window

  if (!MDTest) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('1. 编辑器状态')
  MDTest.testCase(R, '1.1 isEditable 类型', () => {
    const v = window.MDBridge!.isEditable()
    return { isBoolean: typeof v === 'boolean' }
  }, { isBoolean: true })

  MDTest.testCase(R, '1.2 setEditable 往返', () => {
    const orig = window.MDBridge!.isEditable()
    window.MDBridge!.setEditable(false)
    const locked = window.MDBridge!.isEditable()
    window.MDBridge!.setEditable(true)
    const restored = window.MDBridge!.isEditable()
    return { changedCorrectly: locked !== orig, restored }
  })

  MDTest.testCase(R, '1.3 isEmpty 类型', () => {
    MDTest.clearContent()
    const v = window.MDBridge!.isEmpty()
    return { isBoolean: typeof v === 'boolean' }
  }, { isBoolean: true })

  MDTest.logTitle('2. 光标与选区')
  MDTest.testCase(R, '2.1 getTextCursorPosition 基本', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([{ type: 'paragraph', content: '测试段落' }])
    const pos = window.MDBridge!.getTextCursorPosition()
    return { hasBlock: !!pos && !!pos.block }
  })

  MDTest.testCase(R, '2.2 setTextCursorPosition 到首块', () => {
    const doc = window.MDBridge!.getDocument()
    if (doc.length === 0)
      return { success: false }
    window.MDBridge!.setTextCursorPosition(doc[0].id, 'start')
    return { success: true }
  })

  MDTest.testCase(R, '2.3 getSelection 类型', () => {
    const s = window.MDBridge!.getSelection()
    return { ok: s === null || typeof s === 'object' }
  })

  MDTest.logTitle('3. 历史操作')
  MDTest.testCase(R, '3.1 undo / redo 布尔返回', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([{ type: 'paragraph', content: '测试段落' }])
    window.MDBridge!.insertText('要撤销的文本')
    const u = window.MDBridge!.undo()
    const r = window.MDBridge!.redo()
    return { undoBool: typeof u === 'boolean', redoBool: typeof r === 'boolean' }
  })

  MDTest.printSummary(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runStateSelectionHistoryTest = runStateSelectionHistoryTest
}
