/**
 * LabelInput 块 自动化验收脚本
 * 测试 LabelInput 块的创建、编辑、删除等功能
 * 使用方法：在浏览器 Console 中执行 runLabelInputTest()
 */

export async function runLabelInputTest() {
  if (!MDTest) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('1. LabelInput 块创建测试')
  MDTest.testCase(R, '1.1 创建基础 LabelInput 块', () => {
    MDTest.clearContent()
    const speaker = {
      name: '测试说话人',
      content: '这是一条测试消息',
    }
    const blockId = MDBridge!.setSpeaker(speaker)
    const doc = MDBridge!.getDocument()
    const labelInputBlock = doc.find((block: any) => block.id === blockId)
    return {
      hasLabelInputBlock: !!labelInputBlock,
      hasLabel: labelInputBlock?.props?.label === '测试说话人',
      hasContent: labelInputBlock?.content?.[0]?.text === '这是一条测试消息',
    }
  }, { hasLabelInputBlock: true, hasLabel: true, hasContent: true })

  MDTest.testCase(R, '1.2 创建带默认标签的 LabelInput 块', () => {
    MDTest.clearContent()
    const speaker = {
      name: '标签',
      content: '默认标签测试',
    }
    const blockId = MDBridge!.setSpeaker(speaker)
    const doc = MDBridge!.getDocument()
    const labelInputBlock = doc.find((block: any) => block.id === blockId)
    return {
      hasDefaultLabel: labelInputBlock?.props?.label === '标签',
      hasContent: labelInputBlock?.content?.[0]?.text === '默认标签测试',
    }
  }, { hasDefaultLabel: true, hasContent: true })

  MDTest.logTitle('2. LabelInput 块更新测试')
  MDTest.testCase(R, '2.1 更新 LabelInput 标签', () => {
    MDTest.clearContent()
    /** 先创建一个块 */
    const speaker1 = {
      name: '原始标签',
      content: '原始内容',
    }
    const blockId = MDBridge!.setSpeaker(speaker1)

    /** 然后更新这个块 */
    const speaker2 = {
      blockId,
      name: '更新后的标签',
      content: '更新后的内容',
    }
    const updatedBlockId = MDBridge!.setSpeaker(speaker2)

    const updatedDoc = MDBridge!.getDocument()
    const updatedBlock = updatedDoc.find((block: any) => block.id === updatedBlockId)
    return {
      labelUpdated: updatedBlock?.props?.label === '更新后的标签',
      contentUpdated: updatedBlock?.content?.[0]?.text === '更新后的内容',
    }
  }, { labelUpdated: true, contentUpdated: true })

  MDTest.logTitle('3. LabelInput 块删除测试')
  MDTest.testCase(R, '3.1 删除 LabelInput 块', () => {
    MDTest.clearContent()
    /** 先创建段落 */
    MDBridge!.setContent([
      { type: 'paragraph', content: '前一段' },
      { type: 'paragraph', content: '后一段' },
    ])

    /** 使用 setSpeaker 创建 LabelInput 块 */
    const speaker = {
      name: '要删除的标签',
      content: '要删除的内容',
    }
    const blockId = MDBridge!.setSpeaker(speaker)

    const doc = MDBridge!.getDocument()
    const initialLength = doc.length

    MDBridge!.removeBlocks([blockId])

    const finalDoc = MDBridge!.getDocument()
    const hasLabelInputAfter = finalDoc.some((block: any) => block.type === 'labelInput')

    return {
      removed: !hasLabelInputAfter,
      lengthReduced: finalDoc.length === initialLength - 1,
    }
  }, { removed: true, lengthReduced: true })

  MDTest.logTitle('4. LabelInput 块替换测试')
  MDTest.testCase(R, '4.1 替换 LabelInput 块为段落', () => {
    MDTest.clearContent()
    /** 使用 setSpeaker 创建 LabelInput 块 */
    const speaker = {
      name: '要替换的标签',
      content: '要替换的内容',
    }
    const blockId = MDBridge!.setSpeaker(speaker)

    MDBridge!.replaceBlocks([blockId], [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '替换后的段落',
            styles: {},
          },
        ],
      },
    ])

    const finalDoc = MDBridge!.getDocument()
    const hasParagraph = finalDoc.some((block: any) => block.type === 'paragraph')
    const hasLabelInput = finalDoc.some((block: any) => block.type === 'labelInput')
    /** 找到有内容的段落块（替换后创建的） */
    const paragraphBlock = finalDoc.find((block: any) =>
      block.type === 'paragraph' && block.content?.length > 0 && block.content[0]?.text === '替换后的段落',
    )

    return {
      replaced: hasParagraph && !hasLabelInput,
      content: paragraphBlock?.content?.[0]?.text === '替换后的段落',
    }
  }, { replaced: true, content: true })

  MDTest.logTitle('5. LabelInput 块验证测试')
  MDTest.testCase(R, '5.1 验证 LabelInput 块结构', () => {
    MDTest.clearContent()
    const speaker = {
      name: '结构验证标签',
      content: '结构验证内容',
    }
    const blockId = MDBridge!.setSpeaker(speaker)

    const doc = MDBridge!.getDocument()
    const labelInputBlock = doc.find((block: any) => block.id === blockId)

    return {
      hasType: labelInputBlock.type === 'labelInput',
      hasProps: !!labelInputBlock.props,
      hasLabel: typeof labelInputBlock.props?.label === 'string',
      hasContent: Array.isArray(labelInputBlock.content),
      contentNotEmpty: labelInputBlock.content?.length > 0,
    }
  }, { hasType: true, hasProps: true, hasLabel: true, hasContent: true, contentNotEmpty: true })

  MDTest.logTitle('6. setSpeaker 接口测试')
  MDTest.testCase(R, '6.1 使用 setSpeaker 创建新块', () => {
    MDTest.clearContent()
    const speaker = {
      name: '张三',
      content: '你好，我是张三',
    }

    const blockId = MDBridge!.setSpeaker(speaker)

    const doc = MDBridge!.getDocument()
    const labelInputBlock = doc.find((block: any) => block.id === blockId)

    return {
      hasBlockId: !!blockId,
      hasLabelInputBlock: !!labelInputBlock,
      blockType: labelInputBlock?.type,
      blockLabel: labelInputBlock?.props?.label,
      blockContent: labelInputBlock?.content?.[0]?.text,
    }
  }, {
    hasBlockId: true,
    hasLabelInputBlock: true,
    blockType: 'labelInput',
    blockLabel: '张三',
    blockContent: '你好，我是张三',
  })

  MDTest.testCase(R, '6.2 使用 setSpeaker 更新现有块', () => {
    MDTest.clearContent()
    /** 先创建一个块 */
    const speaker1 = {
      name: '李四',
      content: '我是李四',
    }
    const blockId = MDBridge!.setSpeaker(speaker1)

    /** 然后更新这个块 */
    const speaker2 = {
      blockId,
      name: '王五',
      content: '我是王五，更新后的内容',
    }
    const updatedBlockId = MDBridge!.setSpeaker(speaker2)

    const doc = MDBridge!.getDocument()
    const labelInputBlock = doc.find((block: any) => block.id === updatedBlockId)

    return {
      sameBlockId: blockId === updatedBlockId,
      blockLabel: labelInputBlock?.props?.label,
      blockContent: labelInputBlock?.content?.[0]?.text,
    }
  }, {
    sameBlockId: true,
    blockLabel: '王五',
    blockContent: '我是王五，更新后的内容',
  })

  MDTest.testCase(R, '6.3 setSpeaker 错误处理', () => {
    const invalidResult1 = MDBridge!.setSpeaker(null as any)
    const invalidResult2 = MDBridge!.setSpeaker({} as any)
    const invalidResult3 = MDBridge!.setSpeaker({ name: '', content: 'test' } as any)

    return {
      nullResult: invalidResult1,
      emptyObjectResult: invalidResult2,
      emptyNameResult: invalidResult3,
    }
  }, {
    nullResult: '',
    emptyObjectResult: '',
    emptyNameResult: '',
  })

  MDTest.logTitle('7. LabelInput 块内容测试')
  MDTest.testCase(R, '7.1 测试空内容处理', () => {
    MDTest.clearContent()
    const speaker = {
      name: '空内容测试',
      content: '',
    }
    const blockId = MDBridge!.setSpeaker(speaker)

    const doc = MDBridge!.getDocument()
    const labelInputBlock = doc.find((block: any) => block.id === blockId)

    return {
      hasEmptyContent: labelInputBlock.content?.length === 0 || labelInputBlock.content?.[0]?.text === '',
      hasLabel: labelInputBlock.props?.label === '空内容测试',
    }
  }, { hasEmptyContent: true, hasLabel: true })

  MDTest.testCase(R, '7.2 测试多行内容', () => {
    MDTest.clearContent()
    const speaker = {
      name: '多行内容测试',
      content: '第一行内容\n第二行内容\n第三行内容',
    }
    const blockId = MDBridge!.setSpeaker(speaker)

    const doc = MDBridge!.getDocument()
    const labelInputBlock = doc.find((block: any) => block.id === blockId)
    const content = labelInputBlock.content?.[0]?.text

    return {
      hasMultiLineContent: content?.includes('\n'),
      lineCount: content?.split('\n').length === 3,
    }
  }, { hasMultiLineContent: true, lineCount: true })

  MDTest.printSummary(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runLabelInputTest = runLabelInputTest
}
