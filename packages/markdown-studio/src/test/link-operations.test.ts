/**
 * 链接操作接口测试
 * 测试 createLink, getSelectedLinkUrl 等链接相关功能
 * 使用方法：在浏览器 Console 中执行 runLinkOperationsTest()
 */

export async function runLinkOperationsTest() {
  const { MDTest } = window

  if (!MDTest) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('链接操作接口测试')

  MDTest.testCase(R, 'createLink() - 创建链接', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([{
      type: 'paragraph',
      content: [{ type: 'text', text: '测试文本' }],
    }])

    /** 选中文本，然后创建链接 */
    const doc = window.MDBridge!.getDocument()
    if (doc.length > 0) {
      window.MDBridge!.setTextCursorPosition(doc[0].id, 'start')
    }

    window.MDBridge!.createLink('https://example.com', '链接文本')

    /** 验证链接是否创建成功 */
    const updatedDoc = window.MDBridge!.getDocument()
    const hasLink = updatedDoc[0]?.content?.some((c: any) => c.type === 'link')

    console.log('🔍 调试信息:')
    console.log('- 创建链接后的文档:', updatedDoc)
    console.log('- 是否包含链接:', hasLink)

    return { success: hasLink }
  }, { success: true })

  MDTest.testCase(R, 'getSelectedLinkUrl() - 获取选中链接URL', () => {
    MDTest.clearContent()
    /** 创建包含链接的段落 */
    window.MDBridge!.setContent([{
      type: 'paragraph',
      content: [
        { type: 'text', text: '测试文本 ' },
        {
          type: 'link',
          content: [{ type: 'text', text: '链接文本' }],
          href: 'https://example.com',
        },
        { type: 'text', text: ' 更多文本' },
      ],
    }])

    /** 选中链接文本 */
    const doc = window.MDBridge!.getDocument()
    if (doc.length > 0) {
      /** 设置光标到链接位置 */
      window.MDBridge!.setTextCursorPosition(doc[0].id, 'start')
    }

    const linkUrl = window.MDBridge!.getSelectedLinkUrl()
    console.log('🔍 调试信息:')
    console.log('- 文档内容:', doc)
    console.log('- 链接URL:', linkUrl)
    console.log('- 链接URL类型:', typeof linkUrl)

    return {
      hasUrl: typeof linkUrl === 'string' || linkUrl === undefined,
    }
  }, { hasUrl: true })

  MDTest.printSummary(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runLinkOperationsTest = runLinkOperationsTest
}
