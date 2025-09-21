import { describe, expect, it } from 'vitest'

describe('labelInputBlock', () => {
  it('应该正确创建 LabelInput 块', () => {
    const block = {
      type: 'labelInput',
      props: {
        label: '测试标签',
      },
      content: [
        {
          type: 'text',
          text: '测试内容',
          styles: {},
        },
      ],
    }

    expect(block.type).toBe('labelInput')
    expect(block.props.label).toBe('测试标签')
    expect(block.content).toHaveLength(1)
    expect(block.content[0].text).toBe('测试内容')
  })

  it('应该支持默认属性值', () => {
    const block = {
      type: 'labelInput',
      props: {
        label: '默认标签',
      },
      content: [],
    }

    expect(block.props.label).toBe('默认标签')
  })

  it('应该支持富文本内容', () => {
    const block = {
      type: 'labelInput',
      props: {
        label: '富文本测试',
      },
      content: [
        {
          type: 'text',
          text: '粗体文本',
          styles: { bold: true },
        },
        {
          type: 'text',
          text: ' 斜体文本',
          styles: { italic: true },
        },
      ],
    }

    expect(block.content).toHaveLength(2)
    expect(block.content[0].styles.bold).toBe(true)
    expect(block.content[1].styles.italic).toBe(true)
  })
})
