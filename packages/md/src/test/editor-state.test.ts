/**
 * 编辑器状态接口测试
 * 测试 focus, isEditable, setEditable, isEmpty 等状态相关功能
 * 使用方法：在浏览器 Console 中执行 runEditorStateTest()
 */

export async function runEditorStateTest() {
  const { MDTest } = window

  if (!MDTest) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('编辑器状态接口测试')

  MDTest.testCase(R, 'focus() - 聚焦编辑器', () => {
    MDTest.clearContent()
    window.MDBridge!.focus()
    return { success: true }
  }, { success: true })

  MDTest.testCase(R, 'isEditable() - 检查是否可编辑', () => {
    MDTest.clearContent()
    const isEditable = window.MDBridge!.isEditable()
    return {
      isBoolean: typeof isEditable === 'boolean',
    }
  }, { isBoolean: true })

  MDTest.testCase(R, 'setEditable() - 设置可编辑状态', () => {
    MDTest.clearContent()
    window.MDBridge!.setEditable(false)
    const isEditable1 = window.MDBridge!.isEditable()
    window.MDBridge!.setEditable(true)
    const isEditable2 = window.MDBridge!.isEditable()
    return {
      canSetFalse: isEditable1 === false,
      canSetTrue: isEditable2 === true,
    }
  }, { canSetFalse: true, canSetTrue: true })

  MDTest.testCase(R, 'isEmpty() - 检查是否为空', () => {
    MDTest.clearContent()
    const isEmpty1 = window.MDBridge!.isEmpty()
    window.MDBridge!.setContent([{ type: 'paragraph', content: '测试' }])
    const isEmpty2 = window.MDBridge!.isEmpty()
    return {
      isEmptyWhenEmpty: isEmpty1 === true,
      isNotEmptyWhenHasContent: isEmpty2 === false,
    }
  }, { isEmptyWhenEmpty: true, isNotEmptyWhenHasContent: true })

  MDTest.printSummary(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runEditorStateTest = runEditorStateTest
}
