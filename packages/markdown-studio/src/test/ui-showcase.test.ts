import { gradientStylesMap, type GradientStyleType } from '@/blocknoteExts/styles/gradientStyles'

/**
 * UI 展示测试
 * 展示所有自定义组件和样式，包括渐变、Mermaid、LabelInput 等
 */
export async function runUIShowcaseTest() {
  const results = MDTest.createResults()

  MDTest.logTitle('UI 展示测试')

  /** 等待 MDBridge 可用 */
  await MDTest.std.waitForMDBridge(3000)
  if (!MDBridge) {
    throw new Error('MDBridge 不可用')
  }

  /** 清空内容 */
  MDTest.clearContent()

  /** 构建展示内容 */
  const showcaseContent = buildShowcaseContent()

  /** 设置内容 */
  await MDTest.asyncTestCase(results, '设置 UI 展示内容', async () => {
    MDBridge.setContent(showcaseContent)
    await MDTest.delay(100) // 等待渲染
    return 'UI 展示内容已设置'
  })

  /** 验证内容设置成功 */
  await MDTest.asyncTestCase(results, '验证内容设置成功', async () => {
    const document = MDBridge.getDocument()
    return document.length > 0
  }, true)

  MDTest.finalizeTest(results)
}

/**
 * 构建 UI 展示内容
 * 包含所有自定义组件和样式的完整展示
 */
function buildShowcaseContent() {
  return [
    /** 标题 */
    {
      type: 'heading',
      props: { level: 1 },
      content: [
        {
          type: 'text',
          text: '🎨 UI 组件展示',
          styles: {},
        },
      ],
    },

    /** 渐变样式展示 */
    {
      type: 'heading',
      props: { level: 2 },
      content: [
        {
          type: 'text',
          text: '🌈 渐变样式展示',
          styles: {},
        },
      ],
    },

    /** 渐变样式示例 */
    ...Object.entries(gradientStylesMap).map(([key, config]) => ({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: `${config.label}: `,
          styles: { bold: true },
        },
        {
          type: 'text',
          text: '这是一段应用了渐变样式的文本，展示了美丽的色彩效果。',
          styles: { gradient: key as GradientStyleType },
        },
      ],
    })),

    /** 分隔线 */
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '─'.repeat(50),
          styles: {},
        },
      ],
    },

    // Mermaid 图表展示
    {
      type: 'heading',
      props: { level: 2 },
      content: [
        {
          type: 'text',
          text: '📊 Mermaid 图表展示',
          styles: {},
        },
      ],
    },

    /** 流程图示例 */
    {
      type: 'mermaid',
      props: {
        diagram: `graph TD
    A[开始] --> B{是否登录?}
    B -->|是| C[进入主页]
    B -->|否| D[跳转登录页]
    C --> E[浏览内容]
    D --> F[输入用户名密码]
    F --> G{验证成功?}
    G -->|是| C
    G -->|否| H[显示错误信息]
    H --> F
    E --> I[结束]`,
        textAlignment: 'center',
      },
    },

    /** 时序图示例 */
    {
      type: 'mermaid',
      props: {
        diagram: `sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant D as 数据库

    U->>F: 点击登录按钮
    F->>B: 发送登录请求
    B->>D: 查询用户信息
    D-->>B: 返回用户数据
    B-->>F: 返回登录结果
    F-->>U: 显示登录状态`,
        textAlignment: 'center',
      },
    },

    /** 甘特图示例 */
    {
      type: 'mermaid',
      props: {
        diagram: `gantt
    title 项目开发计划
    dateFormat  YYYY-MM-DD
    section 设计阶段
    需求分析           :done,    des1, 2024-01-01,2024-01-07
    原型设计           :done,    des2, 2024-01-08, 2024-01-14
    section 开发阶段
    前端开发           :active,  dev1, 2024-01-15, 2024-02-15
    后端开发           :         dev2, 2024-01-22, 2024-02-22
    section 测试阶段
    单元测试           :         test1, 2024-02-16, 2024-02-28
    集成测试           :         test2, 2024-03-01, 2024-03-15`,
        textAlignment: 'center',
      },
    },

    /** 分隔线 */
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '─'.repeat(50),
          styles: {},
        },
      ],
    },

    // LabelInput 块展示
    {
      type: 'heading',
      props: { level: 2 },
      content: [
        {
          type: 'text',
          text: '💬 LabelInput 对话块展示',
          styles: {},
        },
      ],
    },

    /** 对话示例 */
    {
      type: 'labelInput',
      props: {
        label: '张三',
      },
      content: [
        {
          type: 'text',
          text: '你好！欢迎使用我们的 Markdown 编辑器。这里可以创建丰富的对话内容。',
          styles: {},
        },
      ],
    },

    {
      type: 'labelInput',
      props: {
        label: '李四',
      },
      content: [
        {
          type: 'text',
          text: '这个编辑器真的很棒！支持多种自定义组件，包括渐变样式、Mermaid 图表等。',
          styles: {},
        },
      ],
    },

    {
      type: 'labelInput',
      props: {
        label: '王五',
      },
      content: [
        {
          type: 'text',
          text: '是的，而且还可以通过双击标签来编辑说话人姓名，非常方便！',
          styles: {},
        },
      ],
    },

    /** 分隔线 */
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '─'.repeat(50),
          styles: {},
        },
      ],
    },

    /** 文本样式展示 */
    {
      type: 'heading',
      props: { level: 2 },
      content: [
        {
          type: 'text',
          text: '✨ 文本样式展示',
          styles: {},
        },
      ],
    },

    /** 基础样式 */
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '这是 ',
          styles: {},
        },
        {
          type: 'text',
          text: '粗体文本',
          styles: { bold: true },
        },
        {
          type: 'text',
          text: ' 和 ',
          styles: {},
        },
        {
          type: 'text',
          text: '斜体文本',
          styles: { italic: true },
        },
        {
          type: 'text',
          text: ' 以及 ',
          styles: {},
        },
        {
          type: 'text',
          text: '删除线文本',
          styles: { underline: true },
        },
        {
          type: 'text',
          text: ' 的组合效果。',
          styles: {},
        },
      ],
    },

    /** 代码样式 */
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '这里有一些 ',
          styles: {},
        },
        {
          type: 'text',
          text: '行内代码',
          styles: { code: true },
        },
        {
          type: 'text',
          text: ' 的示例。',
          styles: {},
        },
      ],
    },

    /** 分隔线 */
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '─'.repeat(50),
          styles: {},
        },
      ],
    },

    /** 列表展示 */
    {
      type: 'heading',
      props: { level: 2 },
      content: [
        {
          type: 'text',
          text: '📝 列表样式展示',
          styles: {},
        },
      ],
    },

    /** 无序列表 */
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '• 无序列表项 1',
          styles: {},
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '• 无序列表项 2',
          styles: {},
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '• 无序列表项 3',
          styles: {},
        },
      ],
    },

    /** 有序列表 */
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '1. 有序列表项 1',
          styles: {},
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '2. 有序列表项 2',
          styles: {},
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '3. 有序列表项 3',
          styles: {},
        },
      ],
    },

    /** 分隔线 */
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '─'.repeat(50),
          styles: {},
        },
      ],
    },

    /** 代码块展示 */
    {
      type: 'heading',
      props: { level: 2 },
      content: [
        {
          type: 'text',
          text: '💻 代码块展示',
          styles: {},
        },
      ],
    },

    // JavaScript 代码块
    {
      type: 'codeBlock',
      props: {
        language: 'javascript',
      },
      content: [
        {
          type: 'text',
          text: `// 这是一个 JavaScript 代码块示例
function greetUser(name) {
  return \`Hello, \${name}! 欢迎使用 Markdown 编辑器\`
}

// 使用示例
const message = greetUser('开发者')
console.log(message) // 输出: Hello, 开发者! 欢迎使用 Markdown 编辑器`,
          styles: {},
        },
      ],
    },

    // TypeScript 代码块
    {
      type: 'codeBlock',
      props: {
        language: 'typescript',
      },
      content: [
        {
          type: 'text',
          text: `// 这是一个 TypeScript 代码块示例
interface User {
  id: number
  name: string
  email: string
}

class UserService {
  private users: User[] = []

  addUser(user: User): void {
    this.users.push(user)
  }

  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id)
  }
}`,
          styles: {},
        },
      ],
    },

    /** 分隔线 */
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '─'.repeat(50),
          styles: {},
        },
      ],
    },
  ]
}
