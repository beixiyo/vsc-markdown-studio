// @vitest-environment jsdom

import { Editor, type JSONContent } from '@tiptap/core'
import { afterEach, describe, expect, it } from 'vitest'
import { createExtensions } from '../create-extensions'

describe('GFM 有序列表', () => {
  let editor: Editor | undefined

  afterEach(() => editor?.destroy())

  function setup() {
    editor = new Editor({
      extensions: [
        ...createExtensions({ selection: false, hover: false, placeholder: false }),
      ],
    })
    return editor
  }

  function expectRoundtrip(markdown: string) {
    const currentEditor = setup()
    currentEditor.commands.setContent(markdown, { contentType: 'markdown' })
    const first = currentEditor.getJSON()
    const serialized = currentEditor.getMarkdown()

    currentEditor.commands.setContent(serialized, { contentType: 'markdown' })
    expect(currentEditor.getJSON()).toEqual(first)
  }

  it('四空格嵌套项保留强调与链接 inline token', () => {
    editor = setup()
    const markdown = [
      '- **合作方针**：提供框架：',
      '    1. **明确需求**：***“内容”***',
      '    2. **制定计划**：[查看标准](https://example.com)',
      '- **第二条**：正文',
    ].join('\n')

    editor.commands.setContent(markdown, { contentType: 'markdown' })

    const firstList = editor.getJSON().content?.[0] as JSONContent | undefined
    const nestedItems = firstList?.content?.[0].content?.[1].content
    expect(nestedItems?.[0].content?.[0].content).toEqual([
      { type: 'text', marks: [{ type: 'bold' }], text: '明确需求' },
      { type: 'text', text: '：' },
      { type: 'text', marks: [{ type: 'bold' }, { type: 'italic' }], text: '“内容”' },
    ])
    expect(nestedItems?.[1].content?.[0].content).toEqual([
      { type: 'text', marks: [{ type: 'bold' }], text: '制定计划' },
      { type: 'text', text: '：' },
      {
        type: 'text',
        marks: [{
          type: 'link',
          attrs: {
            href: 'https://example.com',
            target: '_blank',
            rel: 'noopener noreferrer nofollow',
            class: null,
            title: null,
          },
        }],
        text: '查看标准',
      },
    ])
  })

  it('保留非 1 起始序号', () => {
    editor = setup()

    editor.commands.setContent('3. 第三项\n4. 第四项', { contentType: 'markdown' })

    expect(editor.getJSON().content?.[0].attrs?.start).toBe(3)
  })

  it('保留 0 起始序号', () => {
    editor = setup()
    editor.commands.setContent('0. 第零项\n1. 第一项', { contentType: 'markdown' })

    expect(editor.getJSON().content?.[0].attrs?.start).toBe(0)
  })

  it('有序 task item 保留 checked 语义', () => {
    editor = setup()
    editor.commands.setContent('1. [ ] 待办\n2. [x] 完成', { contentType: 'markdown' })

    const taskList = editor.getJSON().content?.[0]
    const taskItems = taskList?.content as JSONContent[] | undefined
    expect(taskList?.type).toBe('taskList')
    expect(taskItems?.map(item => item.attrs?.checked)).toEqual([false, true])
    expect(taskItems?.map(item => item.content?.[0].content?.[0].text)).toEqual(['待办', '完成'])
  })

  it.each([
    ['有序嵌套有序', '1. 一级\n   1. 二级'],
    ['有序嵌套无序', '1. 一级\n   - 二级'],
    ['三层混合', '- 一级\n  1. 二级\n     - 三级'],
    ['两空格嵌套', '- 一级\n  1. 二级'],
    ['三空格嵌套', '- 一级\n   1. 二级'],
    ['四空格嵌套', '- 一级\n    1. 二级'],
    ['Tab 嵌套', '- 一级\n\t1. 二级'],
    ['松散多段列表', '1. 第一段\n\n   第二段\n\n2. 下一项'],
    ['列表内引用', '1. 正文\n   > 引用'],
    ['列表内 fenced code', '1. 正文\n\n   ```ts\n   const value = 1\n   ```'],
    ['双位数 marker continuation', '10. 第一行\n    continuation\n11. 下一项'],
    ['右括号 marker', '1) 第一项\n2) 第二项'],
    ['嵌套 task', '1. 普通项目\n   - [ ] 子任务'],
  ])('%s parse → serialize → parse 保持结构', (_name, markdown) => {
    expectRoundtrip(markdown)
  })
})
