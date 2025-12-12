import { createCheckListItemBlockSpec } from '@blocknote/core'
import { setupChecklistEvents } from './events'
import { injectChecklistStyles } from './styles'

/**
 * 将默认的清单项 <input type="checkbox"> 替换为 <div>，以避免 iOS WebView 聚焦输入框并弹出键盘
 * - 增加点击区域，整个容器都可触发，除了 p
 * - 判断是点击还是滑动，智能适配
 */
export function createDivCheckListItemBlockSpec() {
  const base = createCheckListItemBlockSpec()

  return {
    ...base,
    implementation: {
      ...base.implementation,
      render(block, editor) {
        injectChecklistStyles()
        const container = document.createElement('div')
        container.className = 'bn-checklist'

        const checkbox = document.createElement('div')
        checkbox.className = 'bn-checklist-checkbox'
        checkbox.setAttribute('role', 'checkbox')
        checkbox.setAttribute('aria-checked', block.props.checked
          ? 'true'
          : 'false')
        checkbox.tabIndex = 0

        if (block.props.checked) {
          checkbox.classList.add('is-checked')
        }

        const toggle = () => {
          editor.updateBlock(block, { props: { checked: !block.props.checked } })
          const nowChecked = !block.props.checked
          checkbox.setAttribute('aria-checked', nowChecked
            ? 'true'
            : 'false')
          checkbox.classList.toggle('is-checked', nowChecked)
        }

        /** 使用 <p> 作为内容 DOM，与默认实现相同 */
        const paragraph = document.createElement('p')

        container.appendChild(checkbox)
        container.appendChild(paragraph)

        /** 设置事件监听器 */
        setupChecklistEvents(container, paragraph, toggle)

        return {
          dom: container,
          contentDOM: paragraph,
        }
      },
    },
  } as typeof base
}
