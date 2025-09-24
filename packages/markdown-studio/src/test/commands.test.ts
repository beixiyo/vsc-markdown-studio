/**
 * 命令集合 自动化验收脚本（setHeading/Paragraph/List/Bold/CheckList）
 * 使用方法：在浏览器 Console 中执行 runCommandsTest()
 */

export async function runCommandsTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('1. 设置标题命令')
  MDTest.testCase(R, '1.1 setHeading(1)', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'paragraph', content: '测试段落' }])
    MDBridge.command.setHeading(1)
    const doc = MDBridge.getDocument()
    return { hasHeading: doc.some((b: any) => b.type === 'heading') }
  }, { hasHeading: true })

  MDTest.logTitle('2. 设置段落命令')
  MDTest.testCase(R, '2.1 setParagraph()', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'heading', content: '测试标题', props: { level: 1 } }])
    MDBridge.command.setParagraph()
    return { success: true }
  })

  MDTest.logTitle('3. 列表命令')
  MDTest.testCase(R, '3.1 setUnorderedList()', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'paragraph', content: '测试段落' }])
    MDBridge.command.setUnorderedList()
    const doc = MDBridge.getDocument()
    return { hasList: doc.some((b: any) => b.type === 'bulletListItem') }
  }, { hasList: true })

  MDTest.testCase(R, '3.2 setOrderedList()', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'paragraph', content: '测试段落' }])
    MDBridge.command.setOrderedList()
    const doc = MDBridge.getDocument()
    return { hasNumberedList: doc.some((b: any) => b.type === 'numberedListItem') }
  }, { hasNumberedList: true })

  MDTest.logTitle('4. 文本样式命令')
  MDTest.testCase(R, '4.1 setBold()', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'paragraph', content: '测试段落' }])
    MDBridge.command.setBold()
    return { success: true }
  })

  MDTest.testCase(R, '4.2 setItalic() - 测试命令执行', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'paragraph', content: '测试段落' }])
    /** 测试命令是否能正常执行（不检查结果） */
    MDBridge.command.setItalic()
    return { success: true }
  })

  MDTest.logTitle('5. 检查列表命令')
  MDTest.testCase(R, '5.1 setCheckList()', () => {
    MDTest.clearContent()
    MDBridge.setContent([{ type: 'paragraph', content: '测试段落' }])
    MDBridge.command.setCheckList()
    const doc = MDBridge.getDocument()
    return { hasCheckList: doc.some((b: any) => b.type === 'checkListItem') }
  }, { hasCheckList: true })

  MDTest.logTitle('6. 样式功能验证测试')
  MDTest.testCase(R, '6.1 验证斜体样式数据结构', () => {
    MDTest.clearContent()
    /** 直接设置带有斜体样式的内容 */
    MDBridge.setContent([{
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '测试段落',
          styles: { italic: true },
        },
      ],
    }])
    const doc = MDBridge.getDocument()
    const hasItalic = doc[0]?.content?.[0]?.styles?.italic === true
    return { hasItalic }
  }, { hasItalic: true })

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runCommandsTest = runCommandsTest
}
