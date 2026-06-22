import type { Editor } from '@tiptap/core'
import { MobileKeyboardGuard } from 'tiptap-editor-core/mobile-keyboard-guard'
import { describe, expect, it, vi } from 'vitest'
import { makeEditor } from './helpers'

/** 含一个未勾选任务项的文档 */
const TASK_HTML = '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>hello</p></li></ul>'

/** 1x1 透明 gif，确保离线可用、不依赖网络 */
const TINY_GIF = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
const IMAGE_HTML = `<p><img src="${TINY_GIF}" /></p><p>正文文字</p>`

/** 读取文档中第一个 taskItem 的 checked 属性 */
function firstTaskChecked(editor: Editor): boolean | undefined {
  let checked: boolean | undefined
  editor.state.doc.descendants((node) => {
    if (checked === undefined && node.type.name === 'taskItem')
      checked = node.attrs.checked
  })
  return checked
}

function fire(target: Element, type: string) {
  target.dispatchEvent(new Event(type, { bubbles: true }))
}

describe('mobileKeyboardGuard', () => {
  describe('任务项 checkbox', () => {
    it('切换勾选、拦截 change 且不调用 view.focus（无聚焦 → 不弹键盘 / 不跳滚）', () => {
      const { editor, cleanup } = makeEditor(TASK_HTML, [MobileKeyboardGuard.configure()])
      const focusSpy = vi.spyOn(editor.view, 'focus')
      const bubbled = vi.fn()
      document.addEventListener('change', bubbled)

      const checkbox = editor.view.dom.querySelector('input[type="checkbox"]') as HTMLInputElement
      expect(firstTaskChecked(editor)).toBe(false)

      checkbox.checked = true
      fire(checkbox, 'change')

      expect(firstTaskChecked(editor)).toBe(true)
      /** change 被捕获阶段拦截，未冒泡到 document（= 上游 focus 回调被掐断） */
      expect(bubbled).not.toHaveBeenCalled()
      expect(focusSpy).not.toHaveBeenCalled()

      document.removeEventListener('change', bubbled)
      cleanup()
    })

    it('enabled=false 时不拦截（change 照常冒泡，回退上游默认）', () => {
      const { editor, cleanup } = makeEditor(TASK_HTML, [MobileKeyboardGuard.configure({ enabled: false })])
      const bubbled = vi.fn()
      document.addEventListener('change', bubbled)

      const checkbox = editor.view.dom.querySelector('input[type="checkbox"]') as HTMLInputElement
      checkbox.checked = true
      fire(checkbox, 'change')

      expect(firstTaskChecked(editor)).toBe(true)
      expect(bubbled).toHaveBeenCalled()

      document.removeEventListener('change', bubbled)
      cleanup()
    })
  })

  describe('图片 atom 节点', () => {
    it('按下图片时置 inputMode=none（聚焦前压软键盘），按下正文恢复', () => {
      const { editor, cleanup } = makeEditor(IMAGE_HTML, [MobileKeyboardGuard.configure()])
      const dom = editor.view.dom as HTMLElement
      const img = dom.querySelector('img[data-image-node]') as HTMLElement
      expect(img).toBeTruthy()

      fire(img, 'pointerdown')
      expect(dom.inputMode).toBe('none')

      const paragraph = dom.querySelectorAll('p')[1]
      fire(paragraph, 'pointerdown')
      expect(dom.inputMode).not.toBe('none')

      cleanup()
    })

    it('enabled=false 时不介入图片', () => {
      const { editor, cleanup } = makeEditor(IMAGE_HTML, [MobileKeyboardGuard.configure({ enabled: false })])
      const dom = editor.view.dom as HTMLElement
      const img = dom.querySelector('img[data-image-node]') as HTMLElement

      fire(img, 'pointerdown')
      expect(dom.inputMode).not.toBe('none')

      cleanup()
    })
  })
})
