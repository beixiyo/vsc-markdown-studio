import { describe, expect, it } from 'vitest'
import { createTiptapOperate, resolveBlockTypeString } from '../operate/create'
import { makeEditor } from './helpers'

describe('createTiptapOperate', () => {
  it('getHTML / setHTML', () => {
    const { editor, cleanup } = makeEditor('<p>hello</p>')
    const op = createTiptapOperate(editor)
    expect(op.getHTML()).toContain('<p>hello</p>')
    op.setHTML('<h1>hi</h1>')
    expect(op.getHTML()).toContain('<h1>hi</h1>')
    cleanup()
  })

  it('isEmpty / focus / isEditable', () => {
    const { editor, cleanup } = makeEditor('')
    const op = createTiptapOperate(editor)
    expect(op.isEmpty()).toBe(true)
    op.setHTML('<p>x</p>')
    expect(op.isEmpty()).toBe(false)
    expect(op.isEditable()).toBe(true)
    op.setEditable(false)
    expect(op.isEditable()).toBe(false)
    cleanup()
  })

  it('insertText', () => {
    const { editor, cleanup } = makeEditor('<p></p>')
    const op = createTiptapOperate(editor)
    op.insertText('hello')
    expect(op.getHTML()).toContain('hello')
    cleanup()
  })

  it('getSelectedText', () => {
    const { editor, cleanup } = makeEditor('<p>hello world</p>')
    editor.commands.setTextSelection({ from: 1, to: 6 })
    const op = createTiptapOperate(editor)
    expect(op.getSelectedText()).toBe('hello')
    cleanup()
  })

  it('bold mark via command + getActiveStyles', () => {
    const { editor, cleanup } = makeEditor('<p>hello</p>')
    editor.commands.setTextSelection({ from: 1, to: 6 })
    const op = createTiptapOperate(editor)
    op.command.setBold()
    expect(op.getActiveStyles().bold).toBe(true)
    op.command.unsetBold()
    expect(op.getActiveStyles().bold).toBeUndefined()
    cleanup()
  })

  it('setHeading / setParagraph and block type reporting', () => {
    const { editor, cleanup } = makeEditor('<p>hi</p>')
    const op = createTiptapOperate(editor)
    op.command.setHeading(2)
    expect(resolveBlockTypeString(editor)).toBe('h2')
    op.command.setParagraph()
    expect(resolveBlockTypeString(editor)).toBe('paragraph')
    cleanup()
  })

  it('createLink / getSelectedLinkUrl', () => {
    const { editor, cleanup } = makeEditor('<p>click me</p>')
    editor.commands.setTextSelection({ from: 1, to: 9 })
    const op = createTiptapOperate(editor)
    op.createLink('https://example.com')
    expect(op.getSelectedLinkUrl()).toBe('https://example.com')
    cleanup()
  })

  it('undo / redo round-trip', () => {
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

  it('resolveBlockTypeString recognises list variants', () => {
    const { editor, cleanup } = makeEditor('<ul><li><p>a</p></li></ul>')
    editor.commands.setTextSelection(2)
    expect(resolveBlockTypeString(editor)).toBe('unordered_list')
    cleanup()
  })

  it('resolveBlockTypeString recognises ordered list', () => {
    const { editor, cleanup } = makeEditor('<ol><li><p>a</p></li></ol>')
    editor.commands.setTextSelection(2)
    expect(resolveBlockTypeString(editor)).toBe('ordered_list')
    cleanup()
  })

  it('resolveBlockTypeString recognises task list', () => {
    const { editor, cleanup } = makeEditor('<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox" /></label><div><p>a</p></div></li></ul>')
    editor.commands.setTextSelection(3)
    expect(resolveBlockTypeString(editor)).toBe('check_list')
    cleanup()
  })
})
