/**
 * Image 节点 Markdown 序列化往返测试
 *
 * 序列化策略（与 gitea html2markdown 的图片处理一致）：
 * - 纯净图片（仅 src/alt/title）：输出标准 `![alt](src "title")`
 * - 含富属性（尺寸 / 对齐 / 样式等）：降级为自闭合 `<img ... />`，
 *   导入侧由 @tiptap/markdown 的 HTML token 解析路径（parseHTMLToken →
 *   本扩展 parseHTML）自动还原，无需自定义 tokenizer
 *
 * renderMarkdown 输出必须多轮往返逐字符幂等，
 * 属性输出顺序固定、默认值不输出，否则每轮序列化都会产生 diff。
 */
import { Editor } from '@tiptap/core'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { beforeAll, describe, expect, it } from 'vitest'
import { ImageNode } from '../extension'

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
      ImageNode,
    ],
  })
  mgr = (editor as any).markdown
})

/** 纯 markdown 往返：md → doc(JSON) → md，重复 n 次 */
function roundtrip(initial: string, n = 6): string[] {
  const outs: string[] = []
  let cur = initial
  for (let i = 0; i < n; i++) {
    const json = mgr.parse(cur)
    const md = mgr.serialize(json)
    outs.push(md)
    cur = md
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

/** 把单个 image 节点包进最小 doc 后序列化 */
function serializeImage(attrs: Record<string, unknown>): string {
  return mgr.serialize({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'image', attrs }] }],
  })
}

/** 深扫 JSON doc，收集所有 image 节点 */
function findImages(json: any): any[] {
  const out: any[] = []
  const walk = (node: any) => {
    if (!node || typeof node !== 'object')
      return
    if (node.type === 'image')
      out.push(node)
    if (Array.isArray(node.content))
      node.content.forEach(walk)
  }
  walk(json)
  return out
}

describe('纯净图片走标准 markdown 语法', () => {
  it('仅 src/alt/title：保持 `![]()` 且幂等', () => {
    const first = expectIdempotent('前文 ![示例](https://e.com/a.png "标题") 后文')
    expect(first).toContain('![示例](https://e.com/a.png "标题")')
    expect(first).not.toContain('<img')
  })

  it('默认值（display/loading/decoding）不触发 HTML 降级', () => {
    const md = serializeImage({
      src: 'https://e.com/a.png',
      alt: '图',
      display: 'inline-block',
      loading: 'lazy',
      decoding: 'async',
    })
    expect(md.trim()).toBe('![图](https://e.com/a.png)')
  })
})

describe('富属性图片降级为 <img />', () => {
  it('width/height/align：输出 <img />，属性顺序固定', () => {
    const md = serializeImage({
      src: 'https://e.com/a.png',
      alt: '图',
      width: 300,
      height: 200,
      align: 'center',
    })
    expect(md.trim()).toBe(
      '<img src="https://e.com/a.png" alt="图" width="300" height="200" data-align="center" />',
    )
  })

  it('富属性 markdown 多轮往返幂等', () => {
    const md = serializeImage({
      src: 'https://e.com/a.png',
      alt: '图',
      width: 300,
      height: 200,
      align: 'center',
      borderRadius: '8px',
    })
    expectIdempotent(md)
  })

  it('解析侧还原全部富属性', () => {
    const md = serializeImage({
      src: 'https://e.com/a.png',
      width: '50%',
      float: 'left',
      opacity: 0.5,
      rotate: 90,
      objectFit: 'cover',
    })
    const images = findImages(mgr.parse(md))
    expect(images).toHaveLength(1)
    const attrs = images[0].attrs
    expect(attrs.src).toBe('https://e.com/a.png')
    expect(attrs.width).toBe('50%')
    expect(attrs.float).toBe('left')
    expect(attrs.opacity).toBe(0.5)
    expect(attrs.rotate).toBe(90)
    expect(attrs.objectFit).toBe('cover')
  })

  it('style(JSON 对象) 往返不丢', () => {
    const md = serializeImage({
      src: 'https://e.com/a.png',
      style: { maxWidth: '100%', objectPosition: 'top' },
    })
    expectIdempotent(md)
    const images = findImages(mgr.parse(md))
    expect(images[0].attrs.style).toEqual({ maxWidth: '100%', objectPosition: 'top' })
  })

  it('属性值含双引号时正确转义且幂等', () => {
    const md = serializeImage({
      src: 'https://e.com/a.png',
      alt: '引号"测试"',
      width: 100,
    })
    expectIdempotent(md)
    const images = findImages(mgr.parse(md))
    expect(images[0].attrs.alt).toBe('引号"测试"')
  })

  it('段落内文字与 <img /> 混排幂等且不丢文字', () => {
    const inline = serializeImage({ src: 'https://e.com/a.png', width: 64 }).trim()
    const first = expectIdempotent(`前文 ${inline} 后文`)
    expect(first).toContain('前文')
    expect(first).toContain('后文')
    expect(first).toContain('<img')
  })

  it('非默认 display 触发降级', () => {
    const md = serializeImage({ src: 'https://e.com/a.png', display: 'block' })
    expect(md.trim()).toBe('<img src="https://e.com/a.png" data-display="block" />')
  })
})

describe('其它结构不受影响（回归）', () => {
  it('标题 + 列表 + 纯净图片混合文档幂等', () => {
    expectIdempotent('## 标题\n\n- 项目一\n- 项目二\n\n![图](https://e.com/a.png)')
  })
})
