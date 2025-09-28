/**
 * 标题悬浮监听功能测试
 */

export async function runBlockHoverTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  const R = MDTest.createResults()

  MDTest.logTitle('标题悬浮监听功能测试')

  /** 测试 : 检查 getParentHeading 方法是否存在 */
  MDTest.testCase(R, 'getParentHeading 方法存在性检查', () => {
    return typeof MDBridge?.getParentHeading === 'function'
  }, true)

  /** 测试 : 检查 onBlockHover 方法是否存在 */
  MDTest.testCase(R, 'onBlockHover 方法存在性检查', () => {
    return typeof MDBridge?.onBlockHover === 'function'
  }, true)

  /** 测试 : 测试 onBlockHover 注册和取消 */
  MDTest.testCase(R, 'onBlockHover 注册和取消测试', () => {
    if (!MDBridge)
      return false

    let callbackCalled = false
    const unsubscribe = MDBridge.onBlockHover(() => {
      callbackCalled = true
    })

    /** 检查返回的是否为函数 */
    const isFunction = typeof unsubscribe === 'function'

    /** 取消监听 */
    unsubscribe()

    return isFunction
  }, true)

  /** 测试 : 测试 getParentHeading 对无效 blockId 的处理 */
  MDTest.testCase(R, 'getParentHeading 无效 blockId 处理', () => {
    if (!MDBridge)
      return false

    const result = MDBridge.getParentHeading('invalid-block-id')
    return result === null
  }, true)

  /** 测试 : 创建测试内容并测试标题获取 */
  await MDTest.asyncTestCase(R, '标题获取功能测试', async () => {
    if (!MDBridge)
      return false

    /** 创建测试内容 */
    const testContent = [
      {
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: '一级标题', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '这是一个段落', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '二级标题', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '这是另一个段落', styles: {} }],
      },
    ]

    /** 设置内容 */
    MDBridge.setContent(testContent)

    /** 等待内容设置完成 */
    await MDTest.delay(100)

    /** 获取文档 */
    const docs = MDBridge.getDocument()

    if (docs.length < 4)
      return false

    /** 测试第一个段落的上级标题（应该是一级标题） */
    const firstParagraph = docs[1] // 第二个块是段落
    const firstHeading = MDBridge.getParentHeading(firstParagraph.id)

    if (!firstHeading)
      return false
    if (firstHeading.level !== 1)
      return false
    if (firstHeading.text !== '一级标题')
      return false

    /** 测试第二个段落的上级标题（应该是二级标题） */
    const secondParagraph = docs[3] // 第四个块是段落
    const secondHeading = MDBridge.getParentHeading(secondParagraph.id)

    if (!secondHeading)
      return false
    if (secondHeading.level !== 2)
      return false
    if (secondHeading.text !== '二级标题')
      return false

    return true
  }, true)

  /** 测试 : 测试标题块的上级标题（应该返回 null） */
  await MDTest.asyncTestCase(R, '标题块上级标题测试', async () => {
    if (!MDBridge)
      return false

    const document = MDBridge.getDocument()
    const firstHeading = document[0] // 第一个块是标题

    const parentHeading = MDBridge.getParentHeading(firstHeading.id)

    /** 标题块本身不应该有上级标题 */
    return parentHeading === null
  }, true)

  MDTest.finalizeTest(R)
}
