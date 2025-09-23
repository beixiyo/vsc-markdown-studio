import { BlockNoteSchema, defaultBlockSpecs, defaultStyleSpecs } from '@blocknote/core'
import { useCreateBlockNote } from '@blocknote/react'
import { Resizable } from 'comps'
import { useResizeObserver, useTheme } from 'hooks'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from 'utils'
import { MermaidBlock } from './blocknoteExts/mermaid'
import { Editor } from './components/Editor'
import { TocSidebar } from './components/TocSidebar'
import { useNotify, useSetupMDBridge, useToc, useVSCode } from './hooks'
import { TestPanel } from './test/TestPanel'

import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

export default function App() {
  useTheme()

  // ======================
  // * Editor
  // ======================
  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      mermaid: MermaidBlock,
    },
    styleSpecs: {
      ...defaultStyleSpecs,
    },
  })

  const editor = useCreateBlockNote({
    schema,
    initialContent: [
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: 'Markdown 编辑器使用指南 ======================================',
            styles: {},
          },
        ],
        props: {
          level: 1,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '欢迎使用基于 BlockNote 的强大 Markdown 编辑器！\n\n这个编辑器支持实时预览、侧栏导航等高级功能。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '基础功能',
            styles: {},
          },
        ],
        props: {
          level: 2,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '编辑器支持所有标准的 Markdown 语法\n\n包括标题、列表、链接、图片等。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '标题语法',
            styles: {},
          },
        ],
        props: {
          level: 3,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '使用 # 符号创建标题，支持 1-6 级标题\n\n标题会自动出现在侧栏中，方便快速导航。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '高级特性',
            styles: {},
          },
        ],
        props: {
          level: 2,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '编辑器还支持 Mermaid 图表、实时协作等高级功能。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: 'Mermaid 图表',
            styles: {},
          },
        ],
        props: {
          level: 3,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '输入 /mermaid 可以插入流程图、时序图等图表。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '侧栏导航',
            styles: {},
          },
        ],
        props: {
          level: 3,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '右侧的目录面板会实时显示所有标题\n\n点击即可快速跳转到对应位置。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '快捷键',
            styles: {},
          },
        ],
        props: {
          level: 2,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '编辑器支持丰富的快捷键\n\n提高编辑效率。',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '常用快捷键',
            styles: {},
          },
        ],
        props: {
          level: 3,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Ctrl+B: 加粗文本\nCtrl+I: 斜体文本\nCtrl+K: 插入链接\nCtrl+Z: 撤销\nCtrl+Y: 重做',
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '第一章：新的开始',
            styles: {},
          },
        ],
        props: {
          level: 1,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '这是新章节的介绍内容，将会非常精彩。'.repeat(10),
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '1.1 节：初探',
            styles: {},
          },
        ],
        props: {
          level: 2,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '本节内容详情。'.repeat(20),
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '1.1.1 小节：深入',
            styles: {},
          },
        ],
        props: {
          level: 3,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '更深入的探讨。'.repeat(30),
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '第二章：发展',
            styles: {},
          },
        ],
        props: {
          level: 1,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '第二章的介绍。'.repeat(10),
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '2.1 节：高峰',
            styles: {},
          },
        ],
        props: {
          level: 2,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '攀登至高峰。'.repeat(20),
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '2.2 节：转折',
            styles: {},
          },
        ],
        props: {
          level: 2,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '意想不到的转折。'.repeat(20),
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '第三章：结局',
            styles: {},
          },
        ],
        props: {
          level: 1,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '故事的结局。'.repeat(10),
            styles: {},
          },
        ],
      },
      {
        type: 'heading',
        content: [
          {
            type: 'text',
            text: '总结',
            styles: {},
          },
        ],
        props: {
          level: 1,
        },
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '这个 Markdown 编辑器提供了完整的编辑体验\n\n结合了现代化的界面设计和强大的功能。现在你可以尝试点击右侧的标题来测试导航功能！',
            styles: {},
          },
        ],
      },
    ],
  })

  const editorElRef = useRef<HTMLDivElement>(null)
  const notifyFns = useNotify(editor, editorElRef)
  useSetupMDBridge(editor, notifyFns)
  useVSCode()

  // ======================
  // * Sidebar
  // ======================
  const [size, setSize] = useState({ width: 0, height: 0 })

  const [sidebarVisible, setSidebarVisible] = useState(true)
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
