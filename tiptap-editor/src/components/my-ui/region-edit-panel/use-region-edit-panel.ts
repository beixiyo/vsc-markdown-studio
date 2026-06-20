import type { Editor } from '@tiptap/react'
import type {
  RegionBlock,
  RegionEditController,
  RegionEditState,
  RegionOperationResult,
  StreamOpType,
} from 'tiptap-region'
import { useLatestCallback } from 'hooks'
import { useEffect, useState } from 'react'
import { createRegionEdit } from 'tiptap-region'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** 模拟算法侧 LLM 的流式 markdown 输出 */
const FAKE_STREAM_CHUNKS = [
  '这是 ',
  'AI 流式',
  '改写的内容，',
  '包含 **加粗**',
  ' 与 *斜体*。',
  '\n\n第二个段落，',
  '验证多块',
  '渐进解析。',
]

/**
 * region-edit 测试面板逻辑：控制器生命周期 + 面板状态 + 操作封装
 */
export function useRegionEditPanel(editor: Editor | null) {
  const [controller, setController] = useState<RegionEditController | null>(null)
  const [state, setState] = useState<RegionEditState>('idle')
  const [blocks, setBlocks] = useState<RegionBlock[]>([])
  const [results, setResults] = useState<RegionOperationResult[] | null>(null)
  const [opsJson, setOpsJson] = useState('')
  const [targetHash, setTargetHash] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)

  /** 与编辑器实例同步：创建 / 销毁控制器 */
  useEffect(() => {
    if (!editor) {
      return
    }
    const ctrl = createRegionEdit(editor, {
      onStateChange: next => setState(next),
      onConflict: () => setNotice('检测到外部编辑冲突，会话已终止'),
    })
    setController(ctrl)

    return () => {
      ctrl.destroy()
      setController(null)
    }
  }, [editor])

  const readBlocks = useLatestCallback(() => {
    if (!controller)
      return
    const result = controller.readBlocks()
    setBlocks(result.blocks)
    setNotice(`docVersion ${result.docVersion}，共 ${result.blocks.length} 块`)
    setTargetHash(null)
  })

  /** 基于当前块列表生成一份可直接运行的示例操作 JSON */
  const fillExample = useLatestCallback(() => {
    if (!blocks.length) {
      setNotice('请先读取块列表')
      return
    }
    const target = targetHash ?? blocks[Math.min(1, blocks.length - 1)].hash
    /** insertAfter 在前：它不改变目标块，后面的 replace 仍能命中同一 hash；反序则 replace 会让 hash 失效 */
    const example = [
      {
        target,
        op: 'insertAfter',
        content: {
          format: 'html',
          value: '<p><mark data-color="skyBlue">HTML 格式插入的渐变高亮段落</mark></p>',
        },
      },
      {
        target,
        op: 'replace',
        content: { format: 'markdown', value: '这是 **applyOperations** 整块替换的内容' },
      },
    ]
    setOpsJson(JSON.stringify(example, null, 2))
  })

  const applyOps = useLatestCallback((preview: boolean) => {
    if (!controller)
      return
    let operations: any
    try {
      operations = JSON.parse(opsJson)
    }
    catch {
      setNotice('operations JSON 解析失败')
      return
    }
    const result = controller.applyOperations({
      operations,
      options: { preview },
    })
    setResults(result.results)
    setNotice(null)
  })

  /** 模拟移动端走流式三件套（chunk 间隔模拟网络延迟） */
  const simulateStream = useLatestCallback(async (op: StreamOpType) => {
    if (!controller)
      return
    if (!targetHash && op !== 'append' && op !== 'prepend') {
      setNotice('请先在块列表中点选一个目标块')
      return
    }

    try {
      const { streamId } = controller.beginStream({
        target: op === 'append' || op === 'prepend'
          ? 'doc'
          : targetHash!,
        op,
        format: 'markdown',
      })

      setStreaming(true)
      setNotice(null)
      for (const chunk of FAKE_STREAM_CHUNKS) {
        await sleep(150)
        controller.pushChunk(streamId, chunk)
      }
      controller.endStream(streamId)
    }
    catch (err: any) {
      setNotice(`流式失败：${err?.code ?? err?.message ?? err}`)
    }
    finally {
      setStreaming(false)
    }
  })

  const accept = useLatestCallback(() => controller?.accept())
  const reject = useLatestCallback(() => controller?.reject())

  return {
    state,
    blocks,
    results,
    opsJson,
    setOpsJson,
    targetHash,
    setTargetHash,
    notice,
    streaming,
    ready: !!controller,
    readBlocks,
    fillExample,
    applyOps,
    simulateStream,
    accept,
    reject,
  }
}
