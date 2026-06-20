import { createMarkdownOperate } from 'tiptap-api'
import { describe, expect, it } from 'vitest'
import { createTiptapOperate } from '../operate/create'
import { makeEditor } from './helpers'

/**
 * 验证 createTiptapOperate 正确复用 tiptap-api 的 createMarkdownOperate，
 * 且 getMarkdown 返回真正的 Markdown 而非 HTML
 */
describe('tiptap-api 复用验证', () => {
  /** 从 createMarkdownOperate 取出所有 key，排除被 mobile 覆盖的 */
  const REUSED_KEYS = [
    'getSelectedText',
    'insertText',
    'getSelectedLinkUrl',
    'focus',
    'isEditable',
    'setEditable',
    'isEmpty',
    'undo',
    'redo',
  ] as const

  const REUSED_COMMAND_KEYS = [
    'setHeading',
    'setParagraph',
    'setOrderedList',
    'setUnorderedList',
    'setCheckList',
    'setBold',
    'unsetBold',
    'setItalic',
    'unsetItalic',
    'setUnderline',
    'unsetUnderline',
  ] as const

  it('复用的顶层方法均存在于 createMarkdownOperate 且类型匹配', () => {
    const { editor, cleanup } = makeEditor('<p>test</p>')
    const mobile = createTiptapOperate(editor)
    const base = createMarkdownOperate(editor)

    for (const key of REUSED_KEYS) {
      expect(typeof mobile[key], `${key} 应为 function`).toBe('function')
      expect(typeof base[key], `base.${key} 应为 function`).toBe('function')
    }

    cleanup()
  })

  it('复用的 command 方法均存在于 createMarkdownOperate 且类型匹配', () => {
    const { editor, cleanup } = makeEditor('<p>test</p>')
    const mobile = createTiptapOperate(editor)
    const base = createMarkdownOperate(editor)

    for (const key of REUSED_COMMAND_KEYS) {
      expect(typeof mobile.command[key], `command.${key} 应为 function`).toBe('function')
      expect(typeof base.command[key], `base.command.${key} 应为 function`).toBe('function')
    }

    cleanup()
  })

  it('createMarkdownOperate 的通用字段未被 mobile 遗漏', () => {
    const { editor, cleanup } = makeEditor('<p>test</p>')
    const mobile = createTiptapOperate(editor)
    const base = createMarkdownOperate(editor)

    const baseKeys = Object.keys(base).filter(k => k !== 'command')
    for (const key of baseKeys) {
      expect(key in mobile, `base 的 ${key} 应存在于 mobile`).toBe(true)
    }

    const baseCommandKeys = Object.keys(base.command)
    for (const key of baseCommandKeys) {
      expect(key in mobile.command, `base.command.${key} 应存在于 mobile.command`).toBe(true)
    }

    cleanup()
  })

  it('mobile 独有方法存在且可调用', () => {
    const { editor, cleanup } = makeEditor('<p>test</p>')
    const mobile = createTiptapOperate(editor)

    const mobileOnly = [
      'getActiveStyles',
      'toggleStyles',
      'removeStyles',
      'addStyles',
      'onUpdate',
      'canNestBlock',
      'nestBlock',
      'canUnnestBlock',
      'unnestBlock',
      'getBlockTypeString',
    ] as const

    for (const key of mobileOnly) {
      expect(typeof mobile[key], `${key} 应为 function`).toBe('function')
    }

    const mobileOnlyCommands = ['toggleBold', 'toggleItalic', 'toggleUnderline', 'setGradient', 'unsetGradient'] as const
    for (const key of mobileOnlyCommands) {
      expect(typeof mobile.command[key], `command.${key} 应为 function`).toBe('function')
    }

    cleanup()
  })
})

describe('getMarkdown 返回真正的 Markdown', () => {
  it('标题返回 # 语法而非 <h1> 标签', () => {
    const { editor, cleanup } = makeEditor('<h1>Hello</h1>')
    const op = createTiptapOperate(editor)
    const md = op.getMarkdown()
    expect(md).toContain('# Hello')
    expect(md).not.toContain('<h1>')
    cleanup()
  })

  it('加粗返回 ** 语法而非 <strong> 标签', () => {
    const { editor, cleanup } = makeEditor('<p><strong>bold text</strong></p>')
    const op = createTiptapOperate(editor)
    const md = op.getMarkdown()
    expect(md).toContain('**bold text**')
    expect(md).not.toContain('<strong>')
    cleanup()
  })

  it('斜体返回 * 语法而非 <em> 标签', () => {
    const { editor, cleanup } = makeEditor('<p><em>italic</em></p>')
    const op = createTiptapOperate(editor)
    const md = op.getMarkdown()
    expect(md).toContain('*italic*')
    expect(md).not.toContain('<em>')
    cleanup()
  })

  it('多级标题均返回 Markdown 语法', () => {
    const { editor, cleanup } = makeEditor('<h1>H1</h1><h2>H2</h2><h3>H3</h3>')
    const op = createTiptapOperate(editor)
    const md = op.getMarkdown()
    expect(md).toContain('# H1')
    expect(md).toContain('## H2')
    expect(md).toContain('### H3')
    expect(md).not.toMatch(/<h[1-3]>/)
    cleanup()
  })

  it('无序列表返回 - 语法而非 <ul><li> 标签', () => {
    const { editor, cleanup } = makeEditor('<ul><li><p>item a</p></li><li><p>item b</p></li></ul>')
    const op = createTiptapOperate(editor)
    const md = op.getMarkdown()
    expect(md).toContain('- item a')
    expect(md).toContain('- item b')
    expect(md).not.toContain('<ul>')
    expect(md).not.toContain('<li>')
    cleanup()
  })

  it('有序列表返回数字语法', () => {
    const { editor, cleanup } = makeEditor('<ol><li><p>first</p></li><li><p>second</p></li></ol>')
    const op = createTiptapOperate(editor)
    const md = op.getMarkdown()
    expect(md).toMatch(/1\.\s+first/)
    expect(md).toMatch(/2\.\s+second/)
    expect(md).not.toContain('<ol>')
    cleanup()
  })

  it('混合内容完整往返', () => {
    const input = '# Title\n\nA paragraph with **bold** and *italic*.\n\n- list item'
    const { editor, cleanup } = makeEditor('')
    const op = createTiptapOperate(editor)
    op.setMarkdown(input)
    const md = op.getMarkdown()
    expect(md).toContain('# Title')
    expect(md).toContain('**bold**')
    expect(md).toContain('*italic*')
    expect(md).toContain('- list item')
    expect(md).not.toMatch(/<[a-z]+>/)
    cleanup()
  })

  it('空文档返回空字符串', () => {
    const { editor, cleanup } = makeEditor('')
    const op = createTiptapOperate(editor)
    const md = op.getMarkdown()
    expect(md.trim()).toBe('')
    cleanup()
  })

  it('setMarkdown → getMarkdown 往返不丢内容', () => {
    const source = '## Section\n\nHello **world**.\n\n1. one\n2. two\n\n> blockquote'
    const { editor, cleanup } = makeEditor('')
    const op = createTiptapOperate(editor)
    op.setMarkdown(source)
    const result = op.getMarkdown()
    expect(result).toContain('## Section')
    expect(result).toContain('**world**')
    expect(result).toMatch(/1\.\s+one/)
    expect(result).toMatch(/2\.\s+two/)
    expect(result).toContain('> blockquote')
    cleanup()
  })

  it('水平线返回 --- 语法', () => {
    const { editor, cleanup } = makeEditor('<hr>')
    const op = createTiptapOperate(editor)
    const md = op.getMarkdown()
    expect(md).toMatch(/---/)
    expect(md).not.toContain('<hr')
    cleanup()
  })
})

describe('getHTML / setHTML 仍正常工作', () => {
  it('getHTML 返回 HTML 字符串', () => {
    const { editor, cleanup } = makeEditor('<p>hello</p>')
    const op = createTiptapOperate(editor)
    expect(op.getHTML()).toContain('<p>hello</p>')
    cleanup()
  })

  it('setHTML 设置后 getHTML 可取回', () => {
    const { editor, cleanup } = makeEditor('')
    const op = createTiptapOperate(editor)
    op.setHTML('<h1>title</h1>')
    expect(op.getHTML()).toContain('<h1>title</h1>')
    cleanup()
  })
})

describe('复用方法的行为验证', () => {
  it('getSelectedText 复用后行为不变', () => {
    const { editor, cleanup } = makeEditor('<p>hello world</p>')
    editor.commands.setTextSelection({ from: 1, to: 6 })
    const op = createTiptapOperate(editor)
    expect(op.getSelectedText()).toBe('hello')
    cleanup()
  })

  it('isEmpty / isEditable / setEditable 复用后行为不变', () => {
    const { editor, cleanup } = makeEditor('')
    const op = createTiptapOperate(editor)
    expect(op.isEmpty()).toBe(true)
    expect(op.isEditable()).toBe(true)
    op.setEditable(false)
    expect(op.isEditable()).toBe(false)
    cleanup()
  })

  it('undo / redo 复用后行为不变', () => {
    const { editor, cleanup } = makeEditor('<p>a</p>')
    const op = createTiptapOperate(editor)
    op.insertText('bcd')
    const afterInsert = op.getHTML()
    op.undo()
    expect(op.getHTML()).not.toBe(afterInsert)
    op.redo()
    expect(op.getHTML()).toBe(afterInsert)
    cleanup()
  })

  it('command.setHeading / setParagraph 复用后行为不变', () => {
    const { editor, cleanup } = makeEditor('<p>hi</p>')
    const op = createTiptapOperate(editor)
    op.command.setHeading(2)
    expect(op.getHTML()).toContain('<h2>')
    op.command.setParagraph()
    expect(op.getHTML()).toContain('<p>')
    expect(op.getHTML()).not.toContain('<h2>')
    cleanup()
  })

  it('command.setBold / unsetBold 复用后行为不变', () => {
    const { editor, cleanup } = makeEditor('<p>hello</p>')
    editor.commands.setTextSelection({ from: 1, to: 6 })
    const op = createTiptapOperate(editor)
    op.command.setBold()
    expect(op.getHTML()).toContain('<strong>')
    op.command.unsetBold()
    expect(op.getHTML()).not.toContain('<strong>')
    cleanup()
  })

  it('createLink / getSelectedLinkUrl 覆盖后行为正确', () => {
    const { editor, cleanup } = makeEditor('<p>click me</p>')
    editor.commands.setTextSelection({ from: 1, to: 9 })
    const op = createTiptapOperate(editor)
    op.createLink('https://example.com')
    expect(op.getSelectedLinkUrl()).toBe('https://example.com')
    cleanup()
  })
})
