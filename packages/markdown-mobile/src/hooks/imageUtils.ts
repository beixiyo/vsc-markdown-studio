/**
 * 图片工具函数：处理图片块的创建和插入
 */
import type { BlockNoteEditor } from '@blocknote/core'
import { notifyNative } from 'notify'

/**
 * 图片块属性类型
 */
type ImageBlockProps = {
  url: string
  caption: string
  previewWidth: number
  textAlignment: 'center' | 'left' | 'right'
}

/**
 * 图片块类型
 */
type ImageBlock = {
  type: 'image'
  props: ImageBlockProps
}

/**
 * 判断 block 是否为空白文本节点
 */
function isEmptyTextBlock(block: any): boolean {
  // 检查是否为段落类型
  if (block.type !== 'paragraph') {
    return false
  }

  // 检查 content 是否为空或不存在
  if (!block.content || block.content.length === 0) {
    return true
  }

  // 检查 content 中是否只包含空白内容
  const hasOnlyEmptyContent = block.content.every((item: any) => {
    if (item.type === 'text') {
      // 检查文本是否为空或只包含空白字符
      return !item.text || item.text.trim() === ''
    }
    // 如果不是 text 类型，认为不是空白内容
    return false
  })

  return hasOnlyEmptyContent
}

/**
 * 将 URL 数组解析为图片块
 * @param urls 图片URL数组
 */
export function parseImagesToBlocks(urls: string[]): ImageBlock[] {
  return urls.map(u => ({
    type: 'image',
    props: {
      url: u,
      caption: '',
      previewWidth: 512,
      textAlignment: 'center',
    },
  }))
}

/**
 * 在文档顶部插入块
 */
export async function insertAtTop(editor: BlockNoteEditor, blocks: ImageBlock[]) {
  try {
    // 移除之前的头部图片块（通过位置识别：文档开头的连续图片块）
    const allBlocks = Array.from(editor.document)
    const headerBlockIds: string[] = []

    // 从文档开头开始，找到所有连续的图片块
    for (const block of allBlocks) {
      if (block.type === 'image') {
        headerBlockIds.push(block.id)
      } else {
        // 遇到非图片块就停止
        break
      }
    }

    // 获取所有非图片块（包括其他位置的图片）
    let nonImageBlocks = allBlocks.filter(block => !headerBlockIds.includes(block.id))

    // 检查第一个非图片节点是否为空白文本节点，如果是就删除
    if (nonImageBlocks.length > 0) {
      const firstBlock = nonImageBlocks[0]
      if (isEmptyTextBlock(firstBlock)) {
        nonImageBlocks = nonImageBlocks.slice(1)
      }
    }

    if (headerBlockIds.length > 0) {
      editor.removeBlocks(headerBlockIds)
    }

    // 如果没有非图片内容，创建一个空段落
    if (nonImageBlocks.length === 0) {
      nonImageBlocks = [{
        id: `paragraph-${Date.now()}`,
        type: 'paragraph',
        props: {},
        content: [],
        children: [],
      } as any]
    }

    // 合并 blocks：新图片 + 非图片内容
    const newBlocks = [...blocks, ...nonImageBlocks] as any

    if (allBlocks.length === 0) {
      // 如果文档为空，直接替换
      editor.replaceBlocks([], newBlocks)
    } else {
      // 替换所有 blocks
      editor.replaceBlocks(allBlocks, newBlocks)
    }

    // 提取图片 URL 数组
    const imageUrls = blocks.map(block => block.props.url)

    // 通知 native 图片设置成功（与原版 headerImagesWithURLSet 一致）
    notifyNative('headerImagesWithURLSet', {
      imageCount: blocks.length,
      totalBlocks: newBlocks.length,
      imageUrls,
      removedEmptyBlock: allBlocks.length - nonImageBlocks.length > blocks.length ? true : false,
    })
  } catch (error) {
    // 通知 native 图片设置失败（与原版 setHeaderImagesWithURLError 一致）
    notifyNative('setHeaderImagesWithURLError', {
      error: error instanceof Error ? error.message : 'Unknown error',
      imageCount: blocks.length,
    })
    throw error
  }
}

/**
 * 在文档底部插入块
 */
export async function insertAtBottom(editor: BlockNoteEditor, blocks: ImageBlock[]) {
  try {
    // 移除之前的底部图片块（通过位置识别：文档末尾的连续图片块）
    const allBlocks = Array.from(editor.document)
    const footerBlockIds: string[] = []

    // 从文档末尾开始，找到所有连续的图片块
    for (let i = allBlocks.length - 1; i >= 0; i--) {
      const block = allBlocks[i]
      if (block.type === 'image') {
        footerBlockIds.unshift(block.id) // 保持顺序
      } else {
        // 遇到非图片块就停止
        break
      }
    }

    // 获取所有非图片块（包括其他位置的图片）
    let nonImageBlocks = allBlocks.filter(block => !footerBlockIds.includes(block.id))

    // 检查最后一个非图片节点是否为空白文本节点，如果是就删除
    if (nonImageBlocks.length > 0) {
      const lastBlock = nonImageBlocks[nonImageBlocks.length - 1]
      if (isEmptyTextBlock(lastBlock)) {
        nonImageBlocks = nonImageBlocks.slice(0, -1)
      }
    }

    if (footerBlockIds.length > 0) {
      editor.removeBlocks(footerBlockIds)
    }

    // 如果没有非图片内容，创建一个空段落
    if (nonImageBlocks.length === 0) {
      nonImageBlocks = [{
        id: `paragraph-${Date.now()}`,
        type: 'paragraph',
        props: {},
        content: [],
        children: [],
      } as any]
    }

    // 合并 blocks：非图片内容 + 新图片
    const newBlocks = [...nonImageBlocks, ...blocks] as any

    if (allBlocks.length === 0) {
      // 如果文档为空，直接替换
      editor.replaceBlocks([], newBlocks)
    } else {
      // 替换所有 blocks
      editor.replaceBlocks(allBlocks, newBlocks)
    }

    // 提取图片 URL 数组
    const imageUrls = blocks.map(block => block.props.url)

    // 通知 native 图片设置成功（与原版 imagesWithURLSet 一致）
    notifyNative('imagesWithURLSet', {
      imageCount: blocks.length,
      totalBlocks: newBlocks.length,
      imageUrls,
      removedEmptyBlock: allBlocks.length - nonImageBlocks.length > blocks.length ? true : false,
    })
  } catch (error) {
    // 通知 native 图片设置失败（与原版 setImagesWithURLError 一致）
    notifyNative('setImagesWithURLError', {
      error: error instanceof Error ? error.message : 'Unknown error',
      imageCount: blocks.length,
    })
    throw error
  }
}

/**
 * 插入元素到当前光标位置
 */
export async function appendElements(editor: BlockNoteEditor, blocks: ImageBlock[]) {
  try {
    const currentBlock = editor.getTextCursorPosition().block

    if (currentBlock) {
      editor.insertBlocks(blocks as any, currentBlock.id, 'after')
    } else {
      // 如果获取光标位置失败，插入到文档末尾
      if (editor.document.length === 0) {
        editor.replaceBlocks([], blocks as any)
      } else {
        const lastId = editor.document[editor.document.length - 1].id
        editor.insertBlocks(blocks as any, lastId, 'after')
      }
    }

    // 获取插入后的总 blocks 数量
    const totalBlocks = editor.document.length

    // 通知 native 图片设置成功（使用 imagesSet，与原版 base64 版本的 setImages 保持一致）
    notifyNative('imagesSet', {
      imageCount: blocks.length,
      totalBlocks,
      removedEmptyBlock: false, // 当前位置插入不涉及移除空块
    })
  } catch (error) {
    // 通知 native 图片设置失败（与原版 setImagesError 一致）
    notifyNative('setImagesError', {
      error: error instanceof Error ? error.message : 'Unknown error',
      imageCount: blocks.length,
    })
    throw error
  }
}


