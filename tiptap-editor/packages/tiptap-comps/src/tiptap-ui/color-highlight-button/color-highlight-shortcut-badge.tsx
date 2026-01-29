import { Badge } from 'comps'
import { parseShortcutKeys } from 'tiptap-utils'
import { COLOR_HIGHLIGHT_SHORTCUT_KEY } from './use-color-highlight'

export function ColorHighlightShortcutBadge({
  shortcutKeys = COLOR_HIGHLIGHT_SHORTCUT_KEY,
}: {
  shortcutKeys?: string
}) {
  return <Badge variant="outline" size="sm" content={ parseShortcutKeys({ shortcutKeys }) } />
}
