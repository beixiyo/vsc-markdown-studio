/**
 * 文档与转换 自动化验收脚本（getDocument / getHTML / setHTML）
 * 使用方法：在浏览器 Console 中执行 runDocumentTest()
 */

export async function runDocumentTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('1. getDocument 基础校验')
  MDTest.testCase(R, '1.1 初始文档快照', () => {
    const doc = MDBridge.getDocument()
    return { isArray: Array.isArray(doc) }
  }, { isArray: true })

  MDTest.logTitle('2. HTML 互操作')
  MDTest.testCase(R, '2.1 setHTML + getDocument', () => {
    MDTest.clearContent()
    MDBridge.setHTML('<h2>HTML测试标题</h2><p>HTML测试段落</p>')
    const doc = MDBridge.getDocument()
    return {
      length: doc.length,
      hasHeading: doc.some((b: any) => b.type === 'heading'),
    }
  })

  MDTest.testCase(R, '2.2 getHTML 类型与非空', () => {
    const html = MDBridge.getHTML()
    return { isString: typeof html === 'string', hasContent: html.length > 0 }
  })

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runDocumentTest = runDocumentTest
}
