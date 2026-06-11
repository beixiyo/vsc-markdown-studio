/**
 * GradientHighlight 高亮 Mark 的 Markdown 序列化往返测试
 *
 * 序列化策略（与 image 节点的「富属性降级 HTML」一致）：
 * - 无 color：保持官方 `==text==` 语法（tokenizer / parseMarkdown 继承）
 * - 有 color（渐变 key 或任意色值）：降级为 `<mark data-color="...">`，
 *   导入侧由 @tiptap/markdown 的成对内联 HTML 解析路径自动还原
 */
import { Editor } from '@tiptap/core'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { beforeAll, describe, expect, it } from 'vitest'
import { GradientHighlight } from '../extension'

let editor: Editor
let mgr: { parse: (md: string) => any, serialize: (json: any) => string }

beforeAll(() => {
  const el = document.createElement('div')
  document.body.appendChild(el)
  editor = new Editor({
    element: el,
    extensions: [
      StarterKit.configure({ codeBlock: false }), // 与 tiptap-editor-core/extensions.ts 一致
      Markdown.configure({ markedOptions: { gfm: true, breaks: true } }),
      GradientHighlight,
    ],
  })
  mgr = (editor as any).markdown
})

/** 纯 markdown 往返：md → doc(JSON) → md，重复 n 次 */
function roundtrip(initial: string, n = 6): string[] {
  const outs: string[] = []
  let cur = initial
  for (let i = 0; i < n; i++) {
    cur = mgr.serialize(mgr.parse(cur))
    outs.push(cur)
  }
  return outs
}

/** 验收标准：往返 ≥ 5 次，每次输出与首次逐字符相等 */
function expectIdempotent(initial: string) {
  const outs = roundtrip(initial)
  for (let i = 1; i < outs.length; i++)
    expect(outs[i], `第 ${i + 1} 轮与第 1 轮不一致`).toBe(outs[0])
  return outs[0]
}

/** 把带 marks 的文本片段包进最小 doc 后序列化 */
function serializeText(text: string, marks: any[]): string {
  return mgr.serialize({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text, marks }] }],
  })
}

/** 深扫 JSON doc，收集所有带 highlight mark 的文本节点 */
function findHighlights(json: any): any[] {
  const out: any[] = []
  const walk = (node: any) => {
    if (!node || typeof node !== 'object')
      return
    if (node.marks?.some((m: any) => m.type === 'highlight'))
      out.push(node)
    if (Array.isArray(node.content))
      node.content.forEach(walk)
  }
  walk(json)
  return out
}

describe('无色高亮保持 == 语法', () => {
  it('`==text==` 往返幂等且不出现 <mark', () => {
    const first = expectIdempotent('前文 ==高亮文字== 后文')
    expect(first).toContain('==高亮文字==')
    expect(first).not.toContain('<mark')
  })

  it('无 color 的 highlight mark 序列化为 ==', () => {
    const md = serializeText('高亮', [{ type: 'highlight' }])
    expect(md.trim()).toBe('==高亮==')
  })
})

describe('带色高亮降级为 <mark data-color>', () => {
  it('渐变 key：输出 <mark data-color="skyBlue">', () => {
    const md = serializeText('渐变字', [{ type: 'highlight', attrs: { color: 'skyBlue' } }])
    expect(md.trim()).toBe('<mark data-color="skyBlue">渐变字</mark>')
  })

  it('渐变 key 多轮往返幂等且 color 不丢', () => {
    const md = serializeText('渐变字', [{ type: 'highlight', attrs: { color: 'mysticPurpleBlue' } }])
    const first = expectIdempotent(md)
    const highlights = findHighlights(mgr.parse(first))
    expect(highlights).toHaveLength(1)
    expect(highlights[0].marks[0].attrs.color).toBe('mysticPurpleBlue')
  })

  it('multicolor 任意色值（含空格/括号）往返不丢', () => {
    const md = serializeText('普通色', [{ type: 'highlight', attrs: { color: 'rgba(204, 255, 204, 1)' } }])
    expectIdempotent(md)
    const highlights = findHighlights(mgr.parse(md))
    expect(highlights[0].marks[0].attrs.color).toBe('rgba(204, 255, 204, 1)')
  })

  it('高亮内嵌套加粗：往返幂等且两个 mark 都在', () => {
    const md = serializeText('粗体渐变', [
      { type: 'bold' },
      { type: 'highlight', attrs: { color: 'skyBlue' } },
    ])
    const first = expectIdempotent(md)
    const highlights = findHighlights(mgr.parse(first))
    expect(highlights).toHaveLength(1)
    const types = highlights[0].marks.map((m: any) => m.type).sort()
    expect(types).toEqual(['bold', 'highlight'])
    expect(highlights[0].marks.find((m: any) => m.type === 'highlight').attrs.color).toBe('skyBlue')
  })

  it('同段落内无色与有色高亮混排幂等', () => {
    const colored = serializeText('有色', [{ type: 'highlight', attrs: { color: 'skyBlue' } }]).trim()
    const first = expectIdempotent(`前 ==无色== 中 ${colored} 后`)
    expect(first).toContain('==无色==')
    expect(first).toContain('<mark data-color="skyBlue">有色</mark>')
  })
})

describe('其它结构不受影响（回归）', () => {
  it('标题 + 列表 + 高亮混合文档幂等', () => {
    expectIdempotent('## 标题\n\n- 项目 ==重点== 一\n- 项目二')
  })
})
