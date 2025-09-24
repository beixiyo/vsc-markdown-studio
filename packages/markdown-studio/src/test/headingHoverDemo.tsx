/**
 * 标题悬浮监听演示组件
 *
 * 此组件展示了如何在 React 组件中使用 onBlockHover 功能
 * 来监听鼠标悬浮事件并显示当前块的上级标题
 */

import { useEffect, useState } from 'react'

/**
 * 上级标题信息类型
 */
interface HeadingInfo {
  level: number
  text: string
  index: number
}

/**
 * 标题悬浮监听演示组件
 */
export function HeadingHoverDemo() {
  const [currentHeading, setCurrentHeading] = useState<HeadingInfo | null>(null)
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    // 检查 MDBridge 是否可用
    if (!MDBridge) {
      console.warn('MDBridge 未初始化，请等待编辑器加载完成')
      return
    }

    let unsubscribe: (() => void) | undefined

    if (isListening) {
      // 注册 onBlockHover 回调
      unsubscribe = MDBridge.onBlockHover((block) => {
        if (block) {
          // 获取当前块的上级标题
          const parentHeading = MDBridge.getParentHeading(block.id)

          if (parentHeading) {
            setCurrentHeading({
              level: parentHeading.level,
              text: parentHeading.text,
              index: parentHeading.index
            })
          } else {
            setCurrentHeading(null)
          }
        } else {
          setCurrentHeading(null)
        }
      })
    }

    // 清理函数
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [isListening])

  const toggleListening = () => {
    setIsListening(!isListening)
  }

  const clearHeading = () => {
    setCurrentHeading(null)
  }

  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          标题监听器
        </h3>
        <button
          onClick={toggleListening}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            isListening
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isListening ? '停止监听' : '开始监听'}
        </button>
      </div>

      {isListening && (
        <div className="space-y-2">
          {currentHeading ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  H{currentHeading.level}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  索引: {currentHeading.index}
                </span>
              </div>
              <p className="text-gray-900 dark:text-white text-sm">
                {currentHeading.text}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-3">
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                鼠标悬浮在编辑器块上查看上级标题
              </p>
            </div>
          )}

          <button
            onClick={clearHeading}
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            清除显示
          </button>
        </div>
      )}

      {!isListening && (
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          点击"开始监听"来启用标题监听功能
        </div>
      )}
    </div>
  )
}

/**
 * 简化的标题监听 Hook
 *
 * @returns 标题监听相关的状态和方法
 */
export function useHeadingHover() {
  const [currentHeading, setCurrentHeading] = useState<HeadingInfo | null>(null)
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    if (!MDBridge || !isListening) {
      return
    }

    const unsubscribe = MDBridge.onBlockHover((block) => {
      if (block) {
        const parentHeading = MDBridge.getParentHeading(block.id)

        if (parentHeading) {
          setCurrentHeading({
            level: parentHeading.level,
            text: parentHeading.text,
            index: parentHeading.index
          })
        } else {
          setCurrentHeading(null)
        }
      } else {
        setCurrentHeading(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [isListening])

  const startListening = () => setIsListening(true)
  const stopListening = () => setIsListening(false)

  return {
    currentHeading,
    isListening,
    startListening,
    stopListening
  }
}
