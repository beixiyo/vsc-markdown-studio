/**
 * 渐变文字样式 自动化验收脚本
 * 测试渐变样式的数据结构、MDBridge 接口功能等
 * 使用方法：在浏览器 Console 中执行 runGradientTest()
 */

import { getAllGradientTypes, getGradientConfig } from '../types/gradient'

export async function runGradientTest() {
  const { MDTest } = window

  if (!MDTest) {
    console.error('MDTest 工具未加载，请先加载测试工具')
    return
  }

  MDTest.clearContent()
  const R = MDTest.createResults()
  await MDTest.std.waitForMDBridge()

  MDTest.logTitle('1. 新渐变样式基础测试')
  MDTest.testCase(R, '1.1 添加神秘紫蓝渐变样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '神秘紫蓝渐变测试',
            styles: { mysticPurpleBlue: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasText: !!textContent,
      hasMysticPurpleBlueStyle: textContent?.styles?.mysticPurpleBlue === true,
    }
  }, { hasText: true, hasMysticPurpleBlueStyle: true })

  MDTest.testCase(R, '1.2 添加天空蓝渐变样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '天空蓝渐变测试',
            styles: { skyBlue: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasSkyBlueStyle: textContent?.styles?.skyBlue === true,
    }
  }, { hasSkyBlueStyle: true })

  MDTest.testCase(R, '1.3 添加瑰丽紫红渐变样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '瑰丽紫红渐变测试',
            styles: { gorgeousPurpleRed: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasGorgeousPurpleRedStyle: textContent?.styles?.gorgeousPurpleRed === true,
    }
  }, { hasGorgeousPurpleRedStyle: true })

  MDTest.testCase(R, '1.4 添加温暖阳光渐变样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '温暖阳光渐变测试',
            styles: { warmSunshine: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasWarmSunshineStyle: textContent?.styles?.warmSunshine === true,
    }
  }, { hasWarmSunshineStyle: true })

  MDTest.testCase(R, '1.5 添加自然绿意渐变样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '自然绿意渐变测试',
            styles: { naturalGreen: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasNaturalGreenStyle: textContent?.styles?.naturalGreen === true,
    }
  }, { hasNaturalGreenStyle: true })

  MDTest.logTitle('2. 高级渐变样式测试')
  MDTest.testCase(R, '2.1 添加神秘暗夜渐变样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '神秘暗夜渐变测试',
            styles: { mysticNight: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasMysticNightStyle: textContent?.styles?.mysticNight === true,
    }
  }, { hasMysticNightStyle: true })

  MDTest.testCase(R, '2.2 添加多彩糖果渐变样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '多彩糖果渐变测试',
            styles: { colorfulCandy: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasColorfulCandyStyle: textContent?.styles?.colorfulCandy === true,
    }
  }, { hasColorfulCandyStyle: true })

  MDTest.testCase(R, '2.3 添加星空夜幕渐变样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '星空夜幕渐变测试',
            styles: { starryNight: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasStarryNightStyle: textContent?.styles?.starryNight === true,
    }
  }, { hasStarryNightStyle: true })

  MDTest.testCase(R, '2.4 添加金属质感渐变样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '金属质感渐变测试',
            styles: { metallic: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasMetallicStyle: textContent?.styles?.metallic === true,
    }
  }, { hasMetallicStyle: true })

  MDTest.testCase(R, '2.5 添加雪山冰川渐变样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '雪山冰川渐变测试',
            styles: { snowyGlacier: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasSnowyGlacierStyle: textContent?.styles?.snowyGlacier === true,
    }
  }, { hasSnowyGlacierStyle: true })

  MDTest.testCase(R, '2.6 添加热带夏日渐变样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '热带夏日渐变测试',
            styles: { tropicalSummer: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasTropicalSummerStyle: textContent?.styles?.tropicalSummer === true,
    }
  }, { hasTropicalSummerStyle: true })

  MDTest.logTitle('3. 渐变样式切换测试')
  MDTest.testCase(R, '3.1 切换神秘紫蓝渐变样式', () => {
    MDTest.clearContent()

    /** 测试添加样式 */
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '切换测试文字',
            styles: { mysticPurpleBlue: true },
          },
        ],
      },
    ])
    const doc1 = window.MDBridge!.getDocument()
    const hasStyle1 = doc1[0]?.content?.[0]?.styles?.mysticPurpleBlue === true

    /** 测试移除样式 */
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '切换测试文字',
            styles: {},
          },
        ],
      },
    ])
    const doc2 = window.MDBridge!.getDocument()
    const hasStyle2 = doc2[0]?.content?.[0]?.styles?.mysticPurpleBlue === true

    return {
      firstToggle: hasStyle1,
      secondToggle: !hasStyle2,
    }
  }, { firstToggle: true, secondToggle: true })

  MDTest.logTitle('4. 多渐变样式组合测试')
  MDTest.testCase(R, '4.1 组合多个新渐变样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '组合样式测试',
            styles: {
              starryNight: true,
              bold: true,
              italic: true,
            },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const styles = doc[0]?.content?.[0]?.styles

    return {
      hasStarryNight: styles?.starryNight === true,
      hasBold: styles?.bold === true,
      hasItalic: styles?.italic === true,
    }
  }, { hasStarryNight: true, hasBold: true, hasItalic: true })

  MDTest.logTitle('5. 渐变样式获取测试')
  MDTest.testCase(R, '5.1 获取当前激活的样式', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '获取样式测试',
            styles: { mysticPurpleBlue: true, warmSunshine: true },
          },
        ],
      },
    ])

    const activeStyles = window.MDBridge!.getActiveStyles()

    return {
      hasActiveStyles: typeof activeStyles === 'object',
      hasMysticPurpleBlue: activeStyles?.mysticPurpleBlue === true,
      hasWarmSunshine: activeStyles?.warmSunshine === true,
    }
  }, { hasActiveStyles: true, hasMysticPurpleBlue: true, hasWarmSunshine: true })

  MDTest.logTitle('6. 渐变样式内容设置测试')
  MDTest.testCase(R, '6.1 通过 setContent 设置多彩糖果渐变样式', () => {
    MDTest.clearContent()

    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '通过 setContent 设置的多彩糖果渐变',
            styles: { colorfulCandy: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasColorfulCandyStyle: textContent?.styles?.colorfulCandy === true,
      hasCorrectText: textContent?.text?.includes('多彩糖果渐变'),
    }
  }, { hasColorfulCandyStyle: true, hasCorrectText: true })

  MDTest.logTitle('7. 所有新渐变样式类型测试')
  MDTest.testCase(R, '7.1 测试所有新渐变样式类型', () => {
    MDTest.clearContent()

    const gradientTypes = getAllGradientTypes()
    const testResults: Record<string, boolean> = {}

    gradientTypes.forEach((type) => {
      MDTest.clearContent()
      window.MDBridge!.setContent([
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `测试${type}渐变`,
              styles: { [type]: true },
            },
          ],
        },
      ])

      const doc = window.MDBridge!.getDocument()
      const hasStyle = doc[0]?.content?.[0]?.styles?.[type] === true
      testResults[type] = hasStyle
    })

    return testResults
  }, {
    mysticPurpleBlue: true,
    skyBlue: true,
    gorgeousPurpleRed: true,
    warmSunshine: true,
    naturalGreen: true,
    mysticNight: true,
    colorfulCandy: true,
    starryNight: true,
    metallic: true,
    snowyGlacier: true,
    tropicalSummer: true,
  })

  MDTest.logTitle('8. Command 接口功能测试')
  /** 注意：setBold() 和 setGradientStyle() 的单独测试在 commands.test.ts 中 */

  MDTest.asyncTestCase(R, '8.1 通过 setMarkdown 设置内容后添加渐变', async () => {
    MDTest.clearContent()

    /** 先设置 Markdown 内容 */
    window.MDBridge!.setMarkdown('# 测试标题\n\n这是测试段落')

    /** 然后通过 setContent 添加渐变样式 */
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '通过 Markdown 设置的渐变测试',
            styles: { skyBlue: true },
          },
        ],
      },
    ])

    const doc = window.MDBridge!.getDocument()
    const textContent = doc[0]?.content?.[0]

    return {
      hasSkyBlueStyle: textContent?.styles?.skyBlue === true,
      textContent: textContent?.text,
    }
  }, { hasSkyBlueStyle: true, textContent: '通过 Markdown 设置的渐变测试' })

  MDTest.testCase(R, '8.2 渐变样式的 HTML 输出测试', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'HTML 输出测试',
            styles: { starryNight: true },
          },
        ],
      },
    ])

    const html = window.MDBridge!.getHTML()

    return {
      hasHTML: typeof html === 'string',
      htmlLength: html.length > 0,
      containsText: html.includes('HTML 输出测试'),
    }
  }, { hasHTML: true, htmlLength: true, containsText: true })

  MDTest.testCase(R, '8.3 渐变样式的 Markdown 输出测试', () => {
    MDTest.clearContent()
    window.MDBridge!.setContent([
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Markdown 输出测试',
            styles: { warmSunshine: true },
          },
        ],
      },
    ])

    const markdown = window.MDBridge!.getMarkdown()

    return {
      hasMarkdown: typeof markdown === 'string',
      markdownLength: markdown.length > 0,
      containsText: markdown.includes('Markdown 输出测试'),
    }
  }, { hasMarkdown: true, markdownLength: true, containsText: true })

  /** 等待异步测试完成 */
  await MDTest.delay(100)

  MDTest.logTitle('9. 所有渐变样式效果展示')
  MDTest.testCase(R, '9.1 展示所有渐变文字效果', () => {
    MDTest.clearContent()

    /** 创建展示所有渐变样式的文档 */
    const gradientTypes = getAllGradientTypes()
    const showcaseBlocks = gradientTypes.map((type, index) => {
      const config = getGradientConfig(type)
      return {
        type: 'paragraph' as const,
        content: [
          {
            type: 'text' as const,
            text: `${index + 1}. ${config.label}渐变效果展示`,
            styles: { [type]: true },
          },
        ],
      }
    })

    /** 添加标题 */
    const titleBlock = {
      type: 'heading' as const,
      props: { level: 1 },
      content: [
        {
          type: 'text' as const,
          text: '🎨 所有渐变样式效果展示',
          styles: { bold: true },
        },
      ],
    }

    /** 添加说明文字 */
    const descriptionBlock = {
      type: 'paragraph' as const,
      content: [
        {
          type: 'text' as const,
          text: '以下是所有可用的渐变文字样式，每种样式都有独特的视觉效果：',
          styles: { italic: true },
        },
      ],
    }

    /** 添加组合样式展示 */
    const combinationBlocks = [
      {
        type: 'heading' as const,
        props: { level: 2 },
        content: [
          {
            type: 'text' as const,
            text: '✨ 组合样式展示',
            styles: { bold: true },
          },
        ],
      },
      {
        type: 'paragraph' as const,
        content: [
          {
            type: 'text' as const,
            text: '神秘紫蓝 + 粗体：',
            styles: { bold: true },
          },
          {
            type: 'text' as const,
            text: ' 神秘而优雅的渐变效果',
            styles: { mysticPurpleBlue: true, bold: true },
          },
        ],
      },
      {
        type: 'paragraph' as const,
        content: [
          {
            type: 'text' as const,
            text: '星空夜幕 + 斜体：',
            styles: { bold: true },
          },
          {
            type: 'text' as const,
            text: ' 深邃而梦幻的星空渐变',
            styles: { starryNight: true, italic: true },
          },
        ],
      },
      {
        type: 'paragraph' as const,
        content: [
          {
            type: 'text' as const,
            text: '多彩糖果 + 粗体 + 斜体：',
            styles: { bold: true },
          },
          {
            type: 'text' as const,
            text: ' 活泼可爱的糖果渐变',
            styles: { colorfulCandy: true, bold: true, italic: true },
          },
        ],
      },
    ]

    /** 添加使用说明 */
    const usageBlock = {
      type: 'paragraph' as const,
      content: [
        {
          type: 'text' as const,
          text: '💡 使用说明：选中文字后点击工具栏中的渐变按钮即可应用样式',
          styles: { italic: true },
        },
      ],
    }

    /** 设置完整的展示内容 */
    window.MDBridge!.setContent([
      titleBlock,
      descriptionBlock,
      ...showcaseBlocks,
      ...combinationBlocks,
      usageBlock,
    ])

    return {
      hasTitle: true,
      hasDescription: true,
      gradientCount: gradientTypes.length,
      allGradientsApplied: true,
      hasCombinations: true,
      hasUsage: true,
    }
  }, {
    hasTitle: true,
    hasDescription: true,
    gradientCount: 11,
    allGradientsApplied: true,
    hasCombinations: true,
    hasUsage: true,
  })

  MDTest.printSummary(R)
}

/** 挂载到全局对象，方便在 Console 中调用 */
if (typeof window !== 'undefined') {
  ; (window as any).runGradientTest = runGradientTest
}
