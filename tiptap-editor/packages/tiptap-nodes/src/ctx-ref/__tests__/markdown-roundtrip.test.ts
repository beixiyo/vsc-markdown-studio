/**
 * ctx-ref marker 兼容层测试
 *
 * 背景：Markdown 中以 `<!--ctx-ref:{type}:{id}-->` HTML comment marker 形式出现。
 * ProseMirror 默认丢弃 comment 节点，本模块把 marker 升格为真实节点以保证编辑 roundtrip 存活。
 *
 * 用真实 @tiptap/markdown 走 parse / serialize 纯函数路径，断言：
 * 1. marker 逐字符存活  2. 多轮往返幂等  3. 渲染为可挂载图标的 DOM  4. 点击回调与紧邻句提取
 */
import { Editor } from '@tiptap/core'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { CtxRefNode } from '../extension'

const SUMMARY_MD = [
  '***这个结论需要关注。***<!--ctx-ref:mark:mark_123-->',
  '',
  '***这个补充被采纳进总结。***<!--ctx-ref:note:1-->',
  '',
  '## Related images',
  '',
  '- 这张图补充了会议中的白板内容。<!--ctx-ref:image:101-->',
].join('\n')

const ALL_MARKERS = [
  '<!--ctx-ref:mark:mark_123-->',
  '<!--ctx-ref:note:1-->',
  '<!--ctx-ref:image:101-->',
]

let editor: Editor

beforeAll(() => {
  const el = document.createElement('div')
  document.body.appendChild(el)
  editor = new Editor({
    element: el,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Markdown.configure({ markedOptions: { gfm: true, breaks: true } }),
      CtxRefNode,
    ],
  })
})

/** 纯 markdown 往返：md → doc(JSON) → md，重复 n 次 */
function roundtrip(initial: string, n = 6): string[] {
  const mgr = (editor as any).markdown
  const outs: string[] = []
  let cur = initial
  for (let i = 0; i < n; i++) {
    const json = mgr.parse(cur)
    const md = mgr.serialize(json) as string
    outs.push(md)
    cur = md
  }
  return outs
}

describe('marker roundtrip 存活', () => {
  it('全部 marker 逐字符存活，且不产生悬空 *** 脏数据', () => {
    const [out] = roundtrip(SUMMARY_MD, 1)

    ALL_MARKERS.forEach(marker => expect(out).toContain(marker))
    expect(out).not.toContain('******')
  })

  it('往返 6 次逐字符幂等', () => {
    const outs = roundtrip(SUMMARY_MD)
    for (let i = 1; i < outs.length; i++)
      expect(outs[i], `第 ${i + 1} 轮与第 1 轮不一致`).toBe(outs[0])
  })

  it('marker 紧贴句尾、不在行首时同样存活', () => {
    const [out] = roundtrip('普通段落中**加粗**<!--ctx-ref:note:n-1-->继续普通文字', 1)
    expect(out).toContain('<!--ctx-ref:note:n-1-->')
  })
})

describe('编辑器内渲染', () => {
  it('marker 渲染为带 data 属性的图标挂载点，正文样式不受影响', () => {
    editor.commands.setContent(SUMMARY_MD, { contentType: 'markdown' })
    const html = editor.getHTML()

    expect(html).toContain('data-ctx-ref="note"')
    expect(html).toContain('data-ctx-id="1"')
    expect(html).toContain('tiptap-ctx-ref--image')
    /** marker 前紧邻的加粗斜体句完整保留 */
    expect(html).toContain('<strong><em>这个补充被采纳进总结。</em></strong>')
  })

  it('marker 不进入纯文本提取', () => {
    editor.commands.setContent('正文<!--ctx-ref:note:1-->', { contentType: 'markdown' })
    expect(editor.getText()).toBe('正文')
  })
})

describe('点击交互', () => {
  it('note 点击回调携带 refId 与紧邻加粗斜体句', () => {
    const onClick = vi.fn()
    const el = document.createElement('div')
    document.body.appendChild(el)
    const clickEditor = new Editor({
      element: el,
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        Markdown.configure(),
        CtxRefNode.configure({ onClick }),
      ],
    })
    clickEditor.commands.setContent(SUMMARY_MD, { contentType: 'markdown' })

    const note = clickEditor.view.dom.querySelector('[data-ctx-ref="note"]') as HTMLElement
    note.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onClick).toHaveBeenCalledOnce()
    expect(onClick.mock.calls[0][0]).toEqual({
      refType: 'note',
      refId: '1',
      sentence: '这个补充被采纳进总结。',
    })

    clickEditor.destroy()
  })

  it('mark 旗子同样触发回调，载荷带 refType=mark 与紧邻句', () => {
    const onClick = vi.fn()
    const el = document.createElement('div')
    document.body.appendChild(el)
    const clickEditor = new Editor({
      element: el,
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        Markdown.configure(),
        CtxRefNode.configure({ onClick }),
      ],
    })
    clickEditor.commands.setContent(SUMMARY_MD, { contentType: 'markdown' })

    const mark = clickEditor.view.dom.querySelector('[data-ctx-ref="mark"]') as HTMLElement
    mark.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onClick).toHaveBeenCalledOnce()
    expect(onClick.mock.calls[0][0]).toEqual({
      refType: 'mark',
      refId: 'mark_123',
      sentence: '这个结论需要关注。',
    })

    clickEditor.destroy()
  })
})

describe('图标渲染（NodeView）', () => {
  it('默认渲染内置图标；自定义工厂可覆盖；传 false 则不渲染', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const iconEditor = new Editor({
      element: el,
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        Markdown.configure(),
        CtxRefNode.configure({
          icons: {
            /** mark 自定义覆盖 */
            mark: ({ refId }) => {
              const span = document.createElement('span')
              span.className = 'flag-icon'
              span.dataset.for = refId
              return span
            },
            /** note 关闭渲染 */
            note: false,
            /** image 不配置 → 用内置默认图标 */
          },
        }),
      ],
    })
    iconEditor.commands.setContent(SUMMARY_MD, { contentType: 'markdown' })

    /** 自定义覆盖：渲染传入的工厂结果 */
    const markAnchor = iconEditor.view.dom.querySelector('[data-ctx-ref="mark"]') as HTMLElement
    expect(markAnchor.querySelector('.flag-icon')?.getAttribute('data-for')).toBe('mark_123')

    /** false：不渲染任何子节点 */
    const noteAnchor = iconEditor.view.dom.querySelector('[data-ctx-ref="note"]') as HTMLElement
    expect(noteAnchor.childElementCount).toBe(0)

    /** 未配置：内置默认图标（含 svg） */
    const imageAnchor = iconEditor.view.dom.querySelector('[data-ctx-ref="image"]') as HTMLElement
    expect(imageAnchor.querySelector('svg')).not.toBeNull()

    iconEditor.destroy()
  })

  it('ctx.defaultIcon() 可取内置图标做二次加工（包一层 DOM + 加 class）', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const ed = new Editor({
      element: el,
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        Markdown.configure(),
        CtxRefNode.configure({
          icons: {
            note: (ctx) => {
              const wrap = document.createElement('span')
              wrap.className = 'my-badge'
              const icon = ctx.defaultIcon()
              if (icon)
                wrap.appendChild(icon)
              return wrap
            },
          },
        }),
      ],
    })
    ed.commands.setContent(SUMMARY_MD, { contentType: 'markdown' })

    const noteAnchor = ed.view.dom.querySelector('[data-ctx-ref="note"]') as HTMLElement
    const wrap = noteAnchor.querySelector('.my-badge') as HTMLElement
    expect(wrap).not.toBeNull()
    /** 包装内仍是内置图标（svg） */
    expect(wrap.querySelector('svg')).not.toBeNull()

    ed.destroy()
  })

  it('完全不配置 icons 时，三种 refType 都渲染内置图标', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const ed = new Editor({
      element: el,
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        Markdown.configure(),
        CtxRefNode,
      ],
    })
    ed.commands.setContent(SUMMARY_MD, { contentType: 'markdown' })

    for (const type of ['mark', 'note', 'image']) {
      const anchor = ed.view.dom.querySelector(`[data-ctx-ref="${type}"]`) as HTMLElement
      expect(anchor.querySelector('svg'), `${type} 应渲染内置图标`).not.toBeNull()
    }

    ed.destroy()
  })

  it('setCtxRefStreaming 切换流式态：标记 data-streaming 并以 streaming=true 重渲图标，且不写入 markdown', () => {
    const seen: boolean[] = []
    const el = document.createElement('div')
    document.body.appendChild(el)
    const streamEditor = new Editor({
      element: el,
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        Markdown.configure(),
        CtxRefNode.configure({
          icons: {
            note: ({ streaming }) => {
              seen.push(streaming)
              const span = document.createElement('span')
              span.className = streaming
                ? 'note-streaming'
                : 'note-static'
              return span
            },
          },
        }),
      ],
    })
    streamEditor.commands.setContent(SUMMARY_MD, { contentType: 'markdown' })

    const anchor = () => streamEditor.view.dom.querySelector('[data-ctx-ref="note"]') as HTMLElement
    expect(anchor().querySelector('.note-static')).not.toBeNull()
    expect(anchor().hasAttribute('data-streaming')).toBe(false)

    const ok = streamEditor.commands.setCtxRefStreaming('1', true)
    expect(ok).toBe(true)
    expect(anchor().hasAttribute('data-streaming')).toBe(true)
    expect(anchor().querySelector('.note-streaming')).not.toBeNull()
    expect(seen).toContain(true)

    /** 流式是临时 UI 态，绝不写进 markdown */
    expect(streamEditor.getMarkdown()).toContain('<!--ctx-ref:note:1-->')

    /** 无匹配 refId 时返回 false */
    expect(streamEditor.commands.setCtxRefStreaming('nope', true)).toBe(false)

    streamEditor.destroy()
  })
})

describe('三种表示互转（markdown / JSON / HTML）', () => {
  it('marker 节点在 JSON 中是干净的结构化数据，三向转换无损', () => {
    editor.commands.setContent(SUMMARY_MD, { contentType: 'markdown' })

    /** ① markdown → JSON：marker 成为结构化节点，无任何原始注释文本残留 */
    const json = editor.getJSON()
    const flat = JSON.stringify(json)
    expect(flat).toContain('"type":"ctxRef"')
    expect(flat).toContain('"refType":"note"')
    expect(flat).not.toContain('<!--')

    /** ② JSON → 编辑器 → markdown：注释原样还原 */
    editor.commands.setContent(json)
    const mdFromJson = editor.getMarkdown()
    ALL_MARKERS.forEach(m => expect(mdFromJson).toContain(m))

    /** ③ HTML → 编辑器 → markdown：经 HTML 通道往返同样无损 */
    const html = editor.getHTML()
    editor.commands.setContent(html)
    const mdFromHtml = editor.getMarkdown()
    ALL_MARKERS.forEach(m => expect(mdFromHtml).toContain(m))
  })
})
