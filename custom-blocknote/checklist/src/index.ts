import { createCheckListItemBlockSpec } from '@blocknote/core'
import { injectChecklistStyles } from './styles'

// Replaces the default checklist <input type="checkbox"> with a <div>
// to avoid iOS WebView focusing the input and summoning the keyboard.
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

        // Prevent iOS from focusing contenteditable/keyboard on tap
        checkbox.addEventListener('touchstart', e => e.preventDefault(), { passive: false } as any)
        checkbox.addEventListener('mousedown', e => e.preventDefault())
        checkbox.addEventListener('click', (e) => {
          e.preventDefault()
          toggle()
        })
        checkbox.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle()
          }
        })

        // Use a <p> for content DOM, same as default
        const paragraph = document.createElement('p')

        container.appendChild(checkbox)
        container.appendChild(paragraph)

        return {
          dom: container,
          contentDOM: paragraph,
        }
      },
    },
  } as typeof base
}
