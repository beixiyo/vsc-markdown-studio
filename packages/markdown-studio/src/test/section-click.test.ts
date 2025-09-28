/**
 * 块点击分组功能测试
 */

export async function runSectionClick() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('块点击分组功能测试')

  await MDTest.asyncTestCase(R, '点击块后同步分组状态', async () => {
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

    const firstGroup = MDBridge.state.lastGroupBlock
    const firstMarkdown = MDBridge.state.lastGroupMarkdown

    if (!firstGroup?.heading)
      return false
    if (firstGroup.heading.id !== firstHeading.id)
      return false
    if (!Array.isArray(firstGroup.blocks) || firstGroup.blocks.length === 0)
      return false
    if (!firstMarkdown || !firstMarkdown.includes('一级测试标题') || !firstMarkdown.includes('第一段测试内容'))
      return false

    dispatchClick(secondElement)
    await MDTest.delay(200)

    const secondGroup = MDBridge.state.lastGroupBlock
    const secondMarkdown = MDBridge.state.lastGroupMarkdown

    if (!secondGroup?.heading)
      return false
    if (secondGroup.heading.id !== secondHeading.id)
      return false
    if (!Array.isArray(secondGroup.blocks) || secondGroup.blocks.length === 0)
      return false
    if (!secondMarkdown || !secondMarkdown.includes('二级测试标题') || !secondMarkdown.includes('第二段测试内容'))
      return false
    if (secondMarkdown === firstMarkdown)
      return false

    return true
  }, true)

  MDTest.finalizeTest(R)
}

if (typeof window !== 'undefined') {
  ; (window as any).runBlockSectionTest = runSectionClick
}
