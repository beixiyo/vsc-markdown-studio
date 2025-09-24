/**
 * 文本操作接口测试
 * 测试 getSelectedText, insertText 等文本相关功能
 * 使用方法：在浏览器 Console 中执行 runTextOperationsTest()
 */

export async function runTextOperationsTest() {
  if (!MDTest) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('文本操作接口测试')

  MDTest.testCase(R, 'getSelectedText() - 获取选中文本', () => {
    MDTest.clearContent()
    /** 创建两个段落，这样我们可以用 setSelection 选中它们 */
    MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '第一段文本' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '第二段文本' }],
      },
    ])

    /** 先选中文本，然后获取选中内容 */
    const doc = MDBridge!.getDocument()
    console.log('🔍 调试信息:')
    console.log('- 文档内容:', doc)
    console.log('- 文档长度:', doc.length)

    if (doc.length >= 2) {
      /**
       * 使用 setSelection 来选中两个不同的块
       * 根据 BlockNote 文档，setSelection 需要两个不同的块 ID
       */
      try {
        MDBridge!.setSelection(doc[0].id, doc[1].id)
        console.log('setSelection 成功')
      }
      catch (error) {
        console.log('setSelection 错误:', error)
      }
    }

    const selectedText = MDBridge!.getSelectedText()
    console.log('- 选中文本:', selectedText)
    console.log('- 选中文本长度:', selectedText.length)
    console.log('- 选中文本类型:', typeof selectedText)
    console.log('- 当前选择状态:', MDBridge!.getSelection())

    return {
      isString: typeof selectedText === 'string',
      hasContent: selectedText.length > 0,
    }
  }, { isString: true, hasContent: true })

  MDTest.testCase(R, 'insertText() - 插入文本', () => {
    MDTest.clearContent()
    MDBridge!.setContent([{ type: 'paragraph', content: '' }])
    MDBridge!.insertText('插入的文本')
    const doc = MDBridge!.getDocument()
    const hasText = doc[0]?.content?.some((c: any) => c.text === '插入的文本')
    return { success: hasText }
  }, { success: true })

  MDTest.printSummary(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runTextOperationsTest = runTextOperationsTest
}
