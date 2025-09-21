/**
 * 样式 / 文本 / 链接 自动化验收脚本
 * 使用方法：在浏览器 Console 中执行 runStylesTextLinksTest()
 */

export async function runStylesTextLinksTest() {
  const { MDTest } = window

  if (!MDTest) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('1. 样式操作')
  MDTest.testCase(R, '1.1 getActiveStyles 类型', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([{ type: 'paragraph', content: '测试段落' }])
    const s = window.MDBridge!.getActiveStyles()
    return { ok: typeof s === 'object' && s !== null }
  }, { ok: true })

  MDTest.testCase(R, '1.2 addStyles', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([{ type: 'paragraph', content: '测试段落' }])
    window.MDBridge!.addStyles({ bold: true })
    return { success: true }
  })

  MDTest.testCase(R, '1.3 toggleStyles', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([{ type: 'paragraph', content: '测试段落' }])
    window.MDBridge!.toggleStyles({ italic: true })
    return { success: true }
  })

  MDTest.testCase(R, '1.4 removeStyles', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([{ type: 'paragraph', content: '测试段落' }])
    window.MDBridge!.removeStyles({ bold: true })
    return { success: true }
  })

  MDTest.logTitle('2. 文本操作')
  MDTest.testCase(R, '2.1 getSelectedText 类型', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([{ type: 'paragraph', content: '测试段落' }])
    const t = window.MDBridge!.getSelectedText()
    return { isString: typeof t === 'string' }
  }, { isString: true })

  MDTest.testCase(R, '2.2 insertText', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([{ type: 'paragraph', content: '测试段落' }])
    window.MDBridge!.insertText('自动测试插入的文本')
    return { success: true }
  })

  MDTest.logTitle('3. 链接操作')
  MDTest.testCase(R, '3.1 createLink', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([{ type: 'paragraph', content: '测试段落' }])
    window.MDBridge!.createLink('https://example.com', '测试链接')
    return { success: true }
  })

  MDTest.testCase(R, '3.2 getSelectedLinkUrl 类型', () => {
    const url = window.MDBridge!.getSelectedLinkUrl()
    return { ok: typeof url === 'string' || typeof url === 'undefined' }
  }, { ok: true })

  MDTest.printSummary(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runStylesTextLinksTest = runStylesTextLinksTest
}
