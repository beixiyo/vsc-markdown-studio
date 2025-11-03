import { TestStateHelpers } from '@/hooks/useSetupMDBridge/TestStateHelpers'

/**
 * 图片接口 自动化验收脚本
 * 覆盖图片接口：setFooterImagesWithURL、setImagesWithURL、setHeaderImagesWithURL
 * 使用方法：在浏览器 Console 中执行 runImgTest()
 */

export async function runImgTest() {
  if (!MDTest || !MDBridge) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  /** 先添加一些基础内容，这样头部和底部图片的效果更明显 */
  MDTest.logTitle('0. 准备测试内容')
  MDTest.testCase(R, '0.1 添加基础内容', () => {
    MDBridge.setContent([
      { type: 'heading', content: '图片测试文档', props: { level: 1 } },
      { type: 'paragraph', content: '这是一个用于测试图片插入功能的文档。' },
      { type: 'paragraph', content: '我们将测试头部图片、内容图片和底部图片的插入。' },
      { type: 'heading', content: '测试内容区域', props: { level: 2 } },
      { type: 'paragraph', content: '这里是文档的主要内容部分。' },
    ])
    const doc = MDBridge.getDocument()
    return { hasContent: doc.length > 0 }
  }, { hasContent: true })

  MDTest.logTitle('1. 头部图片测试')
  MDTest.testCase(R, '1.1 setHeaderImagesWithURL 设置头部图片', () => {
    const urls = [
      'https://picsum.photos/seed/header1/600/300',
      'https://picsum.photos/seed/header2/600/300',
    ]
    MDBridge.setHeaderImagesWithURL(urls)
    return {
      headerCount: TestStateHelpers.getHeaderImageCount(),
      first: TestStateHelpers.checkHeaderImageContains(0, 'header1'),
    }
  }, { headerCount: 2, first: true })

  MDTest.logTitle('2. 内容图片测试')
  MDTest.testCase(R, '2.1 setImagesWithURL 设置内容图片', () => {
    const urls = [
      'https://picsum.photos/seed/bottom1/300/300',
      'https://picsum.photos/seed/bottom2/300/300',
      'https://picsum.photos/seed/bottom3/300/300',
    ]
    MDBridge.setImagesWithURL(urls)
    return {
      count: TestStateHelpers.getContentImageCount(),
      has2: TestStateHelpers.checkContentImageContains(1, 'bottom2'),
    }
  }, { count: 3, has2: true })

  MDTest.logTitle('3. 底部图片测试')
  MDTest.testCase(R, '3.1 setFooterImagesWithURL 设置底部图片', () => {
    const urls = [
      'https://picsum.photos/seed/local1/300/300',
    ]
    MDBridge.setFooterImagesWithURL(urls)
    return {
      count: TestStateHelpers.getContentImageCount(),
      first: TestStateHelpers.checkContentImageContains(0, 'local1'),
    }
  }, { count: 1, first: true })

  MDTest.logTitle('4. 验证最终状态')
  MDTest.testCase(R, '4.1 检查文档和图片状态', () => {
    const doc = MDBridge.getDocument()
    const testState = TestStateHelpers.getTestState()
    return {
      docLength: doc.length,
      hasHeaderImages: testState.hasHeaderImages,
      hasContentImages: testState.hasContentImages,
      totalImages: testState.totalCount,
    }
  })

  MDTest.finalizeTest(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ;(window as any).runImgTest = runImgTest
}
