/**
 * 文本操作接口测试
 * 测试 getSelectedText, insertText 等文本相关功能
 * 使用方法：在浏览器 Console 中执行 runTextOperationsTest()
 */

export async function runTextOperationsTest() {
  if (!MDTest || !MDBridge) {
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
    MDBridge.setContent([
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
    const doc = MDBridge.getDocument()
    console.log('🔍 调试信息:')
    console.log('- 文档内容:', doc)
    console.log('- 文档长度:', doc.length)

    if (doc.length >= 2) {
      /**
       * 使用 setSelection 来选中两个不同的块
       * 根据 BlockNote 文档，setSelection 需要两个不同的块 ID
       */
      try {
        MDBridge.setSelection(doc[0].id, doc[1].id)
        console.log('setSelection 成功')
      }
      catch (error) {
        console.log('setSelection 错误:', error)
      }
    }

    const selectedText = MDBridge.getSelectedText()
    console.log('- 选中文本:', selectedText)
    console.log('- 选中文本长度:', selectedText.length)
    console.log('- 选中文本类型:', typeof selectedText)
    console.log('- 当前选择状态:', MDBridge.getSelection())

    return {
      isString: typeof selectedText === 'string',
      hasContent: selectedText.length > 0,
    }
  }, { isString: true, hasContent: true })

  MDTest.testCase(R, 'insertText() - 插入文本', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'paragraph', content: '' }])
    MDBridge.insertText('插入的文本')
    const doc = MDBridge.getDocument()
    const hasText = doc[0]?.content?.some((c: any) => c.text === '插入的文本')
    return { success: hasText }
  }, { success: true })

  MDTest.testCase(R, 'extractBlockText() - 提取块文本', () => {
    MDTest.clearContent()
    /** 创建包含文本内容的块 */
    MDBridge.setContent([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '这是第一段文本' },
          { type: 'text', text: '，包含多个文本节点' },
        ],
      },
      {
        type: 'heading',
        content: [{ type: 'text', text: '这是一个标题' }],
      },
      {
        type: 'paragraph',
        content: [], // 空内容块
      },
    ])

    const doc = MDBridge.getDocument()
    console.log('🔍 调试信息:')
    console.log('- 文档内容:', doc)

    /** 测试提取第一个块的文本 */
    const firstBlockText = MDBridge.extractBlockText(doc[0])
    console.log('- 第一个块文本:', firstBlockText)

    /** 测试提取标题块的文本 */
    const headingText = MDBridge.extractBlockText(doc[1])
    console.log('- 标题块文本:', headingText)

    /** 测试提取空块的文本 */
    const emptyBlockText = MDBridge.extractBlockText(doc[2])
    console.log('- 空块文本:', emptyBlockText)

    /** 测试提取不存在的块 */
    const invalidBlockText = MDBridge.extractBlockText(null)
    console.log('- 无效块文本 (null):', invalidBlockText)

    /** 测试提取 undefined 块 */
    const undefinedBlockText = MDBridge.extractBlockText(undefined)
    console.log('- 无效块文本 (undefined):', undefinedBlockText)

    /** 测试提取非对象块 */
    const stringBlockText = MDBridge.extractBlockText('invalid')
    console.log('- 无效块文本 (string):', stringBlockText)

    /** 测试提取没有 content 属性的块 */
    const noContentBlockText = MDBridge.extractBlockText({ type: 'paragraph' })
    console.log('- 无 content 属性块文本:', noContentBlockText)

    /** 测试提取 content 不是数组的块 */
    const invalidContentBlockText = MDBridge.extractBlockText({ content: 'not an array' })
    console.log('- content 非数组块文本:', invalidContentBlockText)

    return {
      firstBlockCorrect: firstBlockText === '这是第一段文本，包含多个文本节点',
      headingCorrect: headingText === '这是一个标题',
      emptyBlockCorrect: emptyBlockText === '',
      invalidBlockCorrect: invalidBlockText === '' && undefinedBlockText === '' && stringBlockText === '',
      noContentCorrect: noContentBlockText === '' && invalidContentBlockText === '',
      allCorrect: firstBlockText === '这是第一段文本，包含多个文本节点'
        && headingText === '这是一个标题'
        && emptyBlockText === ''
        && invalidBlockText === ''
        && undefinedBlockText === ''
        && stringBlockText === ''
        && noContentBlockText === ''
        && invalidContentBlockText === '',
    }
  }, {
    firstBlockCorrect: true,
    headingCorrect: true,
    emptyBlockCorrect: true,
    invalidBlockCorrect: true,
    noContentCorrect: true,
    allCorrect: true,
  })

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runTextOperationsTest = runTextOperationsTest
}
