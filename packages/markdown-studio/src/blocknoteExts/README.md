# Blocknote 扩展机制

本文档深入探讨了 Blocknote.js 的扩展机制，旨在提供一份全面的中文指南，帮助开发者理解和利用其强大的可扩展性

- https://www.blocknotejs.org/docs/features/custom-schemas/custom-styles
- https://www.blocknotejs.org/docs/features/custom-schemas/custom-blocks
- https://www.blocknotejs.org/docs/features/extensions

## 1. 扩展 (Extensions) 总览

Blocknote 的核心是一个基于 [ProseMirror](https://prosemirror.net/) 和 [TipTap](https://tiptap.dev/) 的编辑器，其扩展系统也与这两者紧密相关。一个扩展 (Extension) 是一个功能包，可以增强编辑器的行为。

你可以通过扩展添加以下功能：

- **键盘快捷键 (Keyboard Shortcuts)**：为特定操作绑定快捷键。
- **输入规则 (Input Rules)**：在用户输入匹配特定模式时触发相应动作（例如，输入 `(c)` 自动转换成 `©`）。
- **ProseMirror 插件**：直接利用 ProseMirror 生态中的强大插件。
- **TipTap 扩展**：集成 TipTap 的扩展能力。

### 1.1 创建扩展

创建扩展的首选方式是使用 `createBlockNoteExtension` 函数。

```ts
import { createBlockNoteExtension } from '@blocknote/core'

const customExtension = createBlockNoteExtension({
  /** 扩展的唯一标识符 */
  key: 'customExtensionKey',

  /** 定义键盘快捷键 */
  keyboardShortcuts: {
    'Mod-l': (ctx) => {
      /** 按下 Ctrl/Cmd + L 时执行的逻辑 */
      console.log('Custom shortcut triggered!')
      return true // 返回 true 表示事件已被处理
    },
  },

  /** 定义输入规则 */
  inputRules: [
    {
      find: /^->$/,
      replace: ({ match, range, editor }) => {
        /** 将 "->" 转换为 "→" */
        return {
          type: 'paragraph',
          content: [{ type: 'text', text: '→' }]
        }
      }
    }
  ],

  /** 添加 ProseMirror 插件 */
  plugins: [
    // new MyProseMirrorPlugin()
  ],

  /** 添加 TipTap 扩展 */
  tiptapExtensions: [
    // new MyTipTapExtension()
  ],
})
```

### 1.2 应用扩展

扩展可以在两个地方被应用：

1.  **直接添加到编辑器**：在初始化编辑器时，通过 `extensions` 数组传入。

    ```ts
    const editor = useCreateBlockNote({
      extensions: [customExtension],
    })
    ```

2.  **附加到自定义 Block**：在创建自定义 `Block` 时，可以为其指定专属的扩展。这使得扩展逻辑可以与特定的 `Block` 类型解耦和复用。

## 2. 自定义 Schema：扩展内容的核心

要真正释放 Blocknote 的潜力，你需要了解 **Schema**。Schema 定义了编辑器中允许存在哪些类型的内容，它是扩展 Blocknote 内容能力的基石。

一个 Schema 包含三个主要部分：

- **`blockSpecs`**：定义各种**块级元素**，如段落、标题、列表、自定义卡片等。
- **`inlineContentSpecs`**：定义**内联内容**，如链接、提及 (@user)、标签等。
- **`styleSpecs`**：定义可以应用于文本的**样式**，如粗体、斜体、自定义字体、颜色等。

### 2.1 创建和使用 Schema

你有两种方式来创建 Schema：

1.  **扩展默认 Schema (推荐)**：这是最常见的方式，在保留所有默认功能的基础上添加你自己的内容类型。

    ```ts
    import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core'
    import { createAlert } from './MyCustomBlock' // 假设这是自定义的 Block

    const schema = BlockNoteSchema.create().extend({
      blockSpecs: {
        /** 添加自定义的 alert block */
        alert: createAlert(),
      },
    })
    ```

2.  **从零开始创建 Schema**：当你需要完全控制编辑器功能，甚至移除某些默认功能时使用。

    ```ts
    const schema = BlockNoteSchema.create({
      blockSpecs: {
        /** 只保留默认的段落 block */
        paragraph: defaultBlockSpecs.paragraph,
        /** 添加自定义的 alert block */
        alert: createAlert(),
      },
      // inlineContentSpecs 和 styleSpecs 也可以类似地完全自定义
    })
    ```

创建完 `schema` 对象后，在初始化编辑器时传入即可：

```ts
const editor = useCreateBlockNote({
  schema,
})
```

## 3. 创建自定义内容类型

下面我们分别深入探讨如何创建自定义的 `Block`、`Inline Content` 和 `Style`。

### 3.1 自定义块 (Custom Blocks)

块是文档的一等公民。你可以使用 `createReactBlockSpec` 函数来创建自定义的块。

此函数接收两个核心参数：`blockConfig` 和 `blockImplementation`。

- **`blockConfig` (块配置)**
  - `type`: 块的唯一标识符 (string)。
  - `propSchema`: 定义块支持的属性 (props)，用于配置块的状态和外观。例如，一个 `alert` 块可以有一个 `type` 属性来区分 `warning`、`error` 等状态。
  - `content`: 定义块的内容模型。`"inline"` 表示块内可以包含富文本内容；`"none"` 表示块内没有可编辑内容。

- **`blockImplementation` (块实现)**
  - `render`: 一个 React 组件，负责在编辑器中渲染该块。它会接收 `block` (当前块对象)、`editor` (编辑器实例) 和 `contentRef` (一个 ref，必须附加到你希望承载富文本内容的 DOM 元素上)。
  - `parse`: (可选) 一个函数，定义如何将粘贴的 HTML 内容解析成你的自定义块。
  - `toExternalHTML`: (可选) 一个 React 组件，定义如何将你的块导出为外部 HTML (例如，用于复制粘贴)。

**示例：创建一个简单的 Alert Block**

`Alert.ts`
```ts
import { createReactBlockSpec } from '@blocknote/react'

export const Alert = createReactBlockSpec(
  // BlockConfig
  {
    type: 'alert',
    propSchema: {
      type: {
        default: 'info',
        values: ['info', 'warning', 'error'],
      },
    },
    content: 'inline', // 允许在 alert 内部写字
  },
  // BlockImplementation
  {
    render: (props) => (
      <div className={ `alert alert-${props.block.props.type}` }>
        {/* contentRef 必须被附加到可编辑内容容器上 */ }
        <div ref={ props.contentRef } />
      </div>
    ),
  }
)
```

### 3.2 自定义内联内容 (Custom Inline Content)

内联内容是指出现在文本流中的非文本元素，例如 `@` 提及或标签。使用 `createReactInlineContentSpec` 创建。

其结构与 `createReactBlockSpec` 非常相似：

- **`inlineContentConfig`**
  - `type`: 唯一标识符。
  - `propSchema`: 定义属性。
  - `content`: `"styled"` 表示内部可以包含带样式的文本；`"none"` 表示它是一个原子性的、不可编辑的整体（如一个标签）。

- **`inlineContentImplementation`**
  - `render`: 渲染组件。对于 `content: "none"` 的情况，它只接收 `inlineContent` 属性。

**示例：创建一个 Mention 标签**

`Mention.ts`
```ts
import { createReactInlineContentSpec } from '@blocknote/react'

export const Mention = createReactInlineContentSpec(
  {
    type: 'mention',
    propSchema: {
      user: {
        default: 'Unknown',
      },
    },
    content: 'none', // Mention 是一个原子单位，内部不可编辑
  },
  {
    render: (props) => (
      <span className="mention">
        @{ props.inlineContent.props.user }
      </span>
    ),
  }
)
```
通常，自定义内联内容会配合 `SuggestionMenu` (建议菜单) 来提供更好的用户体验，例如输入 `@` 后弹出用户列表。

### 3.3 自定义样式 (Custom Styles)

样式用于格式化文本，例如改变字体、颜色等。使用 `createReactStyleSpec` 创建。

- **`styleConfig`**
  - `type`: 唯一标识符。
  - `propSchema`: 定义样式的属性类型。`"boolean"` 用于开关型样式 (如粗体)，`"string"` 用于需要值的样式 (如颜色值、字体名)。

- **`styleImplementation`**
  - `render`: 一个 React 组件，用于包裹被应用了该样式的文本。它接收 `props.contentRef` 来引用其内容。如果 `propSchema` 是 `"string"`，它还会接收 `props.value`。

**示例：创建一个自定义字体样式**

`Font.ts`
```ts
import { createReactStyleSpec } from '@blocknote/react'

export const Font = createReactStyleSpec(
  {
    type: 'font',
    propSchema: 'string', // 样式的值是字符串（字体名称）
  },
  {
    render: (props) => (
      <span
        style={ { fontFamily: props.value } }
        ref={ props.contentRef }
      />
    ),
  }
)
```
为了让用户能使用这个样式，你通常需要为它在 `FormattingToolbar` (格式化工具栏) 中添加一个对应的按钮。

## 4. 总结

Blocknote 的扩展机制是一个分层且设计良好的系统：

1.  **Schema** 是地基，定义了编辑器内容的“词汇表” (`Block`, `Inline Content`, `Style`)。
2.  通过 `createReactBlockSpec`、`createReactInlineContentSpec` 和 `createReactStyleSpec` 这三个函数，你可以使用 React 组件来**创建自定义的内容类型**，并定义它们的行为、属性和渲染方式。
3.  创建好的内容类型被添加到 `Schema` 中，然后将 `Schema` 传递给编辑器实例。
4.  **Extensions** (`createBlockNoteExtension`) 则提供了在 Schema 之外增强编辑器行为的能力，如快捷键和输入规则，它可以被全局应用，也可以绑定到特定的 `Block` 上。

通过组合使用这些机制，你可以将 Blocknote 从一个标准的富文本编辑器，转变为一个高度定制化的、满足特定业务需求的结构化数据编辑器。
