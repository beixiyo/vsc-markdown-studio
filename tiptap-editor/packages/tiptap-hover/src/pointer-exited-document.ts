/** 指针离开当前文档（含移出浏览器窗口）时 relatedTarget 为空或不在 document 内 */
export function pointerExitedDocument(event: MouseEvent): boolean {
  const rel = event.relatedTarget
  if (rel == null)
    return true
  return !(rel instanceof Node && document.documentElement.contains(rel))
}
