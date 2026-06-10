/**
 * ctx-ref marker 兼容层测试
 *
 * 背景：算法侧 V2 在 summary Markdown 中输出 `<!--ctx-ref:{type}:{id}-->` 与
 * `<!--summary-added-images:start|end-->` HTML comment marker。ProseMirror 默认
 * 丢弃 comment 节点，本模块把 marker 升格为真实节点以保证编辑 roundtrip 存活。
 *
 * 用真实 @tiptap/markdown 走 parse / serialize 纯函数路径，断言：
 * 1. marker 逐字符存活  2. 多轮往返幂等  3. 渲染为可挂载图标的 DOM  4. 点击回调与紧邻句提取
 */
import { Editor } from '@tiptap/core'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { CtxRefNode, SummaryBoundaryNode } from '../extension'

const SUMMARY_MD = [
  '***这个结论需要关注。***<!--ctx-ref:mark:mark_123-->',
  '',
  '***这个补充被采纳进总结。***<!--ctx-ref:note:1-->',
  '',
  '<!--summary-added-images:start-->',
  '',
  '## Related images',
  '',
  '- 这张图补充了会议中的白板内容。<!--ctx-ref:image:101-->',
  '',
  '<!--summary-added-images:end-->',
].join('\n')

const ALL_MARKERS = [
  '<!--ctx-ref:mark:mark_123-->',
  '<!--ctx-ref:note:1-->',
  '<!--ctx-ref:image:101-->',
  '<!--summary-added-images:start-->',
  '<!--summary-added-images:end-->',
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
      SummaryBoundaryNode,
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
    expect(html).toContain('data-summary-boundary="start"')
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
        SummaryBoundaryNode,
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

    /** mark 旗子无交互 */
    const mark = clickEditor.view.dom.querySelector('[data-ctx-ref="mark"]') as HTMLElement
    mark.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClick).toHaveBeenCalledOnce()

    clickEditor.destroy()
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
    expect(flat).toContain('"type":"summaryBoundary"')
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
