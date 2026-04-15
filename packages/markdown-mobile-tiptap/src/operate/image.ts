import type { Editor, JSONContent } from '@tiptap/core'
import type { ImageAttrs } from 'tiptap-nodes/image'
import { notifyNative } from 'notify'
import { generateImageId } from 'tiptap-nodes/image'

/**
 * 视觉预设
 * - `block`：每张独占一行，8px 圆角，上下 2rem 间距（老 setImagesWithURL 的观感）
 * - `inline`：与文字同高（1em），垂直居中，不换行（适合表情、行内图标）
 */
export type ImagePreset = 'block' | 'inline'

/** 插入位置 */
export type ImageInsertAt = 'top' | 'bottom' | 'cursor'

/**
 * 每项图片：`src` 必填，其他字段可覆盖预设
 */
export type ImageItem = Partial<ImageAttrs> & { src: string }

/** setImage 的完整入参 */
export interface SetImagePayload {
  /** 插入位置 */
  at: ImageInsertAt
  /** 图片列表 */
  images: ImageItem[]
  /**
   * 视觉预设，不传默认 `block`
   * 单项 `images[i]` 里的字段会覆盖同名预设字段
   */
  preset?: ImagePreset
}

const PRESET_ATTRS: Record<ImagePreset, Partial<ImageAttrs>> = {
  block: {
    display: 'block',
    borderRadius: '8px',
    margin: '0.5rem 0.1rem',
  },
  inline: {
    display: 'inline',
    height: '1em',
    verticalAlign: 'middle',
  },
}

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

/**
 * 合并预设与单项 attrs，生成 image 节点 JSON
 * 若调用方未传 id，就在这里补 —— 确保 `setImage` 能同步回传确定的 ids
 */
function imageNode(item: ImageItem, preset: ImagePreset): JSONContent {
  const id = item.id ?? generateImageId()
  return {
    type: 'image',
    attrs: {
      ...PRESET_ATTRS[preset],
      ...item,
      id,
    },
  }
}

/**
 * image 是 inline 节点，doc 的直接子节点必须是 block
 * 把每张图各自包进一个 paragraph，达到"独占一行"的视觉
 */
function wrapInParagraph(node: JSONContent): JSONContent {
  return { type: 'paragraph', content: [node] }
}

/** 空段落节点（末尾占位用） */
function emptyParagraph(): JSONContent {
  return { type: 'paragraph' }
}

/**
 * 判断是否为"图片段落"：仅包含 image 节点的 paragraph
 * top/bottom 插入时，这种段落被视作"已有图片块"，会被替换
 */
function isImageOnlyParagraph(node: JSONContent | undefined | null): boolean {
  if (!node || node.type !== 'paragraph')
    return false
  const content = node.content
  return Array.isArray(content) && content.length > 0 && content.every(c => c.type === 'image')
}

function insertAtTop(editor: Editor, nodes: JSONContent[]) {
  const doc = editor.getJSON()
  const children = Array.isArray(doc.content)
    ? doc.content.slice()
    : []

  /** 从头剥离连续"图片段落" */
  let headerCount = 0
  while (headerCount < children.length && isImageOnlyParagraph(children[headerCount]))
    headerCount++
  let rest = children.slice(headerCount)

  /** 丢弃紧随其后的空段落 */
  if (rest.length > 0 && isEmptyParagraphJSON(rest[0]))
    rest = rest.slice(1)

  const newChildren = [...nodes.map(wrapInParagraph), ...rest]
  if (newChildren.length === 0)
    newChildren.push(emptyParagraph())

  editor.commands.setContent({ type: 'doc', content: newChildren })
}

function insertAtBottom(editor: Editor, nodes: JSONContent[]) {
  const doc = editor.getJSON()
  let children = Array.isArray(doc.content)
    ? doc.content.slice()
    : []

  /** 先剥离末尾空段落 */
  while (children.length > 0 && isEmptyParagraphJSON(children[children.length - 1]))
    children = children.slice(0, -1)

  /** 从尾部剥离连续"图片段落" */
  let footerStart = children.length
  while (footerStart > 0 && isImageOnlyParagraph(children[footerStart - 1]))
    footerStart--
  let rest = children.slice(0, footerStart)

  if (rest.length > 0 && isEmptyParagraphJSON(rest[rest.length - 1]))
    rest = rest.slice(0, -1)

  const newChildren = [...rest, ...nodes.map(wrapInParagraph)]
  if (newChildren.length === 0)
    newChildren.push(emptyParagraph())

  editor.commands.setContent({ type: 'doc', content: newChildren })
}

function insertAtCursor(editor: Editor, nodes: JSONContent[]) {
  editor.chain().focus().insertContent(nodes).run()
}

/**
 * 插入图片的统一入口
 *
 * 成功触发 `imageInserted`，失败触发 `imageInsertError`
 */
export async function setImage(editor: Editor, payload: SetImagePayload): Promise<void> {
  const { at, images, preset = 'block' } = payload
  const list = Array.isArray(images)
    ? images.filter(i => i && typeof i.src === 'string' && i.src.length > 0)
    : []

  try {
    if (list.length === 0) {
      notifyNative('imageInsertError', { at, preset, error: 'images is empty' })
      return
    }

    /** 提前构造节点 —— 内部会补齐 id，后续事件回传 ids 与 Native 一致 */
    const nodes = list.map(i => imageNode(i, preset))
    const ids = nodes.map(n => n.attrs!.id as string)

    if (at === 'top')
      insertAtTop(editor, nodes)
    else if (at === 'bottom')
      insertAtBottom(editor, nodes)
    else
      insertAtCursor(editor, nodes)

    notifyNative('imageInserted', { at, preset, ids })
  }
  catch (error) {
    notifyNative('imageInsertError', {
      at,
      preset,
      error: error instanceof Error
        ? error.message
        : 'Unknown error',
    })
    throw error
  }
}

/** 按 id 查找图片节点当前 pos；找不到返回 null */
function findImagePosById(editor: Editor, id: string): number | null {
  let found: number | null = null
  editor.state.doc.descendants((node, pos) => {
    if (found !== null)
      return false
    if (node.type.name === 'image' && node.attrs.id === id) {
      found = pos
      return false
    }
    return true
  })
  return found
}

/** 按 id 读取图片完整 attrs；找不到返回 null */
export function getImageAttrsById(editor: Editor, id: string): ImageAttrs | null {
  const pos = findImagePosById(editor, id)
  if (pos === null)
    return null
  const node = editor.state.doc.nodeAt(pos)
  return node
    ? (node.attrs as ImageAttrs)
    : null
}

/**
 * 按 id 更新图片属性（局部合并，未传字段保持原值）
 */
export async function updateImageById(
  editor: Editor,
  id: string,
  patch: Partial<ImageAttrs>,
): Promise<boolean> {
  const pos = findImagePosById(editor, id)
  if (pos === null)
    return false
  const node = editor.state.doc.nodeAt(pos)
  if (!node)
    return false
  const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    ...patch,
    id,
  })
  editor.view.dispatch(tr)
  return true
}

/**
 * 按 id 删除图片节点
 */
export async function removeImageById(editor: Editor, id: string): Promise<boolean> {
  const pos = findImagePosById(editor, id)
  if (pos === null)
    return false
  const node = editor.state.doc.nodeAt(pos)
  if (!node)
    return false
  const tr = editor.state.tr.delete(pos, pos + node.nodeSize)
  editor.view.dispatch(tr)
  return true
}
