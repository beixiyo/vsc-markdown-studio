export const checklistStyles = `
.bn-checklist {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.bn-checklist p {
  margin: 0;
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.bn-checklist-checkbox {
  margin: 6px 0;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--bn-colors-border, #d0d5dd);
  border-radius: 4px;
  background: var(--bn-colors-surface, #fff);
  box-sizing: border-box;
  user-select: none;
  cursor: pointer;
  flex: 0 0 18px;
  flex-shrink: 0;
}

.bn-checklist-checkbox.is-checked {
  background: var(--bn-colors-primary, #5b8def);
  border-color: var(--bn-colors-primary, #5b8def);
}

.bn-checklist-checkbox.is-checked::after {
  content: '';
  width: 6px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
`

let stylesInjected = false
export function injectChecklistStyles(): void {
  if (typeof document === 'undefined' || stylesInjected)
    return

  const style = document.createElement('style')
  style.id = 'bn-checklist-styles'
  style.textContent = checklistStyles
  document.head.appendChild(style)

  stylesInjected = true
}
