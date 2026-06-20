/**
 * BlockId 扩展：给每个顶层块挂一个**稳定** id
 *
 * 这是块级 id-diff 同步的身份基石 —— 内容 hash 改一个字就变，无法跨版本认人；
 * 稳定 id 让「同一个块」在多次保存间可被精确匹配（替换 vs 新增 vs 删除 / 重排）
 *
 * 关键设计（对齐 image 节点踩过的坑）：
 * 1. id 默认**不渲染进 HTML / Markdown**（`keepInHTML: false`），只活在 PM state；
 *    但 `getJSON()` 天然带上它（toJSON 不受 rendered 影响）—— 所以**存 JSON 即可跨重载稳定**，
 *    存纯 markdown 则丢 id（这正是可行性报告里那个「存储格式」决策点）
 * 2. id 生成不用 `crypto.randomUUID`（WebView 非 secure context 不可用），用 Math.random fallback
 * 3. appendTransaction 兜底补 id，并对**重复 id**（块被分裂 / 复制）二次重发
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { randomId, SYNTHETIC_ID_PREFIX } from './id'

/** 标记由本扩展补 id 产生的事务，避免下一轮 appendTransaction 二次整篇遍历 */
const BACKFILL_META = 'blockIdBackfill'

/** 默认挂 id 的顶层块类型 */
export const DEFAULT_BLOCK_ID_TYPES = [
  'paragraph',
  'heading',
  'blockquote',
  'codeBlock',
  'bulletList',
  'orderedList',
  'taskList',
  'table',
  'horizontalRule',
]

export interface BlockIdOptions {
  /**
   * 挂稳定 id 的节点类型
   * @default DEFAULT_BLOCK_ID_TYPES
   */
  types: string[]
  /**
   * attr 名
   * @default 'blockId'
   */
  attributeName: string
  /**
   * id 生成器（须 WebView 安全，勿用 crypto.randomUUID）
   * @default () => randomId('blk_')
   */
  generateId: () => string
  /**
   * 是否把 id 渲染进 HTML 的 `data-block-id`
   * - `false`（默认）：id 只活在 PM state / getJSON()，HTML 与 Markdown 都不带
   * - `true`：HTML 带 `data-block-id`，存 HTML 时 id 可跨重载稳定
   * @default false
   */
  keepInHTML: boolean
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockId: {
      /** 为所有缺 id / 重复 id 的顶层块补全稳定 id（返回是否有改动） */
      ensureBlockIds: () => ReturnType
    }
  }
}

/**
 * 产出一个「文档内唯一、且不与合成 id 前缀冲突」的新 id
 *
 * 防御坏的自定义 `generateId`（返回重复值 / 用了保留前缀）：先试用户生成器，
 * 重复或非法则退回内置 `randomId`，再不行拼计数器，保证一定唯一 —— 否则块会被合并、丢数据
 */
function freshUniqueId(generateId: () => string, seen: Set<string>): string {
  for (let i = 0; i < 12; i++) {
    const candidate = i < 8
      ? generateId()
      : randomId('blk_')
    if (typeof candidate === 'string' && candidate && !candidate.startsWith(SYNTHETIC_ID_PREFIX) && !seen.has(candidate)) {
      return candidate
    }
  }
  return `${randomId('blk_')}${seen.size}`
}

/**
 * 遍历顶层块，为缺 id / 重复 id 的块写入唯一新 id
 * @returns 是否产生了改动
 */
function backfillBlockIds(
  doc: import('@tiptap/pm/model').Node,
  tr: import('@tiptap/pm/state').Transaction,
  types: Set<string>,
  attributeName: string,
  generateId: () => string,
): boolean {
  const seen = new Set<string>()
  let modified = false

  doc.forEach((node, offset) => {
    if (!types.has(node.type.name))
      return

    const id = node.attrs[attributeName]
    /** 缺失 / 重复 / 误用合成前缀的 id，都重发一个唯一 id */
    if (!id || seen.has(id) || (typeof id === 'string' && id.startsWith(SYNTHETIC_ID_PREFIX))) {
      const fresh = freshUniqueId(generateId, seen)
      tr.setNodeMarkup(offset, undefined, { ...node.attrs, [attributeName]: fresh })
      seen.add(fresh)
      modified = true
    }
    else {
      seen.add(id)
    }
  })

  return modified
}

export const BlockId = Extension.create<BlockIdOptions>({
  name: 'blockId',

  addOptions() {
    return {
      types: DEFAULT_BLOCK_ID_TYPES,
      attributeName: 'blockId',
      generateId: () => randomId('blk_'),
      keepInHTML: false,
    }
  },

  addGlobalAttributes() {
    const { attributeName, keepInHTML } = this.options

    const attribute = keepInHTML
      ? {
          default: null,
          parseHTML: (el: HTMLElement) => el.getAttribute('data-block-id'),
          renderHTML: (attrs: Record<string, any>) => (attrs[attributeName]
            ? { 'data-block-id': attrs[attributeName] }
            : {}),
        }
      : {
          /** 只活在 PM state：不渲染进 HTML，粘贴 / setContent 解析出的 id 为空 → 由插件兜底补 */
          default: null,
          rendered: false,
          parseHTML: () => null,
        }

    return [
      {
        types: this.options.types,
        attributes: {
          [attributeName]: attribute,
        },
      },
    ]
  },

  addCommands() {
    const { attributeName, generateId } = this.options
    const types = new Set(this.options.types)

    return {
      ensureBlockIds: () => ({ state, tr, dispatch }) => {
        const modified = backfillBlockIds(state.doc, tr, types, attributeName, generateId)
        if (modified && dispatch)
          dispatch(tr)
        return modified
      },
    }
  },

  /**
   * 初始 doc 经 `content` 选项创建时不会触发 appendTransaction，这里补一次
   *
   * 用 microtask 延后：onCreate 同步阶段 dispatch 会被 view 初始化吞掉，
   * 延后到编辑器就绪后再补。注意：依赖同步 id 的调用方（如 createBlockSync）
   * 自身会显式 `ensureBlockIds()`，不靠这里的时序；通过 setContent 设置内容时
   * appendTransaction 也会即时补全。此处仅为 `content` 选项场景兜底
   */
  onCreate() {
    queueMicrotask(() => {
      if (!this.editor.isDestroyed)
        this.editor.commands.ensureBlockIds()
    })
  },

  addProseMirrorPlugins() {
    const { attributeName, generateId } = this.options
    const types = new Set(this.options.types)

    return [
      new Plugin({
        key: new PluginKey('blockIdAutoFill'),
        appendTransaction: (transactions, _oldState, newState) => {
          /** 忽略自己上一轮补 id 的事务，否则会对全文二次遍历 */
          if (!transactions.some(tr => tr.docChanged && !tr.getMeta(BACKFILL_META)))
            return null

          const tr = newState.tr
          const modified = backfillBlockIds(newState.doc, tr, types, attributeName, generateId)
          if (!modified)
            return null

          tr.setMeta(BACKFILL_META, true)
          return tr
        },
      }),
    ]
  },
})
