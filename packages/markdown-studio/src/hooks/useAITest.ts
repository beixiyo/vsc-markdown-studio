import { useEffect } from 'react'
import { BlockNoteEditor } from '@blocknote/core'
import { getMyAIExtension } from '../blocknoteExts/MyAIExtension'

/**
 * 用于自动化测试 AI 功能的自定义 Hook
 * @param editor BlockNote 编辑器实例
 */
export const useAITest = (editor: BlockNoteEditor<any, any, any> | null) => {
  useEffect(() => {
    // 确保 editor 对象已经存在，并且文档中至少有一个块
    if (editor && editor.topLevelBlocks.length > 0) {
      const myAI = getMyAIExtension(editor)

      const runAITest = async () => {
        console.log("开始 AI 功能测试...")

        // 1. 打开并调用 AI
        myAI.openAIMenuAtBlock(editor.topLevelBlocks[0].id)
        await myAI.callLLM()
        console.log("AI 请求完成，等待用户审核。状态:", myAI.state.aiMenuState)

        // 2. 等待3秒，模拟用户阅读和审核
        console.log("等待 3 秒后将自动接受建议...")
        await new Promise(resolve => setTimeout(resolve, 3000))

        // 3. 接受建议
        console.log("正在接受建议...")
        myAI.acceptChanges()
        console.log("建议已接受，测试结束。最终状态:", myAI.state.aiMenuState)
      }

      // 2秒后自动运行测试
      setTimeout(runAITest, 2000)
    }
  }, [editor])
}
