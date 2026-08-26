/**
 * Tiptap UI runtime 使用的 DOM 属性名
 *
 * 这些属性只用于编辑器 UI 的浮层保活、状态标记和定位，不参与文档序列化
 */
export const TIPTAP_DATA_ATTR = {
  /** 选中文本工具栏及其子浮层的保活标记 */
  selectionToolbarKeepOpen: 'data-vv-selection-toolbar-keep-open',
  /** 选中文本工具栏「更多」浮层的保活标记 */
  moreContentKeepOpen: 'data-vv-more-content-keep-open',
  /** 评论列表项是否为当前激活项 */
  active: 'data-vv-active',
  /** 编辑器工具按钮的激活状态 */
  activeState: 'data-vv-active-state',
  /** 编辑器工具按钮的视觉层级 */
  appearance: 'data-vv-appearance',
  /** 块操作菜单浮层的定位标记 */
  blockActionMenu: 'data-vv-block-action-menu',
  /** 移动端工具栏返回按钮的样式标记 */
  style: 'data-vv-style',
  /** 菜单项当前是否被键盘导航高亮 */
  highlighted: 'data-vv-highlighted',
  /** Tiptap UI 控件是否不可用 */
  disabled: 'data-vv-disabled',

  ctxRef: {
    /** 引用节点当前是否处于流式生成状态 */
    streaming: 'data-vv-ctx-ref-streaming',
  },

  image: {
    /** 图片 NodeView 当前是否被编辑器选中 */
    selected: 'data-vv-image-selected',
  },

  region: {
    /** 临时 loading 装饰层所属 frame */
    loadingFrame: 'data-vv-region-loading-frame',
    /** 临时 loading 装饰层在 frame 内的角色 */
    loadingFrameRole: 'data-vv-region-loading-frame-role',
  },

  search: {
    /** 搜索匹配 Decoration 的当前项状态 */
    match: 'data-vv-search-match',
  },

  suggestion: {
    /** 触发建议浮层的 Decoration 锚点 ID */
    decorationId: 'data-vv-suggestion-decoration-id',
  },
} as const
