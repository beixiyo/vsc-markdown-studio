/**
 * 块点击分组与选区上下文测试
 */

export async function runBlockSelectionTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('块点击分组与选区上下文测试')

  await MDTest.asyncTestCase(R, '点击块后同步分组与块上下文', async () => {
    if (!MDBridge)
      return false

    MDTest.clearContent()

    const testContent = [
      {
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: '一级测试标题', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '第一段测试内容', styles: {} }],
      },
      {
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: '二级测试标题', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '第二段测试内容', styles: {} }],
      },
    ]

    MDBridge.setContent(testContent)
    await MDTest.delay(300)

    const docs = MDBridge.getDocument()
    if (docs.length < 4)
      return false

    const firstHeading = docs[0]
    const firstParagraph = docs[1]
    const secondHeading = docs[2]
    const secondParagraph = docs[3]

    const firstElement = document.querySelector(`[data-id="${firstParagraph.id}"]`)
    const secondElement = document.querySelector(`[data-id="${secondParagraph.id}"]`)

    if (!firstElement || !secondElement)
      return false

    const dispatchClick = (element: Element) => {
      const rect = element.getBoundingClientRect()
      const clickEvent = new MouseEvent('click', {
        clientX: rect.left + 10,
        clientY: rect.top + 10,
        bubbles: true,
        cancelable: true,
      })
      document.dispatchEvent(clickEvent)
    }

    dispatchClick(firstElement)
    await MDTest.delay(200)

    const firstState = MDBridge.state
    const firstContexts = MDBridge.state.selectionContexts

    if (!firstState.lastGroupBlock?.heading)
      return false
    if (firstState.lastGroupBlock.heading.id !== firstHeading.id)
      return false
    if (!firstState.lastGroupMarkdown.includes('一级测试标题'))
      return false
    if (!firstState.lastGroupMarkdown.includes('第一段测试内容'))
      return false

    if (!firstState.lastBlock)
      return false
    if (firstState.lastBlock.id !== firstParagraph.id)
      return false
    if (!firstState.lastBlockMarkdown.includes('第一段测试内容'))
      return false

    const firstHeadingContext = firstContexts.headingSection
    if (!firstHeadingContext?.section?.heading)
      return false
    if (firstHeadingContext.section.heading.id !== firstHeading.id)
      return false
    if (firstHeadingContext.markdown !== firstState.lastGroupMarkdown)
      return false

    const firstBlockContext = firstContexts.block
    if (!firstBlockContext?.block)
      return false
    if (firstBlockContext.block.id !== firstParagraph.id)
      return false
    if (firstBlockContext.markdown !== firstState.lastBlockMarkdown)
      return false

    dispatchClick(secondElement)
    await MDTest.delay(200)

    const secondState = MDBridge.state
    const secondContexts = MDBridge.state.selectionContexts

    if (!secondState.lastGroupBlock?.heading)
      return false
    if (secondState.lastGroupBlock.heading.id !== secondHeading.id)
      return false
    if (!secondState.lastGroupMarkdown.includes('二级测试标题'))
      return false
    if (!secondState.lastGroupMarkdown.includes('第二段测试内容'))
      return false

    if (!secondState.lastBlock)
      return false
    if (secondState.lastBlock.id !== secondParagraph.id)
      return false
    if (!secondState.lastBlockMarkdown.includes('第二段测试内容'))
      return false

    const secondHeadingContext = secondContexts.headingSection
    if (!secondHeadingContext?.section?.heading)
      return false
    if (secondHeadingContext.section.heading.id !== secondHeading.id)
      return false

    const secondBlockContext = secondContexts.block
    if (!secondBlockContext?.block)
      return false
    if (secondBlockContext.block.id !== secondParagraph.id)
      return false

    MDBridge.setContent([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '无标题段落', styles: {} }],
      },
    ])

    await MDTest.delay(200)

    const [plainBlock] = MDBridge.getDocument()
    if (!plainBlock)
      return false

    const plainElement = document.querySelector(`[data-id="${plainBlock.id}"]`)
    if (!plainElement)
      return false

    dispatchClick(plainElement)
    await MDTest.delay(200)

    const plainState = MDBridge.state
    const plainContexts = MDBridge.state.selectionContexts

    if (plainState.lastGroupBlock.heading)
      return false
    if (plainState.lastGroupMarkdown !== '')
      return false
    if (!plainState.lastBlock)
      return false
    if (plainState.lastBlock.id !== plainBlock.id)
      return false
    if (!plainState.lastBlockMarkdown.includes('无标题段落'))
      return false

    const plainHeadingContext = plainContexts.headingSection
    if (plainHeadingContext?.section)
      return false
    if (plainHeadingContext?.markdown)
      return false

    const plainBlockContext = plainContexts.block
    if (!plainBlockContext?.block)
      return false
    if (plainBlockContext.block.id !== plainBlock.id)
      return false

    return true
  }, true)

  MDTest.finalizeTest(R)
}

if (typeof window !== 'undefined') {
  ; (window as any).runBlockSelectionTest = runBlockSelectionTest
}
