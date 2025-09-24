/**
 * 内容设置 自动化验收脚本
 * 覆盖 setMarkdown / getMarkdown 功能测试
 * 使用方法：在浏览器 Console 中执行 runContentTest()
 */

export async function runContentTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('1. 存在性检查')
  MDTest.testCase(R, '1.1 MDBridge 是否存在', () => ({
    exists: !!MDBridge,
    hasSetContent: typeof MDBridge.setMarkdown === 'function',
    hasGetContent: typeof MDBridge.getMarkdown === 'function',
  }), { exists: true, hasSetContent: true, hasGetContent: true })

  MDTest.logTitle('2. 功能性验证（setMarkdown / getMarkdown）')
  await MDTest.asyncTestCase(R, '2.1 setMarkdown 后 getMarkdown 包含关键内容', async () => {
    const md = `# 验收标题\n\n- 事项 1\n- 事项 2\n\n时间: ${new Date().toLocaleString()}`
    await MDBridge.setMarkdown(md)
    await MDTest.delay(120)
    const read = MDBridge.getMarkdown()
    return {
      isString: typeof read === 'string',
      hasHeading: read.includes('验收标题'),
      hasList: read.includes('事项 1') && read.includes('事项 2'),
    }
  }, { isString: true, hasHeading: true, hasList: true })

  await MDTest.asyncTestCase(R, '2.2 连续两次 setMarkdown 的幂等性（不抛错）', async () => {
    const md2 = `# 第二次设置\n\n内容 A\n\n- X\n- Y`
    await MDBridge.setMarkdown(md2)
    await MDTest.delay(80)
    await MDBridge.setMarkdown(md2)
    await MDTest.delay(80)
    const read2 = MDBridge.getMarkdown()
    return { includes: read2.includes('第二次设置') && read2.includes('内容 A') }
  }, { includes: true })

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runContentTest = runContentTest
}
