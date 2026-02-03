/**
 * tiptap-ui 通用样式常量，供下拉、工具栏等组件及外部（如 playground moreContent）统一使用
 */
export const TIPTAP_UI_STYLES = {
  /** 主图标：工具栏/触发器上的主图标 */
  icon: 'size-4',
  /** 次要图标：下拉选项内图标、触发器上的 chevron 等 */
  iconSecondary: 'size-4 text-icon',
  /** Cascader 下拉选项通用 className（如文本格式、文本对齐下拉） */

  cascaderOption: 'px-0 py-1.5',
  /** Cascader 选项内「图标 + 文案」时文案的默认样式（与 moreContentLabel 语义一致，多 ml-4 与图标间距） */
  cascaderOptionLabelWithIcon: 'ml-4 text-sm',

  /** 作为 Cascader moreContent 项时的触发器按钮：与 CascaderOption 对齐（边距 px-2 py-1、字号 text-sm、图标与文案 gap-2） */
  moreContentTrigger: 'hover:bg-transparent w-full justify-start flex items-center gap-2 h-auto min-h-0 py-0 px-2 text-sm font-normal',
  /** 作为 Cascader moreContent 项时，图标旁的文案 label 样式（与 CascaderOption 的 label text-sm 一致，仅色） */
  moreContentLabel: 'text-sm font-normal',
  /** 作为 Cascader moreContent 项时，选项的 label 槽位 className，使自定义内容（Button）占满行 */
  moreContentOptionLabel: 'flex-1 min-w-0',

  /** 工具栏/触发器按钮旁文案（图标+文字）的 label 样式 */
  triggerLabel: 'text-base text-textSecondary',
  /** 高亮按钮激活态图标（如 HighlighterIcon 的红色） */
  iconHighlight: 'size-4 text-systemRed',
} as const

export type TiptapUIStyles = typeof TIPTAP_UI_STYLES
