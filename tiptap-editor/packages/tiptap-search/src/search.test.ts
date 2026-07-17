import { Editor, Node } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'
import { getSearchState, leafTextFromRenderText, Search } from './index'

/** 模拟 speaker 芯片：展示文本来自 attrs（经 renderText / spec.toText 暴露），而非文本子节点 */
const ChipNode = Node.create({
  name: 'chip',
  inline: true,
  group: 'inline',
  atom: true,

  addAttributes() {
    return {
      name: {
        default: '',
        parseHTML: element => element.getAttribute('data-chip') ?? '',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-chip]' }]
  },

  renderHTML({ node }) {
    return ['span', { 'data-chip': node.attrs.name }]
  },

  renderText({ node }) {
    return node.attrs.name
  },
})

describe('search', () => {
  it('查找全部匹配并支持循环跳转', () => {
    const editor = new Editor({
      extensions: [StarterKit, Search],
      content: '<p>Flow<strong>tica</strong> and flowtica</p><p>Flowtica</p>',
    })

    editor.commands.setSearchQuery('flowtica')
    expect(getSearchState(editor).matches).toHaveLength(3)
    expect(getSearchState(editor).currentIndex).toBe(0)

    editor.commands.previousSearchResult()
    expect(getSearchState(editor).currentIndex).toBe(2)

    editor.commands.nextSearchResult()
    expect(getSearchState(editor).currentIndex).toBe(0)
  })

  it('不跨文本块匹配并可清空状态', () => {
    const editor = new Editor({
      extensions: [StarterKit, Search],
      content: '<p>Flow</p><p>tica</p><p>Flow<br>tica</p>',
    })

    editor.commands.setSearchQuery('Flowtica')
    expect(getSearchState(editor).matches).toHaveLength(0)

    editor.commands.clearSearch()
    expect(getSearchState(editor)).toMatchObject({
      query: '',
      currentIndex: -1,
      matches: [],
    })
  })

  it('注入 leafTextFromRenderText 后，原子节点的展示文本可被搜索，命中映射为整个节点区间', () => {
    const editor = new Editor({
      extensions: [
        StarterKit,
        Search.configure({ leafText: leafTextFromRenderText }),
        ChipNode,
      ],
      content: '<p>hello <span data-chip="Alice"></span> world</p><p>Alice said hi</p>',
    })

    editor.commands.setSearchQuery('alice')
    const { matches } = getSearchState(editor)
    expect(matches).toHaveLength(2)

    /** 第一处命中是芯片节点本身：区间恰好覆盖 [pos, pos + 1) */
    const chipMatch = matches[0]
    expect(chipMatch.to - chipMatch.from).toBe(1)
    expect(editor.state.doc.nodeAt(chipMatch.from)?.type.name).toBe('chip')
  })

  it('同一原子节点内多处命中折叠为一个匹配', () => {
    const editor = new Editor({
      extensions: [
        StarterKit,
        Search.configure({ leafText: leafTextFromRenderText }),
        ChipNode,
      ],
      content: '<p><span data-chip="Alice Alice"></span></p>',
    })

    editor.commands.setSearchQuery('Alice')
    expect(getSearchState(editor).matches).toHaveLength(1)
  })

  it('leafText 可由宿主注入自定义解析器', () => {
    const editor = new Editor({
      extensions: [
        StarterKit,
        Search.configure({
          /** 无视节点自身 renderText，全部按固定别名参与匹配 */
          leafText: ({ node }) => (node.type.name === 'chip'
            ? 'CustomAlias'
            : undefined),
        }),
        ChipNode,
      ],
      content: '<p><span data-chip="Alice"></span></p>',
    })

    editor.commands.setSearchQuery('customalias')
    expect(getSearchState(editor).matches).toHaveLength(1)

    editor.commands.setSearchQuery('alice')
    expect(getSearchState(editor).matches).toHaveLength(0)
  })

  it('默认（不注入 leafText）叶子文本完全不参与匹配', () => {
    const editor = new Editor({
      extensions: [StarterKit, Search, ChipNode],
      content: '<p>plain <span data-chip="Alice"></span></p>',
    })

    editor.commands.setSearchQuery('alice')
    expect(getSearchState(editor).matches).toHaveLength(0)

    editor.commands.setSearchQuery('plain')
    expect(getSearchState(editor).matches).toHaveLength(1)
  })
})
