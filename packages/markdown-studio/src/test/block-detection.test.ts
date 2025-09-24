/**
 * 块检测接口测试
 * 测试鼠标悬浮、位置检测等新功能
 * 使用方法：在浏览器 Console 中执行 runBlockDetectionTest()
 */

export async function runBlockDetectionTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('块检测接口测试')

  /** 设置测试内容 */
  MDTest.testCase(R, '准备测试内容', () => {
    MDBridge.setContent([
      { type: 'heading', props: { level: 1 }, content: '标题 1' },
      { type: 'paragraph', content: '这是一个段落' },
      { type: 'heading', props: { level: 2 }, content: '标题 2' },
      { type: 'paragraph', content: '另一个段落' },
    ])
    const doc = MDBridge.getDocument()
    return { hasContent: doc.length >= 4 }
  }, { hasContent: true })

  MDTest.testCase(R, 'getBlockAtPosition() - 根据坐标获取块', () => {
    const doc = MDBridge.getDocument()
    if (doc.length === 0)
      return { success: false }

    /** 获取第一个块的DOM元素 */
    const firstBlockElement = document.querySelector(`[data-id="${doc[0].id}"]`)
    if (!firstBlockElement)
      return { success: false }

    const rect = firstBlockElement.getBoundingClientRect()
    const block = MDBridge.getBlockAtPosition(rect.x, rect.y)

    return {
      foundBlock: !!block,
      correctBlock: block?.id === doc[0].id,
    }
  }, { foundBlock: true, correctBlock: true })

  MDTest.testCase(R, 'getBlockFromElement() - 从元素获取块', () => {
    const doc = MDBridge.getDocument()
    if (doc.length === 0)
      return { success: false }

    const firstBlockElement = document.querySelector(`[data-id="${doc[0].id}"]`)
    if (!firstBlockElement)
      return { success: false }

    const block = MDBridge.getBlockFromElement(firstBlockElement)
    return {
      foundBlock: !!block,
      correctBlock: block?.id === doc[0].id,
    }
  }, { foundBlock: true, correctBlock: true })

  MDTest.testCase(R, 'getBlockFromElement() - 无效元素', () => {
    const invalidElement = document.createElement('div')
    const block = MDBridge.getBlockFromElement(invalidElement)
    return { shouldBeNull: block === null }
  }, { shouldBeNull: true })

  MDTest.testCase(R, 'onBlockHover() - 悬浮监听器', () => {
    const hoveredBlocks: any[] = []
    let callbackCount = 0

    const unsubscribe = MDBridge.onBlockHover((block) => {
      callbackCount++
      if (block) {
        hoveredBlocks.push(block.id)
      }
    })

    /** 模拟鼠标移动事件 */
    const doc = MDBridge.getDocument()
    if (doc.length > 0) {
      const firstBlockElement = document.querySelector(`[data-id="${doc[0].id}"]`)
      if (firstBlockElement) {
        const rect = firstBlockElement.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        /** 触发鼠标移动事件 */
        const mouseMoveEvent = new MouseEvent('mousemove', {
          clientX: centerX,
          clientY: centerY,
        })
        document.dispatchEvent(mouseMoveEvent)
      }
    }

    /** 清理监听器 */
    unsubscribe()

    return {
      hasCallback: callbackCount > 0,
      hasHoveredBlocks: hoveredBlocks.length > 0,
    }
  }, { hasCallback: true, hasHoveredBlocks: true })

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  (window as any).runBlockDetectionTest = runBlockDetectionTest
}
