import type { EditorView } from '@tiptap/pm/view'
import type { SpeakerAttributes, SpeakerOptions } from './types'
import { mergeAttributes, Node } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { getI18n } from 'i18n'
import {
  DEFAULT_SPEAKER_RENDER_TAG,
  getSpeakerMarkdownStart,
  parseSpeakerMarkdownToken,
  renderSpeakerMarkdown,
  resolveSpeakerDisplayText,
  SPEAKER_TOKEN_NAME,
  tokenizeSpeakerMarkdown,
} from './rules'

/**
 * 展示名解析：把 i18n 缺省名注入 rules 的纯函数
 *
 * 缺省名（无 attrs.name、无 speakerMap 命中时）走 `tiptap.speaker.speaker`，
 * defaultValue 保证 key 缺失也有英文兜底
 */
function resolveDisplayText(attrs: Partial<SpeakerAttributes>, options: SpeakerOptions): string {
  return resolveSpeakerDisplayText(attrs, {
    speakerMap: options.speakerMap,
    formatLabel: options.formatLabel,
    formatFallback: (displayLabel) => {
      const i18n = getI18n()
      return i18n
        ? i18n.t('tiptap.speaker.speaker', {
            number: displayLabel,
            defaultValue: `Speaker ${displayLabel}`,
          })
        : `Speaker ${displayLabel}`
    },
  })
}

/**
 * Speaker 说话人标签（示例节点）
 *
 * 教学目标：演示「原子节点 ⇄ renderText ⇄ 文档内搜索」的完整关系，见同目录 README。
 * 核心三件事：
 * 1. `atom: true`——展示文本不进文档模型，只存在于 attrs
 * 2. `renderText`——tiptap 官方的「节点纯文本表示」契约，会被挂到 schema `spec.toText`
 * 3. 与渲染共用 `resolveDisplayText`——看到什么就能搜到什么
 *
 * 同时演示两个生产必备能力：i18n 缺省名随语言切换刷新、点击回调
 */
export const SpeakerNode = Node.create<SpeakerOptions>({
  name: SPEAKER_TOKEN_NAME,
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      speakerMap: {},
      className: undefined,
      renderTag: DEFAULT_SPEAKER_RENDER_TAG,
      formatLabel: undefined,
      onClick: undefined,
    }
  },

  addAttributes() {
    return {
      originalLabel: {
        default: '',
        parseHTML: element => element.getAttribute('data-speaker-original-label') ?? '',
        renderHTML: attrs => (attrs.originalLabel
          ? { 'data-speaker-original-label': attrs.originalLabel }
          : {}),
      },
      name: {
        default: null,
        parseHTML: element => element.getAttribute('data-speaker-name'),
        renderHTML: attrs => (attrs.name
          ? { 'data-speaker-name': attrs.name }
          : {}),
      },
    }
  },

  parseHTML() {
    return [{ tag: '[data-speaker-original-label]' }]
  },

  /**
   * NodeView：把标签渲染成可见元素，并处理两类刷新
   * - attrs 变化（如宿主同步说话人名字）→ 重新取展示文本
   * - i18n 语言切换 → 缺省名要跟着变，故订阅 `language:change`
   *
   * 纯静态展示本可只用 renderHTML；这里需要「语言切换即时重绘」才引入 NodeView
   */
  addNodeView() {
    const options = this.options

    return ({ node }) => {
      const tag = options.renderTag ?? DEFAULT_SPEAKER_RENDER_TAG
      const dom = document.createElement(tag)
      dom.setAttribute('contenteditable', 'false')
      dom.className = ['tiptap-speaker', options.className].filter(Boolean).join(' ')
      if (node.attrs.originalLabel) {
        dom.setAttribute('data-speaker-original-label', node.attrs.originalLabel)
      }

      let currentNode = node
      const updateText = () => {
        dom.textContent = resolveDisplayText(currentNode.attrs, options)
      }
      updateText()

      const i18n = getI18n()
      const onLanguageChange = () => updateText()
      i18n?.on('language:change', onLanguageChange)

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) {
            return false
          }
          currentNode = updatedNode
          updateText()
          return true
        },
        selectNode: () => dom.classList.add('tiptap-speaker--selected'),
        deselectNode: () => dom.classList.remove('tiptap-speaker--selected'),
        stopEvent: () => false,
        ignoreMutation: () => true,
        destroy: () => {
          i18n?.off('language:change', onLanguageChange)
        },
      }
    }
  },

  /** getHTML / 复制 HTML 通道：产出带 data 属性与展示名的元素 */
  renderHTML({ node, HTMLAttributes }) {
    const tag = this.options.renderTag ?? DEFAULT_SPEAKER_RENDER_TAG
    const attrs = mergeAttributes(
      HTMLAttributes,
      { class: 'tiptap-speaker' },
      this.options.className
        ? { class: this.options.className }
        : {},
    )

    return [tag, attrs, resolveDisplayText(node.attrs, this.options)]
  },

  /**
   * ★ 本示例的关键：节点的纯文本表示
   *
   * tiptap 会把它挂到 schema 的 `spec.toText`，`editor.getText()` 与
   * tiptap-search 的 `leafTextFromRenderText` 都消费这个契约——
   * 实现了它，原子节点就能被复制成纯文本、也能被文档内搜索命中
   */
  renderText({ node }) {
    return resolveDisplayText(node.attrs, this.options)
  },

  markdownTokenizer: {
    name: SPEAKER_TOKEN_NAME,
    level: 'inline',
    start: (src: string) => getSpeakerMarkdownStart(src),
    tokenize: (src: string) => tokenizeSpeakerMarkdown(src),
  },

  parseMarkdown: token => parseSpeakerMarkdownToken(token),

  renderMarkdown: node => renderSpeakerMarkdown(node?.attrs),

  /** 点击标签回调：从 DOM 的 data 属性还原 attrs 交给宿主（如打开编辑面板） */
  addProseMirrorPlugins() {
    const onClick = this.options.onClick
    if (!onClick) {
      return []
    }

    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            click: (_view: EditorView, event: MouseEvent) => {
              const target = event.target as HTMLElement | null
              const el = target?.closest?.('[data-speaker-original-label]') as HTMLElement | null
              if (!el) {
                return false
              }

              onClick({
                originalLabel: el.getAttribute('data-speaker-original-label') ?? '',
                name: el.getAttribute('data-speaker-name') ?? undefined,
              }, event)
              return false
            },
          },
        },
      }),
    ]
  },
})
