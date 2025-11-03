/**
 * 简化的块点击监听功能测试
 */

export async function runBlockClickTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  const R = MDTest.createResults()

  MDTest.logTitle('简化块点击监听功能测试')

  /** 测试 : 检查 onBlockClick 方法是否存在 */
  MDTest.testCase(R, 'onBlockClick 方法存在性检查', () => {
    return typeof MDBridge?.onBlockClick === 'function'
  }, true)

  /** 测试 : 测试 onBlockClick 注册和取消 */
  MDTest.testCase(R, 'onBlockClick 注册和取消测试', () => {
    if (!MDBridge)
      return false

    let callbackCalled = false
    const unsubscribe = MDBridge.onBlockClick(() => {
      callbackCalled = true
    })

    /** 检查返回的是否为函数 */
    const isFunction = typeof unsubscribe === 'function'

    /** 取消监听 */
    unsubscribe()

    return isFunction
  }, true)

  /** 测试 : 测试多个监听器注册 */
  MDTest.testCase(R, '多个 onBlockClick 监听器注册测试', () => {
    if (!MDBridge)
      return false

    let callback1Called = false
    let callback2Called = false

    const unsubscribe1 = MDBridge.onBlockClick(() => {
      callback1Called = true
    })

    const unsubscribe2 = MDBridge.onBlockClick(() => {
      callback2Called = true
    })

    /** 检查两个监听器都成功注册 */
    const bothRegistered = typeof unsubscribe1 === 'function' && typeof unsubscribe2 === 'function'

    /** 取消监听 */
    unsubscribe1()
    unsubscribe2()

    return bothRegistered
  }, true)

  /** 测试 : 测试点击事件触发（使用 document 事件） */
  await MDTest.asyncTestCase(R, '点击事件触发测试', async () => {
    if (!MDBridge)
      return false

    try {
      /** 清空内容并设置测试内容 */
      MDTest.clearContent()
      const testContent = [
        {
          type: 'heading',
          props: { level: 1 },
          content: [{ type: 'text', text: '测试标题', styles: {} }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '这是一个测试段落', styles: {} }],
        },
      ]

      MDBridge.setContent(testContent)
      await MDTest.delay(300)

      let clickCallbackCalled = false
      let clickedBlock: any = null

      const unsubscribe = MDBridge.onBlockClick((block) => {
        console.log('点击回调被调用，块:', block)
        clickCallbackCalled = true
        clickedBlock = block
      })

      /** 获取文档中的块 */
      const docs = MDBridge.getDocument()
      console.log('文档中的块:', docs)
      if (docs.length < 2) {
        unsubscribe()
        return false
      }

      /** 模拟点击第一个块（标题） */
      const firstBlock = docs[0]
      const blockElement = document.querySelector(`[data-id="${firstBlock.id}"]`)
      console.log('找到的块元素:', blockElement)

      if (!blockElement) {
        unsubscribe()
        return false
      }

      /** 创建并触发点击事件 */
      const rect = blockElement.getBoundingClientRect()
      console.log('块元素位置:', rect)

      /** 使用 document 事件触发 */
      const clickEvent = new MouseEvent('click', {
        clientX: rect.left + 10,
        clientY: rect.top + 10,
        bubbles: true,
        cancelable: true,
      })

      console.log('触发点击事件')
      document.dispatchEvent(clickEvent)

      /** 等待事件处理 */
      await MDTest.delay(200)

      console.log('点击回调调用状态:', clickCallbackCalled)
      console.log('点击的块:', clickedBlock)

      /** 检查回调是否被调用且参数正确 */
      const success = clickCallbackCalled && clickedBlock && clickedBlock.id === firstBlock.id

      /** 清理 */
      unsubscribe()

      return success
    }
    catch (error) {
      console.error('点击事件触发测试出错:', error)
      return false
    }
  }, true)

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ; (window as any).runBlockClickTest = runBlockClickTest
}
