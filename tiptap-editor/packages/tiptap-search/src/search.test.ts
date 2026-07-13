import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'
import { getSearchState, Search } from './index'

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
})
