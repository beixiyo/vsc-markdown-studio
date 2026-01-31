import { SelectToolbar as _SelectToolbar } from './select-toolbar'
import { SelectToolbarContent } from './select-toolbar-content'

export * from './types'

export const SelectToolbar = Object.assign(_SelectToolbar, {
  ToolbarContent: SelectToolbarContent,
})
