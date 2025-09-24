/**
 * Mermaid 图表 自动化验收脚本
 * 测试 Mermaid 块的创建、编辑、删除等功能
 * 使用方法：在浏览器 Console 中执行 runMermaidTest()
 */

export async function runMermaidTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('1. Mermaid 块创建测试')
  MDTest.testCase(R, '1.1 创建基础 Mermaid 块', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      {
        type: 'mermaid',
        props: {
          diagram: 'graph TD\n    A[开始] --> B[处理]\n    B --> C[结束]',
        },
      },
    ])
    const doc = MDBridge.getDocument()
    const mermaidBlock = doc.find((block: any) => block.type === 'mermaid')
    return {
      hasMermaidBlock: !!mermaidBlock,
      hasCode: mermaidBlock?.props?.diagram?.includes('graph TD'),
    }
  }, { hasMermaidBlock: true, hasCode: true })

  MDTest.testCase(R, '1.2 创建复杂 Mermaid 图表', () => {
    MDTest.clearContent()
    const complexCode = `sequenceDiagram
    participant A as 用户
    participant B as 系统
    participant C as 数据库

    A->>B: 发送请求
    B->>C: 查询数据
    C-->>B: 返回结果
    B-->>A: 响应数据`

    MDBridge.setContent([
      {
        type: 'mermaid',
        props: {
          diagram: complexCode,
        },
      },
    ])
    const doc = MDBridge.getDocument()
    const mermaidBlock = doc.find((block: any) => block.type === 'mermaid')
    return {
      hasSequenceDiagram: mermaidBlock?.props?.diagram?.includes('sequenceDiagram'),
      hasParticipants: mermaidBlock?.props?.diagram?.includes('participant'),
    }
  }, { hasSequenceDiagram: true, hasParticipants: true })

  MDTest.logTitle('2. Mermaid 块更新测试')
  MDTest.testCase(R, '2.1 更新 Mermaid 代码', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      {
        type: 'mermaid',
        props: {
          diagram: 'graph TD\n    A --> B',
        },
      },
    ])
    const doc = MDBridge.getDocument()
    const mermaidId = doc[0].id

    MDBridge.updateBlock(mermaidId, {
      type: 'mermaid',
      props: {
        diagram: 'graph LR\n    X --> Y\n    Y --> Z',
      },
    })

    const updatedDoc = MDBridge.getDocument()
    const updatedBlock = updatedDoc.find((block: any) => block.id === mermaidId)
    return {
      updated: updatedBlock?.props?.diagram?.includes('graph LR'),
      hasNewNodes: updatedBlock?.props?.diagram?.includes('X --> Y'),
    }
  }, { updated: true, hasNewNodes: true })

  MDTest.logTitle('3. Mermaid 块删除测试')
  MDTest.testCase(R, '3.1 删除 Mermaid 块', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      { type: 'paragraph', content: '前一段' },
      {
        type: 'mermaid',
        props: {
          diagram: 'graph TD\n    A --> B',
        },
      },
      { type: 'paragraph', content: '后一段' },
    ])

    const doc = MDBridge.getDocument()
    const mermaidBlock = doc.find((block: any) => block.type === 'mermaid')
    const initialLength = doc.length

    MDBridge.removeBlocks([mermaidBlock.id])

    const finalDoc = MDBridge.getDocument()
    const hasMermaidAfter = finalDoc.some((block: any) => block.type === 'mermaid')

    return {
      removed: !hasMermaidAfter,
      lengthReduced: finalDoc.length === initialLength - 1,
    }
  }, { removed: true, lengthReduced: true })

  MDTest.logTitle('4. Mermaid 块替换测试')
  MDTest.testCase(R, '4.1 替换 Mermaid 块为段落', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      {
        type: 'mermaid',
        props: {
          diagram: 'graph TD\n    A --> B',
        },
      },
    ])

    const doc = MDBridge.getDocument()
    const mermaidId = doc[0].id

    MDBridge.replaceBlocks([mermaidId], [
      { type: 'paragraph', content: '替换后的段落' },
    ])

    const finalDoc = MDBridge.getDocument()
    const hasParagraph = finalDoc.some((block: any) => block.type === 'paragraph')
    const hasMermaid = finalDoc.some((block: any) => block.type === 'mermaid')
    const paragraphBlock = finalDoc.find((block: any) => block.type === 'paragraph')

    return {
      replaced: hasParagraph && !hasMermaid,
      content: paragraphBlock?.content?.[0]?.text === '替换后的段落',
    }
  }, { replaced: true, content: true })

  MDTest.logTitle('5. Mermaid 块验证测试')
  MDTest.testCase(R, '5.1 验证 Mermaid 块结构', () => {
    MDTest.clearContent()
    MDBridge.setContent([
      {
        type: 'mermaid',
        props: {
          diagram: 'pie title 测试饼图\n    "部分1" : 30\n    "部分2" : 70',
        },
      },
    ])

    const doc = MDBridge.getDocument()
    const mermaidBlock = doc[0]

    return {
      hasType: mermaidBlock.type === 'mermaid',
      hasProps: !!mermaidBlock.props,
      hasCode: typeof mermaidBlock.props?.diagram === 'string',
      codeNotEmpty: mermaidBlock.props?.diagram?.length > 0,
    }
  }, { hasType: true, hasProps: true, hasCode: true, codeNotEmpty: true })

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runMermaidTest = runMermaidTest
}
