import { useEditor, type UseEditorOptions } from '@tiptap/react'
import { createExtensions, type SpeakerClick, type SpeakerMap } from '../extensions'
import { createHandleClick } from '../utils'

type UseDefaultOptions = UseEditorOptions & {
  speakerMap?: SpeakerMap
  onSpeakerClick?: SpeakerClick
}

export function useDefaultEditor(options: UseDefaultOptions) {
  const {
    speakerMap,
    onSpeakerClick,
    ...restOptions
  } = options

  const editor = useEditor({
    /** 延迟渲染：等待所有扩展初始化完成后再渲染，避免闪烁 */
    immediatelyRender: false,

    /** 编辑器 DOM 属性配置 */
    editorProps: {
      attributes: {
        /** 禁用浏览器自动完成功能 */
        'autocomplete': 'off',
        /** 禁用自动纠错（主要针对 iOS Safari） */
        'autocorrect': 'off',
        /** 禁用自动首字母大写（移动端） */
        'autocapitalize': 'off',
        /** 无障碍标签：供屏幕阅读器使用 */
        'aria-label': 'Main content area, start typing to enter text.',
        /** 编辑器根元素的 CSS 类名 */
        'class': 'flex-1 p-10 sm:p-12',
      },
      // Selected 的文本可被点击插入取消 Selected 状态
      handleClick: createHandleClick(),
    },

    /** 扩展列表：定义编辑器的所有功能 */
    extensions: createExtensions({
      speakerMap,
      onSpeakerClick,
    }),
    ...restOptions,
  })

  return editor
}
