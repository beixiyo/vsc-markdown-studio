/**
 * 平台相关工具函数
 */

export const MAC_SYMBOLS: Record<string, string> = {
  mod: '⌘',
  command: '⌘',
  meta: '⌘',
  ctrl: '⌃',
  control: '⌃',
  alt: '⌥',
  option: '⌥',
  shift: '⇧',
  backspace: 'Del',
  delete: '⌦',
  enter: '⏎',
  escape: '⎋',
  capslock: '⇪',
} as const

/**
 * 判断当前平台是否为 macOS
 * @returns 布尔值，表示当前平台是否为 Mac
 */
export function isMac(): boolean {
  return (
    typeof navigator !== 'undefined'
    && navigator.platform.toLowerCase().includes('mac')
  )
}

/**
 * 根据平台（Mac 或非 Mac）格式化快捷键
 * @param key - 要格式化的键（例如 "ctrl"、"alt"、"shift"）
 * @param isMac - 布尔值，表示平台是否为 Mac
 * @param capitalize - 是否将键首字母大写（默认：true）
 * @returns 格式化后的快捷键符号
 */
export function formatShortcutKey(key: string, isMac: boolean, capitalize: boolean = true) {
  if (isMac) {
    const lowerKey = key.toLowerCase()
    return MAC_SYMBOLS[lowerKey] || (capitalize
      ? key.toUpperCase()
      : key)
  }

  return capitalize
    ? key.charAt(0).toUpperCase() + key.slice(1)
    : key
}

/**
 * 将快捷键字符串解析为格式化键符号数组
 * @param shortcutKeys - 快捷键字符串（例如 "ctrl-alt-shift"）
 * @param delimiter - 用于分割键的分隔符（默认："+"）
 * @param capitalize - 是否将键首字母大写（默认：true）
 * @returns 格式化的快捷键符号数组
 */
export function parseShortcutKeys(props: {
  shortcutKeys: string | undefined
  delimiter?: string
  capitalize?: boolean
}) {
  const { shortcutKeys, delimiter = '+', capitalize = true } = props

  if (!shortcutKeys)
    return []

  return shortcutKeys
    .split(delimiter)
    .map(key => key.trim())
    .map(key => formatShortcutKey(key, isMac(), capitalize))
}
