/**
 * @link https://www.blocknotejs.org/docs/features/custom-schemas/custom-blocks
 */

import { en } from '@blocknote/core/locales'
import { useCreateBlockNote } from '@blocknote/react'
import { Resizable } from 'comps'
import { useResizeObserver, useTheme } from 'hooks'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from 'utils'
import { createAIExtension } from './blocknoteExts/AI/AIExtension'
import { ArrowBeautify } from './blocknoteExts/exts/ArrowBeautify'
import { TimeInsert } from './blocknoteExts/exts/TimeInsert'
import { schema } from './blocknoteExts/schema'
import { Editor } from './components/Editor'
import { TocSidebar } from './components/TocSidebar'
import { useClickSection, useNotify, useSetupMDBridge, useToc, useVSCode } from './hooks'
import { TestPanel } from './test/TestPanel'

import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

export default function App() {
  useTheme()

  // ======================
  // * Editor
  // ======================
  const editor = useCreateBlockNote({
    schema,
    dictionary: {
      ...en,
      placeholders: {
        ...en.placeholders,
        default: 'Start typing your story...',
        heading: 'Enter your title here',
        emptyDocument: 'Begin your document',
      },
      slash_menu: {
        ...en.slash_menu,
        paragraph: {
          ...en.slash_menu.paragraph,
          title: 'Text Block',
          subtext: 'Regular text content',
        },
      },
    },

    _tiptapOptions: {
      extensions: [ArrowBeautify],
    },
    extensions: [TimeInsert, createAIExtension()],

    pasteHandler: ({ event, editor, defaultPasteHandler }) => {
      /** 检查剪贴板是否包含纯文本 */
      if (event.clipboardData?.types.includes('text/plain')) {
        const plainText = event.clipboardData.getData('text/plain')

        /**
         * 将双换行符替换为两个段落分隔符，将单换行符替换为 Markdown 硬换行符
         * 这是一个更精细的处理，以区分段落与行内换行
         */
        const markdown = plainText.replace(/(?<!\n)\n(?!\n)/g, '  \n') // 将单换行转换为 Markdown 硬换行符
        editor.pasteMarkdown(markdown)

        /** 告知 Blocknote 粘贴事件已处理 */
        return true
      }

      /** 如果不是纯文本，回退到默认的粘贴处理程序 */
      return defaultPasteHandler()
    },
  })

  // ======================
  // * Hooks
  // ======================
  const editorElRef = useRef<HTMLDivElement>(null)
  const notifyFns = useNotify(editor, editorElRef)

  useSetupMDBridge(editor, notifyFns)
  useVSCode()
  // useHoverSection(editor)
  useClickSection(editor)

  // ======================
  // * Sidebar
  // ======================
  const [size, setSize] = useState({ width: 0, height: 0 })

  const [sidebarVisible, setSidebarVisible] = useState(false)
  const { tocSections, currentBlockId, scrollToBlock } = useToc(editor)

  /** 处理侧栏项目点击 */
  const handleTocItemClick = (id: string) => {
    /** 从 id 中提取 blockId (格式: heading-{blockId}) */
    const blockId = id.replace('heading-', '')
    scrollToBlock(blockId)
  }

  useResizeObserver([editorElRef], (entry: ResizeObserverEntry) => {
    setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
  })

  return (
    <div className="w-full h-screen bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden" ref={ editorElRef }>
      {
        import.meta.env.VITE_ONLY_MD_EDITOR === 'true'
          ? <Editor editor={ editor } className="h-full" />
          : <>
            <Resizable
              fixedPanel="second"
              initialSize={ getSidebarSize(size.width) }
            >
              {/* Editor */ }
              <Editor editor={ editor } className="h-full" />

              {/* Sidebar */ }
              {
                sidebarVisible && <TocSidebar
                  tocSections={ tocSections }
                  currentBlockId={ currentBlockId }
                  onItemClick={ handleTocItemClick }
                  className="h-full"
                />
              }
            </Resizable>

            {/* Floating Toggle Button */ }
            <button
              onClick={ () => setSidebarVisible(!sidebarVisible) }
              className={ cn(
                'absolute top-1/2 -translate-y-1/2 p-2 rounded-l-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-r-0 border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-10',
                sidebarVisible
                  ? 'right-0'
                  : 'right-0',
              ) }
              title={ sidebarVisible
                ? '隐藏目录'
                : '显示目录' }
            >
              {
                sidebarVisible
                  ? <PanelLeftClose className="dark:text-white w-5 h-5" />
                  : <PanelLeftOpen className="dark:text-white w-5 h-5" />
              }
            </button>
          </>
      }

      <TestPanel />
    </div>
  )
}

function getSidebarSize(width: number) {
  if (width < 1024) {
    return 200
  }
  else if (width < 1280) {
    return 250
  }
  else if (width < 1440) {
    return 300
  }
  else {
    return 350
  }
}
