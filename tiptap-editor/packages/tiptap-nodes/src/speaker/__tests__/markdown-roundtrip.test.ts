/**
 * Speaker 节点 Markdown 序列化幂等性回归测试
 *
 * 背景：speaker 的 renderMarkdown 曾在 token 两侧硬编码空格，导致 parse → serialize
 * 往返不幂等（每轮每侧 +1 空格），累加到 4 个前导空格后整行被 Markdown 解析器当作
 * 缩进代码块、在 codeBlock 禁用下整段内容被静默丢弃。详见 git 历史与 bug 报告。
 *
 * 这里用【真实】SpeakerNode + 真实 @tiptap/markdown，直接走 markdown.parse / markdown.serialize
 * 纯函数路径（不渲染 NodeView），断言往返 6 次逐字符稳定且不丢内容。
 */
import { Editor } from '@tiptap/core'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { beforeAll, describe, expect, it } from 'vitest'
import { SpeakerNode } from '../extension'

let editor: Editor

beforeAll(() => {
  const el = document.createElement('div')
  document.body.appendChild(el)
  editor = new Editor({
    element: el,
    extensions: [
      StarterKit.configure({ codeBlock: false }), // 与 tiptap-editor-core/extensions.ts 一致
      Markdown.configure({ markedOptions: { gfm: true, breaks: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      SpeakerNode,
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

/** 验收标准：往返 ≥ 5 次，每次输出与首次逐字符相等 */
function expectIdempotent(initial: string) {
  const outs = roundtrip(initial)
  for (let i = 1; i < outs.length; i++)
    expect(outs[i], `第 ${i + 1} 轮与第 1 轮不一致`).toBe(outs[0])
  return outs[0]
}

describe('speaker token 往返幂等', () => {
  it('§3 实证场景：标题 + 含 speaker 的段落 + 加粗/斜体，不丢内容', () => {
    const first = expectIdempotent(
      '## 测试执行过程\n\n[speaker:0] 录制了一段约二十秒的**持续性**音频，以验证*系统*的表现',
    )
    expect(first).toContain('录制了一段约二十秒的')
    expect(first).toContain('[speaker:0]')
  })

  it('段落开头的 speaker', () => expectIdempotent('[speaker:0] 正文'))
  it('相邻两个 speaker', () => expectIdempotent('[speaker:0][speaker:1] 文字'))
  it('整段仅一个 speaker', () => expectIdempotent('[speaker:0]'))
  it('列表项内的 speaker', () => expectIdempotent('- [speaker:0] 列表项目'))
  it('speaker 后接加粗', () => expectIdempotent('[speaker:0] **粗体**'))

  it('label 两侧含空格时被归一化（防御性 trim）', () => {
    const json = (editor as any).markdown.parse('[speaker: 0 ] 正文')
    const out = (editor as any).markdown.serialize(json) as string
    expect(out).toContain('[speaker:0]')
    expect(out).not.toContain('[speaker: 0 ]')
  })
})

describe('其它结构往返幂等（验收样例）', () => {
  it('空行 / 多空行', () => expectIdempotent('第一段\n\n第二段'))
  it('无序 + 有序列表', () => expectIdempotent('- 苹果\n- 香蕉\n\n1. 第一\n2. 第二'))
  it('任务列表（含已勾选）', () => expectIdempotent('- [ ] 待办\n- [x] 已完成\n\n普通段落'))
})
