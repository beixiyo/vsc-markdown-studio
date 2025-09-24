/**
 * 光标选择接口测试
 * 测试光标位置、选择范围等操作
 * 使用方法：在浏览器 Console 中执行 runCursorSelectionTest()
 */

export async function runCursorSelectionTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('光标选择接口测试')

  MDTest.testCase(R, 'getTextCursorPosition() - 获取光标位置', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'paragraph', content: '测试文本' }])
    const cursorPos = MDBridge.getTextCursorPosition()
    return {
      hasPosition: cursorPos && typeof cursorPos === 'object',
    }
  }, { hasPosition: true })

  MDTest.testCase(R, 'setTextCursorPosition() - 设置光标位置', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'paragraph', content: '测试文本' }])
    const doc = MDBridge.getDocument()
    if (doc.length > 0) {
      MDBridge.setTextCursorPosition(doc[0].id, 'start')
      return { success: true }
    }
    return { success: false }
  }, { success: true })

  MDTest.testCase(R, 'getSelection() - 获取选择范围', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'paragraph', content: '测试文本' }])
    const selection = MDBridge.getSelection()
    return {
      hasSelection: selection === null || typeof selection === 'object',
    }
  })

  MDTest.testCase(R, 'setSelection() - 设置选择范围', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      { type: 'paragraph', content: '第一段' },
      { type: 'paragraph', content: '第二段' },
    ])
    const doc = MDBridge.getDocument()
    if (doc.length >= 2) {
      MDBridge.setSelection(doc[0].id, doc[1].id)
      return { success: true }
    }
    return { success: false }
  }, { success: true })

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runCursorSelectionTest = runCursorSelectionTest
}
