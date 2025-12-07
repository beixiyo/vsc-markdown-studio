# Block 模型与 ProseMirror 映射

## Block 数据结构

BlockNote 的核心数据模型是 **Block**，它是一个高级抽象，提供了清晰的文档结构：

```typescript
type Block = {
  id: string;                    // 唯一标识符，在整个文档生命周期中保持不变
  type: string;                  // 块类型：paragraph, heading, listItem, image 等
  props: Record<string, any>;    // 块的属性：颜色、对齐、宽度等
  content: InlineContent[] | TableContent | undefined;  // 块的内联内容
  children: Block[];              // 嵌套的子块
};
```

### Block 的关键特性

1. **稳定的 ID**：
   - 每个 Block 有唯一的 `id`
   - `id` 在 Block 创建时生成，直到 Block 被删除前保持不变
   - 便于追踪和操作特定的 Block

2. **内容与结构分离**：
   - `content`：块的内联内容（文本、链接等），不包含子块
   - `children`：嵌套的子块，也是 Block 对象
   - 这种分离使得拖拽、缩进等操作更加简单

3. **类型系统**：
   - 每个 Block 有 `type`，定义块的行为和外观
   - 通过 Schema 定义可用的块类型
   - 支持自定义块类型

## ProseMirror 节点结构

BlockNote 内部使用 ProseMirror 的节点结构来存储文档，但结构更复杂：

### 核心节点类型

#### 1. BlockGroup

```typescript
name: "blockGroup"
group: "childContainer"
content: "blockGroupChild+"
```

- **作用**：容器节点，包含多个 Block
- **用途**：
  - 文档的根节点
  - 嵌套块的容器（当 Block 有 `children` 时）

#### 2. BlockContainer

```typescript
name: "blockContainer"
group: "blockGroupChild bnBlock"
content: "blockContent blockGroup?"
```

- **作用**：块容器，包装一个 Block
- **结构**：
  - 必须包含 `blockContent`（块的内容）
  - 可选包含 `blockGroup`（嵌套的子块）
- **特性**：存储 Block 的 `id` 和属性

#### 3. BlockContent（组）

```typescript
name: "paragraph"  // 或其他块类型
group: "blockContent"
content: "inline*"  // 或其他内容类型
```

- **作用**：定义块的内容类型和行为
- **示例**：paragraph、heading、listItem 等
- **内容**：通常是 inline 节点（文本、链接等）

### 节点组（Groups）

ProseMirror 使用"组"来组织节点：

- **`blockContent`**：块内容节点（paragraph、heading 等）
- **`blockGroupChild`**：可以在 blockGroup 中的节点（blockContainer、columnList）
- **`childContainer`**：可以包含子块的容器（blockGroup、column、columnList）
- **`bnBlock`**：直接映射到 BlockNote Block 的节点（blockContainer、column、columnList）

## Block 到 ProseMirror 的映射

### 映射示例

一个简单的 Block：
```typescript
{
  id: "1",
  type: "paragraph",
  content: [{ type: "text", text: "Hello", styles: {} }],
  children: []
}
```

映射到 ProseMirror：
```xml
<blockContainer id="1">
  <blockContent type="paragraph">
    <text>Hello</text>
  </blockContent>
</blockContainer>
```

### 嵌套 Block 的映射

```typescript
{
  id: "1",
  type: "paragraph",
  content: [{ type: "text", text: "Parent", styles: {} }],
  children: [
    {
      id: "2",
      type: "paragraph",
      content: [{ type: "text", text: "Child", styles: {} }],
      children: []
    }
  ]
}
```

映射到 ProseMirror：
```xml
<blockContainer id="1">
  <blockContent type="paragraph">
    <text>Parent</text>
  </blockContent>
  <blockGroup>
    <blockContainer id="2">
      <blockContent type="paragraph">
        <text>Child</text>
      </blockContent>
    </blockContainer>
  </blockGroup>
</blockContainer>
```

## 转换函数

BlockNote 提供了转换函数来处理 Block 和 ProseMirror Node 之间的转换：

### blockToNode

将 Block 转换为 ProseMirror Node：

```typescript
// packages/core/src/api/nodeConversions/blockToNode.ts
export function blockToNode(
  block: PartialBlock<any, any, any>,
  schema: Schema,
  // ...
): Node
```

### nodeToBlock

将 ProseMirror Node 转换为 Block：

```typescript
// packages/core/src/api/nodeConversions/nodeToBlock.ts
export function nodeToBlock<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
>(
  node: Node,
  // ...
): Block<BSchema, I, S>
```

### getBlockInfoFromPos

从 ProseMirror 位置获取 Block 信息：

```typescript
// packages/core/src/api/getBlockInfoFromPos.ts
export function getBlockInfoFromPos(
  doc: Node,
  pos: number,
): BlockInfo
```

## ProseMirror 的复杂性示例

### 1. 没有稳定的标识符

在 ProseMirror 中，节点没有 `id`，只能通过位置（position）来引用。但位置是动态的：

```typescript
// ProseMirror 方式：需要通过位置来操作
const $pos = doc.resolve(100);  // 位置 100
const node = $pos.nodeAfter;   // 获取节点
// 但如果前面插入了内容，位置就变了！

// BlockNote 方式：通过稳定的 ID
const block = editor.getBlock("block-id-123");  // ID 永远不变
```

### 2. 复杂的节点结构

要更新一个块，需要理解多层嵌套结构：

```typescript
// ProseMirror 方式：需要手动处理多层结构
function updateBlockInProseMirror(tr: Transaction, pos: number, newContent: string) {
  // 1. 解析位置，找到 blockContainer
  const $pos = tr.doc.resolve(pos);
  const blockContainer = $pos.nodeAfter;
  
  // 2. 遍历找到 blockContent 节点
  let blockContent: Node | null = null;
  let blockContentPos: number = 0;
  blockContainer.forEach((node, offset) => {
    if (node.type.spec.group === "blockContent") {
      blockContent = node;
      blockContentPos = pos + offset + 1;
    }
  });
  
  // 3. 检查是否有 blockGroup（子块）
  let blockGroup: Node | null = null;
  blockContainer.forEach((node, offset) => {
    if (node.type.name === "blockGroup") {
      blockGroup = node;
    }
  });
  
  // 4. 创建新的 blockContent 节点
  const newBlockContent = schema.nodes.paragraph.create({}, 
    schema.text(newContent)
  );
  
  // 5. 替换 blockContent，同时保留 blockGroup
  if (blockGroup) {
    tr.replaceWith(
      blockContentPos,
      blockContentPos + blockContent.nodeSize,
      newBlockContent
    );
  } else {
    // 如果没有 blockGroup，需要替换整个 blockContainer
    tr.replaceWith(pos, pos + blockContainer.nodeSize, 
      schema.nodes.blockContainer.create(
        { id: blockContainer.attrs.id },
        [newBlockContent]
      )
    );
  }
  
  // 6. 处理属性更新
  tr.setNodeMarkup(pos, null, {
    ...blockContainer.attrs,
    // 更新属性
  });
}

// BlockNote 方式：一行搞定
editor.updateBlock("block-id-123", {
  content: newContent
});
```

## Block 的优势

### 1. 稳定的标识

ProseMirror 的节点没有稳定的标识符，而 Block 的 `id` 在整个生命周期中保持不变，便于：
- 追踪特定块的变化
- 实现撤销/重做
- 实现协同编辑中的冲突解决

### 2. 统一的 API

所有 Block 都支持相同的操作：
- `insertBlocks`：插入块
- `updateBlock`：更新块
- `deleteBlocks`：删除块
- `moveBlocks`：移动块
- `replaceBlocks`：替换块

### 3. 清晰的层级结构

`content` 和 `children` 的分离使得：
- 拖拽操作更简单（只需操作 `children`）
- 缩进操作更直观（移动 `children`）
- 批量选择更容易（选择多个 Block）

### 4. 易于序列化

Block 结构清晰，易于：
- 序列化为 JSON
- 存储到数据库
- 传输到服务器
- 实现导入/导出功能

## 与 ProseMirror/Tiptap 的关系

### 兼容性

- **不需要额外的兼容层**：BlockNote 已经提供了完整的转换机制
- **无缝集成**：BlockNote 直接使用 ProseMirror 的 Schema 和节点模型
- **扩展性**：可以通过自定义 Schema 扩展 Block 类型

### 性能优化

- **Block 缓存**：使用 `WeakMap` 缓存 Block 对象，避免重复转换
- **增量更新**：只更新变化的 Block，而不是整个文档
- **懒加载**：只在需要时进行 Block 和 Node 的转换