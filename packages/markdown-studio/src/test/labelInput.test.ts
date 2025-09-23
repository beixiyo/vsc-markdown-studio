/**
 * LabelInput 块 自动化验收脚本
 * 测试 LabelInput 块的创建、编辑、删除等功能
 * 使用方法：在浏览器 Console 中执行 runLabelInputTest()
 */

export async function runLabelInputTest() {
  const { MDTest } = window

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
    window.MDBridge!.setContent([
      {
        type: 'labelInput',
        props: {
          label: '测试说话人',
        },
        content: [
          {
            type: 'text',
            text: '这是一条测试消息',
            styles: {},
          },
        ],
      },
    ])
    const doc = window.MDBridge!.getDocument()
    const labelInputBlock = doc.find((block: any) => block.type === 'labelInput')
    return {
      hasLabelInputBlock: !!labelInputBlock,
      hasLabel: labelInputBlock?.props?.label === '测试说话人',
      hasContent: labelInputBlock?.content?.[0]?.text === '这是一条测试消息',
    }
  }, { hasLabelInputBlock: true, hasLabel: true, hasContent: true })

  MDTest.testCase(R, '1.2 创建带默认标签的 LabelInput 块', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'labelInput',
        props: {},
        content: [
          {
            type: 'text',
            text: '默认标签测试',
            styles: {},
          },
        ],
      },
    ])
    const doc = window.MDBridge!.getDocument()
    const labelInputBlock = doc.find((block: any) => block.type === 'labelInput')
    return {
      hasDefaultLabel: labelInputBlock?.props?.label === '标签',
      hasContent: labelInputBlock?.content?.[0]?.text === '默认标签测试',
    }
  }, { hasDefaultLabel: true, hasContent: true })

  MDTest.logTitle('2. LabelInput 块更新测试')
  MDTest.testCase(R, '2.1 更新 LabelInput 标签', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'labelInput',
        props: {
          label: '原始标签',
        },
        content: [
          {
            type: 'text',
            text: '原始内容',
            styles: {},
          },
        ],
      },
    ])
    const doc = window.MDBridge!.getDocument()
    const labelInputId = doc[0].id

    window.MDBridge!.updateBlock(labelInputId, {
      type: 'labelInput',
      props: {
        label: '更新后的标签',
      },
      content: [
        {
          type: 'text',
          text: '更新后的内容',
          styles: {},
        },
      ],
    })

    const updatedDoc = window.MDBridge!.getDocument()
    const updatedBlock = updatedDoc.find((block: any) => block.id === labelInputId)
    return {
      labelUpdated: updatedBlock?.props?.label === '更新后的标签',
      contentUpdated: updatedBlock?.content?.[0]?.text === '更新后的内容',
    }
  }, { labelUpdated: true, contentUpdated: true })

  MDTest.logTitle('3. LabelInput 块删除测试')
  MDTest.testCase(R, '3.1 删除 LabelInput 块', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      { type: 'paragraph', content: '前一段' },
      {
        type: 'labelInput',
        props: {
          label: '要删除的标签',
        },
        content: [
          {
            type: 'text',
            text: '要删除的内容',
            styles: {},
          },
        ],
      },
      { type: 'paragraph', content: '后一段' },
    ])

    const doc = window.MDBridge!.getDocument()
    const labelInputBlock = doc.find((block: any) => block.type === 'labelInput')
    const initialLength = doc.length

    window.MDBridge!.removeBlocks([labelInputBlock.id])

    const finalDoc = window.MDBridge!.getDocument()
    const hasLabelInputAfter = finalDoc.some((block: any) => block.type === 'labelInput')

    return {
      removed: !hasLabelInputAfter,
      lengthReduced: finalDoc.length === initialLength - 1,
    }
  }, { removed: true, lengthReduced: true })

  MDTest.logTitle('4. LabelInput 块替换测试')
  MDTest.testCase(R, '4.1 替换 LabelInput 块为段落', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'labelInput',
        props: {
          label: '要替换的标签',
        },
        content: [
          {
            type: 'text',
            text: '要替换的内容',
            styles: {},
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const labelInputId = doc[0].id

    window.MDBridge!.replaceBlocks([labelInputId], [
      { type: 'paragraph', content: '替换后的段落' },
    ])

    const finalDoc = window.MDBridge!.getDocument()
    const hasParagraph = finalDoc.some((block: any) => block.type === 'paragraph')
    const hasLabelInput = finalDoc.some((block: any) => block.type === 'labelInput')
    const paragraphBlock = finalDoc.find((block: any) => block.type === 'paragraph')

    return {
      replaced: hasParagraph && !hasLabelInput,
      content: paragraphBlock?.content?.[0]?.text === '替换后的段落',
    }
  }, { replaced: true, content: true })

  MDTest.logTitle('5. LabelInput 块验证测试')
  MDTest.testCase(R, '5.1 验证 LabelInput 块结构', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'labelInput',
        props: {
          label: '结构验证标签',
        },
        content: [
          {
            type: 'text',
            text: '结构验证内容',
            styles: {},
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const labelInputBlock = doc[0]

    return {
      hasType: labelInputBlock.type === 'labelInput',
      hasProps: !!labelInputBlock.props,
      hasLabel: typeof labelInputBlock.props?.label === 'string',
      hasContent: Array.isArray(labelInputBlock.content),
      contentNotEmpty: labelInputBlock.content?.length > 0,
    }
  }, { hasType: true, hasProps: true, hasLabel: true, hasContent: true, contentNotEmpty: true })

  MDTest.logTitle('6. LabelInput 块内容测试')
  MDTest.testCase(R, '6.1 测试空内容处理', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'labelInput',
        props: {
          label: '空内容测试',
        },
        content: [],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const labelInputBlock = doc[0]

    return {
      hasEmptyContent: labelInputBlock.content?.length === 0,
      hasLabel: labelInputBlock.props?.label === '空内容测试',
    }
  }, { hasEmptyContent: true, hasLabel: true })

  MDTest.testCase(R, '6.2 测试多行内容', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'labelInput',
        props: {
          label: '多行内容测试',
        },
        content: [
          {
            type: 'text',
            text: '第一行内容\n第二行内容\n第三行内容',
            styles: {},
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const labelInputBlock = doc[0]
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
