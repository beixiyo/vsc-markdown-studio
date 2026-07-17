/**
 * 「原子节点 ⇄ renderText ⇄ 文档内搜索」集成测试（本节点存在的意义，见 README）
 *
 * 用真实 SpeakerNode + 真实 tiptap-search 断言完整链路：
 * 1. markdown `[speaker:X]` 解析为 atom 节点且往返幂等
 * 2. renderText 被挂到 schema spec.toText，返回标签展示名
 * 3. 宿主注入 leafTextFromRenderText 后，搜说话人名字命中整个标签节点
 * 4. 不注入时保持默认行为（atom 不可搜），证明搜索包与节点零耦合
 * 另测两个生产必备能力：i18n 缺省名随语言切换刷新、点击回调
 */
import { Editor } from '@tiptap/core'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { getI18n, LANGUAGES } from 'i18n'
import { getSearchState, leafTextFromRenderText, Search } from 'tiptap-search'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { SpeakerNode } from '../extension'

beforeAll(() => {
  /** 注册示例所需的缺省名资源（生产由 tiptap-api 提供，测试内联最小集） */
  getI18n().addResources({
    [LANGUAGES.EN_US]: { tiptap: { speaker: { speaker: 'Speaker {{number}}' } } },
    [LANGUAGES.ZH_CN]: { tiptap: { speaker: { speaker: '说话人 {{number}}' } } },
  })
  getI18n().changeLanguage(LANGUAGES.EN_US)
})

function createEditor(options: {
  withLeafText?: boolean
  onSpeakerClick?: (attrs: { originalLabel: string, name?: string | null }) => void
} = {}) {
  const el = document.createElement('div')
  document.body.appendChild(el)

  return new Editor({
    element: el,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Markdown.configure({ markedOptions: { gfm: true, breaks: true } }),
      SpeakerNode.configure({
        speakerMap: { 1: { name: 'Alice' } },
        onClick: options.onSpeakerClick,
      }),
      Search.configure(options.withLeafText
        ? { leafText: leafTextFromRenderText }
        : {}),
    ],
    content: '',
  })
}

/** 用 markdown 通道灌入内容，与生产链路一致 */
function setMarkdown(editor: Editor, md: string) {
  const mgr = (editor as any).markdown
  editor.commands.setContent(mgr.parse(md))
}

describe('speaker × tiptap-search 集成', () => {
  it('markdown [speaker:X] 解析为 atom 节点且往返幂等', () => {
    const editor = createEditor({ withLeafText: true })
    const mgr = (editor as any).markdown
    const md = '[speaker:1] 说了重要的话'

    setMarkdown(editor, md)

    let speakerCount = 0
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'speaker') {
        speakerCount += 1
        expect(node.isAtom).toBe(true)
        expect(node.attrs.originalLabel).toBe('1')
      }
      return true
    })
    expect(speakerCount).toBe(1)

    expect(mgr.serialize(editor.state.doc.toJSON())).toContain('[speaker:1]')
    editor.destroy()
  })

  it('renderText 挂到 spec.toText，返回标签展示名', () => {
    const editor = createEditor({ withLeafText: true })
    setMarkdown(editor, '[speaker:1] 发言')

    expect(editor.schema.nodes.speaker.spec.toText).toBeTypeOf('function')
    /** getText 同样消费 spec.toText，可作为契约生效的旁证 */
    expect(editor.getText()).toContain('Alice')
    editor.destroy()
  })

  it('注入 leafTextFromRenderText 后，搜说话人名字命中整个标签', () => {
    const editor = createEditor({ withLeafText: true })
    setMarkdown(editor, '[speaker:1] 说了重要的话\n\nAlice 稍后补充')

    editor.commands.setSearchQuery('alice')
    const { matches } = getSearchState(editor)
    /** 标签一处 + 正文一处 */
    expect(matches).toHaveLength(2)

    /** 标签命中折叠为整节点区间 [pos, pos + 1) */
    const chipMatch = matches[0]
    expect(chipMatch.to - chipMatch.from).toBe(1)
    expect(editor.state.doc.nodeAt(chipMatch.from)?.type.name).toBe('speaker')
    editor.destroy()
  })

  it('不注入 leafText 时 atom 不参与匹配（搜索包与节点零耦合）', () => {
    const editor = createEditor({ withLeafText: false })
    setMarkdown(editor, '[speaker:1] 说了重要的话')

    editor.commands.setSearchQuery('alice')
    expect(getSearchState(editor).matches).toHaveLength(0)
    editor.destroy()
  })

  it('缺省名随语言切换刷新（无 name / 无 map 命中的标签）', () => {
    const editor = createEditor({ withLeafText: true })
    /** speaker:2 未在 speakerMap，走 i18n 缺省名 */
    setMarkdown(editor, '[speaker:2] 发言')

    getI18n().changeLanguage(LANGUAGES.EN_US)
    expect(editor.getText()).toContain('Speaker 2')

    getI18n().changeLanguage(LANGUAGES.ZH_CN)
    expect(editor.getText()).toContain('说话人 2')

    getI18n().changeLanguage(LANGUAGES.EN_US)
    editor.destroy()
  })

  it('onClick 回调从 DOM 还原 attrs', () => {
    const onSpeakerClick = vi.fn()
    const editor = createEditor({ withLeafText: true, onSpeakerClick })
    setMarkdown(editor, '[speaker:1] 发言')

    const chip = editor.view.dom.querySelector<HTMLElement>('[data-speaker-original-label]')
    expect(chip).not.toBeNull()
    chip!.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onSpeakerClick).toHaveBeenCalledTimes(1)
    expect(onSpeakerClick.mock.calls[0][0]).toMatchObject({ originalLabel: '1' })
    editor.destroy()
  })
})
