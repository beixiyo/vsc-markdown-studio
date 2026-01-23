/** 暂时删除这个包，需要用到再改 */
// import { AnimateShow } from 'comps'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
/* eslint-disable no-console */
import {
  runAITest,
  runBlockClickTest,
  runBlockDetectionTest,
  runBlockSelectionTest,
  runBlocksTest,
  runCommandsTest,
  runContentTest,
  runCursorSelectionTest,
  runDocumentTest,
  runEditorStateTest,
  runEventsTest,
  runHeadingHoverTest,
  runHistoryOperationsTest,
  runImgTest,
  runLinkOperationsTest,
  runMermaidTest,
  runNestingMoveTest,
  runSpeakerTest,
  runStateSelectionHistoryTest,
  runStylesTextLinksTest,
  runTextOperationsTest,
  runUIShowcaseTest,
} from './index'

interface TestItem {
  label: string
  testFn: () => Promise<void> | void
  description: string
}

const testItems: TestItem[] = [
  { label: 'AI 功能', testFn: runAITest, description: '测试 AI 菜单、LLM 调用、建议接受/拒绝等功能' },
  { label: '块点击', testFn: runBlockClickTest, description: '测试 onBlockClick 点击监听功能' },
  { label: '块选区', testFn: runBlockSelectionTest, description: '测试 useClickSection 同步分组与块上下文' },
  { label: '块悬浮记录', testFn: runHeadingHoverTest, description: '测试 onBlockHover 和 getParentHeading 功能' },
  { label: '块操作', testFn: runBlocksTest, description: '测试插入、更新、删除、替换块操作' },
  { label: '块检测', testFn: runBlockDetectionTest, description: '测试鼠标悬浮、位置检测等新功能' },
  { label: '命令集合', testFn: runCommandsTest, description: '测试标题、段落、列表、样式等命令' },
  { label: '内容设置', testFn: runContentTest, description: '测试 Markdown 内容读写功能' },
  { label: '光标选择', testFn: runCursorSelectionTest, description: '测试光标位置和选择范围操作' },
  { label: '文档转换', testFn: runDocumentTest, description: '测试文档获取和 HTML 转换' },
  { label: '编辑器状态', testFn: runEditorStateTest, description: '测试聚焦、可编辑状态、空状态检查' },
  { label: '事件回调', testFn: runEventsTest, description: '测试内容变化和选区变化监听' },
  { label: '历史操作', testFn: runHistoryOperationsTest, description: '测试撤销、重做功能' },
  { label: '图片接口', testFn: runImgTest, description: '测试头部、底部图片设置接口' },
  { label: '链接操作', testFn: runLinkOperationsTest, description: '测试创建链接、获取链接URL' },
  { label: 'Mermaid 图表', testFn: runMermaidTest, description: '测试 Mermaid 图表的创建、编辑、删除功能' },
  { label: '嵌套移动', testFn: runNestingMoveTest, description: '测试块的嵌套和上下移动操作' },
  { label: 'Speaker 功能', testFn: runSpeakerTest, description: '测试 Speaker 内联内容的解析、显示和点击功能' },
  { label: '状态选区', testFn: runStateSelectionHistoryTest, description: '测试编辑器状态、选区和历史操作' },
  { label: '样式链接', testFn: runStylesTextLinksTest, description: '测试文本样式和链接操作' },
  { label: '文本操作', testFn: runTextOperationsTest, description: '测试获取选中文本、插入文本、提取块文本' },
  { label: 'UI 展示', testFn: runUIShowcaseTest, description: '展示所有自定义组件和样式，包括渐变、Mermaid、LabelInput 等' },
]

export function TestPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!import.meta.env.DEV) {
    return null
  }

  const handleRunTest = async (item: TestItem): Promise<boolean> => {
    console.log(`\n🚀 开始执行测试: ${item.label}`)
    console.log(`📝 描述: ${item.description}`)
    try {
      await item.testFn()
      // If testFn completes, it means it passed and finalizeTest has printed the success summary.
      return true
    }
    catch (error) {
      // The error from finalizeTest is caught here and contains failure details.
      console.error(`❌ 测试模块 [${item.label}] 失败。`)
      if (error instanceof Error) {
        // Log the detailed message from the error object.
        console.log(error.message) // Using console.log to avoid the scary red error icon for the details themselves.
      }
      else {
        console.error('发生未知错误:', error)
      }
      return false
    }
  }

  const handleRunAllTests = async () => {
    console.log('\n🎯 开始执行所有测试...')
    let allTestsPassed = true
    for (const item of testItems) {
      const success = await handleRunTest(item)
      if (!success) {
        allTestsPassed = false
        console.error(`\n🛑 测试执行因 "${item.label}" 失败而中止。`)
        break
      }
      /** 在测试之间添加小延迟，避免过快执行 */
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    if (allTestsPassed) {
      console.log('\n🏁 所有测试模块均已成功执行完毕！')
    }
    else {
      console.log('\n🏁 测试执行已中止。')
    }
  }

  return <div className="fixed right-3 top-3 z-50 flex flex-col p-3 rounded-md bg-white/80 dark:bg-neutral-900/80 backdrop-blur border border-neutral-200 dark:border-neutral-800 shadow max-w-48 max-h-[80vh] overflow-y-auto">
    <div
      className="text-xs font-medium text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-2 flex-shrink-0 flex justify-between items-center cursor-pointer"
      onClick={ () => setIsCollapsed(!isCollapsed) }
    >
      <span>测试面板</span>
      <motion.div
        animate={ {
          rotate: isCollapsed
            ? 0
            : 180,
        } }
        transition={ { duration: 0.2 } }
      >
        <ChevronDown className="h-4 w-4" />
      </motion.div>
    </div>

    {/* <AnimateShow show={ !isCollapsed }> */}
    <div className="pt-2">
      <button
        onClick={ handleRunAllTests }
        className="px-3 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium mb-2 flex-shrink-0 w-full"
        title="依次执行所有测试"
      >
        🎯 全部测试
      </button>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent">
        { testItems.map(item => (
          <button
            key={ item.label }
            onClick={ () => handleRunTest(item) }
            className="w-full px-3 py-1.5 rounded text-sm bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition-opacity text-left"
            title={ item.description }
          >
            { item.label }
          </button>
        )) }
      </div>
    </div>
    {/* </AnimateShow> */}
  </div>
}
