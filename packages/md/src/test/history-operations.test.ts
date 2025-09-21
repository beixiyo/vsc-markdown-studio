/**
 * 历史操作接口测试
 * 测试 undo, redo 等历史相关功能
 * 使用方法：在浏览器 Console 中执行 runHistoryOperationsTest()
 */

export async function runHistoryOperationsTest() {
  const { MDTest } = window

  if (!MDTest) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('历史操作接口测试')

  MDTest.testCase(R, 'undo() - 撤销操作', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([{ type: 'paragraph', content: '原始内容' }])
    window.MDBridge!.setContent([{ type: 'paragraph', content: '修改后内容' }])
    const canUndo = window.MDBridge!.undo()
    return {
      canUndo: typeof canUndo === 'boolean',
    }
  }, { canUndo: true })

  MDTest.testCase(R, 'redo() - 重做操作', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([{ type: 'paragraph', content: '原始内容' }])
    window.MDBridge!.setContent([{ type: 'paragraph', content: '修改后内容' }])
    window.MDBridge!.undo()
    const canRedo = window.MDBridge!.redo()
    return {
      canRedo: typeof canRedo === 'boolean',
    }
  }, { canRedo: true })

  MDTest.printSummary(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runHistoryOperationsTest = runHistoryOperationsTest
}
