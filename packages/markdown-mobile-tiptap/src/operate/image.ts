import type { Editor, JSONContent } from '@tiptap/core'
import { notifyNative } from 'notify'

/**
 * 判断 JSON 节点是否为"空段落"
 * 规则：type 为 paragraph，且 content 为空或仅含空白文本
 */
export function isEmptyParagraphJSON(node: JSONContent | undefined | null): boolean {
  if (!node || node.type !== 'paragraph')
    return false
  const content = node.content
  if (!content || content.length === 0)
    return true
  return content.every(item => item.type === 'text' && (!item.text || item.text.trim() === ''))
}

/** 基础图片节点工厂 */
function imageNode(url: string): JSONContent {
  return { type: 'image', attrs: { src: url, alt: '', title: null } }
}

/** 空段落节点（末尾占位用） */
function emptyParagraph(): JSONContent {
  return { type: 'paragraph' }
}

/**
 * 顶部插入：先移除文档开头的连续图片节点，再把新图片插入最前面
 * 如果剩余第一个块是空段落，则丢弃
 */
export async function insertAtTop(editor: Editor, urls: string[]): Promise<void> {
  try {
    const doc = editor.getJSON()
    const children = Array.isArray(doc.content)
      ? doc.content.slice()
      : []

    /** 从头剥离连续 image */
    let headerCount = 0
    while (headerCount < children.length && children[headerCount].type === 'image') {
      headerCount++
    }
    let rest = children.slice(headerCount)

    /** 丢弃第一个空段落 */
    let removedEmptyBlock = false
    if (rest.length > 0 && isEmptyParagraphJSON(rest[0])) {
      rest = rest.slice(1)
      removedEmptyBlock = true
    }

    const newImages = urls.map(imageNode)
    const newChildren = [...newImages, ...rest]
    if (newChildren.length === 0)
      newChildren.push(emptyParagraph())

    editor.commands.setContent({ type: 'doc', content: newChildren })

    notifyNative('headerImagesWithURLSet', {
      imageCount: urls.length,
      totalBlocks: newChildren.length,
      imageUrls: urls,
      removedEmptyBlock,
    })
  }
  catch (error) {
    notifyNative('setHeaderImagesWithURLError', {
      error: error instanceof Error
        ? error.message
        : 'Unknown error',
      imageCount: urls.length,
    })
    throw error
  }
}

/**
 * 底部插入：先移除文档末尾的连续图片节点，再把新图片追加到末尾
 * 如果剩余最后一个块是空段落，则丢弃
 */
export async function insertAtBottom(editor: Editor, urls: string[]): Promise<void> {
  try {
    const doc = editor.getJSON()
    let children = Array.isArray(doc.content)
      ? doc.content.slice()
      : []

    /** 先剥离 ProseMirror 可能追加的末尾空段落 */
    while (children.length > 0 && isEmptyParagraphJSON(children[children.length - 1])) {
      children = children.slice(0, -1)
    }

    let footerStart = children.length
    while (footerStart > 0 && children[footerStart - 1].type === 'image') {
      footerStart--
    }
    let rest = children.slice(0, footerStart)

    let removedEmptyBlock = false
    if (rest.length > 0 && isEmptyParagraphJSON(rest[rest.length - 1])) {
      rest = rest.slice(0, -1)
      removedEmptyBlock = true
    }

    const newImages = urls.map(imageNode)
    const newChildren = [...rest, ...newImages]
    if (newChildren.length === 0)
      newChildren.push(emptyParagraph())

    editor.commands.setContent({ type: 'doc', content: newChildren })

    notifyNative('imagesWithURLSet', {
      imageCount: urls.length,
      totalBlocks: newChildren.length,
      imageUrls: urls,
      removedEmptyBlock,
    })
  }
  catch (error) {
    notifyNative('setImagesWithURLError', {
      error: error instanceof Error
        ? error.message
        : 'Unknown error',
      imageCount: urls.length,
    })
    throw error
  }
}

/**
 * 光标位置插入图片
 */
export async function appendAtCursor(editor: Editor, urls: string[]): Promise<void> {
  try {
    const nodes = urls.map(imageNode)
    editor.chain().focus().insertContent(nodes).run()

    const totalBlocks = editor.getJSON().content?.length ?? 0
    notifyNative('imagesSet', {
      imageCount: urls.length,
      totalBlocks,
      removedEmptyBlock: false,
    })
  }
  catch (error) {
    notifyNative('setImagesError', {
      error: error instanceof Error
        ? error.message
        : 'Unknown error',
      imageCount: urls.length,
    })
    throw error
  }
}
