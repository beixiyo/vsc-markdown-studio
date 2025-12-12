import type { Editor } from '@tiptap/core'

function run(editor: Editor | null, cb: (chain: ReturnType<Editor['chain']>) => void): boolean {
  if (!editor)
    return false

  try {
    const chain = editor?.chain?.()
    if (!chain)
      return false

    chain.focus()
    cb(chain)
    return typeof chain.run === 'function'
      ? chain.run()
      : false
  }
  catch (error) {
    console.error('执行格式化命令失败:', error)
    return false
  }
}

/**
 * 将当前块设置为标题
 */
export function setHeading(editor: Editor | null, level: 1 | 2 | 3): boolean {
  return run(editor, chain => chain.setHeading({ level }))
}

/**
 * 将当前块设置为段落
 */
export function setParagraph(editor: Editor | null): boolean {
  return run(editor, chain => chain.setParagraph())
}

/**
 * 将当前块设置为有序列表项
 */
export function setOrderedList(editor: Editor | null): boolean {
  return run(editor, chain => chain.toggleOrderedList())
}

/**
 * 将当前块设置为无序列表项
 */
export function setUnorderedList(editor: Editor | null): boolean {
  return run(editor, chain => chain.toggleBulletList())
}

/**
 * 设置选中文本为粗体
 */
export function setBold(editor: Editor | null): boolean {
  return run(editor, chain => chain.setBold?.() ?? chain.toggleBold?.())
}

/**
 * 取消选中文本的粗体
 */
export function unsetBold(editor: Editor | null): boolean {
  return run(editor, chain => chain.unsetBold())
}

/**
 * 设置选中文本为斜体
 */
export function setItalic(editor: Editor | null): boolean {
  return run(editor, chain => chain.setItalic?.() ?? chain.toggleItalic?.())
}

/**
 * 取消选中文本的斜体
 */
export function unsetItalic(editor: Editor | null): boolean {
  return run(editor, chain => chain.unsetItalic())
}

/**
 * 设置选中文本为下划线
 */
export function setUnderline(editor: Editor | null): boolean {
  return run(editor, chain => chain.setUnderline?.() ?? chain.toggleUnderline?.())
}

/**
 * 取消选中文本的下划线
 */
export function unsetUnderline(editor: Editor | null): boolean {
  return run(editor, chain => chain.unsetUnderline())
}

/**
 * 将当前块设置为检查列表项
 */
export function setCheckList(editor: Editor | null): boolean {
  return run(editor, chain => chain.toggleTaskList())
}
