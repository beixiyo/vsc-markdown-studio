/**
 * region-edit 内部用的 transaction meta 标记
 *
 * 给「自己程序化派发的 transaction」打标，使自身的 transaction 监听器跳过它们，
 * 避免把自己的写入误判成用户的外部编辑（从而触发冲突回滚）。
 *
 * ⚠️ `INTERNAL` 的字符串值必须保持 `'ai-internal'`：tiptap-ai 的 `TiptapEditorBridge`
 * 也用同一个串标记它自己的写入，二者靠这个共享值互不打架。改了会让两条路径并存时误冲突。
 */
export const REGION_META = {
  INTERNAL: 'ai-internal',
  SKIP_HISTORY: 'addToHistory',
} as const
