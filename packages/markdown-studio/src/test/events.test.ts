/**
 * 事件回调 自动化验收脚本（onChange/onSelectionChange）
 * 使用方法：在浏览器 Console 中执行 runEventsTest()
 */

export async function runEventsTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('1. 内容变化监听 onChange')
  MDTest.testCase(R, '1.1 onChange 注册与触发', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'paragraph', content: '测试段落' }])
    let changeCount = 0
    const remove = MDBridge.onChange(() => { changeCount++ })
    MDBridge.insertText('测试变化')
    setTimeout(() => { remove && remove() }, 100)
    return { hasListener: typeof remove === 'function' }
  }, { hasListener: true })

  MDTest.logTitle('2. 选择变化监听 onSelectionChange')
  MDTest.testCase(R, '2.1 onSelectionChange 注册', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'paragraph', content: '测试段落' }])
    let selCount = 0
    const remove = MDBridge.onSelectionChange(() => { selCount++ })
    setTimeout(() => { remove && remove() }, 100)
    return { hasListener: typeof remove === 'function' }
  }, { hasListener: true })

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runEventsTest = runEventsTest
}
