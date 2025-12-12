import type { Editor } from '@tiptap/core'

/**
 * 创建链接，如果当前有选中文本则仅设置 mark，否则插入文本并设置 mark
 * @param editor Tiptap 编辑器实例
 * @param url 链接地址
 * @param text 可选的链接文本
 */
export function createLink(
  editor: Editor | null,
  url: string,
  text?: string
): boolean {
  if (!editor) return false
  if (!url) return false

  try {
    const chain = (editor as any)?.chain?.()
    if (!chain) return false

    chain.focus().extendMarkRange('link')
    chain.setLink({ href: url })

    if (text) {
      chain.insertContent(text)
    }

    return chain.run()
  } catch (error) {
    console.error('创建链接失败:', error)
    return false
  }
}

/**
 * 获取当前选中的链接地址
 */
export function getSelectedLinkUrl(editor: Editor | null): string | null {
  if (!editor) return null

  try {
    const attrs = (editor as any)?.getAttributes?.('link')
    if (attrs?.href) {
      return String(attrs.href)
    }
    return null
  } catch (error) {
    console.error('获取链接地址失败:', error)
    return null
  }
}


