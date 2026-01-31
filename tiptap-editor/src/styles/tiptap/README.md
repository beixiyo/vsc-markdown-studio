# Tiptap 排版样式系统

## 概述

本样式系统基于 `packages/markdown-mobile/src/styles/README.md` 中的 Markdown Mobile 排版规范实现，采用模块化的 SCSS 架构，为 Tiptap 编辑器提供统一、规范的排版样式。

## 设计原则

### 全局基准
- **基准字号**：16px  
- **基准行高**：1.75  
- **字体**：DM Sans，系统无衬线字体备用  
- **颜色**：使用 CSS 变量，支持浅色/深色主题自动切换

## 文件结构

```
tiptap/
├── tiptap.scss              # 主入口文件（导入所有模块）
├── _variables.scss          # 变量定义（颜色、主题等）
├── _base.scss              # 基础样式（重置、选区、占位符等）
├── _typography.scss        # 文字排版（标题、段落、文本样式）
├── _lists.scss             # 列表样式（有序、无序、嵌套列表）
├── _code.scss              # 代码样式（行内代码、代码块、键盘样式）
├── _blockquote.scss        # 引用样式
├── _hr.scss                # 分割线样式
├── _tables.scss            # 表格样式
├── _images.scss            # 图片样式
├── _links.scss             # 链接样式
├── _tasks.scss             # 任务列表样式（checkbox）
├── _collaboration.scss     # 协作光标样式
└── README.md               # 本文档
```

## 样式规范

### 文字与段落

#### 正文（Paragraph）
- **字号**：16px  
- **字重**：400  
- **行高**：1.75  
- **段前**：0  
- **段落后紧跟列表**：间距 6px

#### 加粗 / 小字 / 上下标
- **加粗（Bold）字重**：600  
- **小字（Small）**：12px，字重 400  
- **上/下标（Sup/Sub）**：字号为正文的 75%

### 标题（Heading）

#### 标题层级字号
- **H1**：18px  
- **H2**：18px  
- **H3**：17px  
- **H4/H5/H6**：16px  

#### 标题统一间距与排版
- **字重**：Bold  
- **行高**：1.75  
- **标题上间距（margin-top）**：44px  
- **标题下间距（margin-bottom）**：8px  
- **文档第一行标题**：上间距=0（不额外留白）

### 列表（List）

#### 列表整体
- **列表上下外边距**：0（不额外撑开上下空白）

#### 列表项（List Item）
- **行高**：1.5  
- **每条之间间距**：4px  
- **Marker（圆点/序号）颜色**：#5560F5（主题色）

#### 嵌套列表
- **子列表缩进**：1em  
- **嵌套列表与上一条之间**：4px

### 引用（Blockquote）
- **左侧竖线宽度**：0.25em  
- **引用左右内边距**：左右各 1em  
- **引用外边距**：0  
- **文字颜色**：70% 不透明度

### 代码（Code）

#### 行内代码（Inline Code）
- **字体**：JetBrains Mono NL，等宽字体备用  
- **字号**：12px（相对正文 85%）  
- **内边距**：上下 0.2em，左右 0.4em  
- **圆角**：6px  
- **背景**：使用 CSS 变量（随主题切换）

#### 代码块（Code Block）
- **字体**：等宽字体  
- **字号**：12px  
- **行高**：1.45  
- **内边距（padding）**：1rem  
- **圆角**：6px  
- **横向溢出**：可滚动

#### 键盘样式（KBD）
- **字号**：11px  
- **内边距**：0.25rem  
- **圆角**：6px  
- **边框**：1px

### 分割线（HR）
- **上下间距**：1.5rem  
- **线条高度（视觉厚度）**：0.25em  
- **颜色**：随主题

### 表格（Table）
- **单元格内边距**：上下 6px，左右 13px  
- **单元格边框**：1px  
- **表格可横向滚动**：是  
- **斑马纹**：隔行变色（偶数行浅底）

### 图片（Image）
- **最大宽度**：100%  
- **圆角**：8px  
- **上下间距**：2rem  
- **左右对齐图片的额外留白**：20px

### 任务列表（Task List）
- **Checkbox 尺寸**：22px × 22px  
- **相邻任务项间距**：4px  
- **已完成任务**：文字变灰（#999）+ 删除线 + 50% 不透明度

## CSS 变量

所有颜色通过 CSS 变量定义在 `_variables.scss` 中，支持主题切换：

### 文本颜色
- `--tt-text-primary`：主要文字
- `--tt-text-secondary`：次要文字（70% 不透明度）
- `--tt-text-muted`：弱化文字（50% 不透明度）

### 背景颜色
- `--tt-bg-primary`：主背景
- `--tt-bg-secondary`：次要背景
- `--tt-bg-tertiary`：三级背景

### 边框颜色
- `--tt-border-primary`：主边框
- `--tt-border-secondary`：次要边框

### 品牌颜色
- `--tt-brand`：品牌色
- `--tt-brand-alpha-20`：品牌色 20% 不透明度

### 功能颜色
- `--tt-link-text`：链接文字
- `--tt-code-bg`：代码背景
- `--tt-blockquote-border`：引用边框
- `--tt-hr-color`：分割线颜色
- `--tt-list-marker`：列表标记颜色
- `--tt-task-completed`：已完成任务颜色

## 使用方式

### 在 index.scss 中导入

```scss
@use './tiptap/tiptap';
```

### 在 HTML 中应用

确保编辑器容器使用 `.tiptap.ProseMirror` 类名：

```tsx
<div className="tiptap ProseMirror" contentEditable>
  {/* 编辑器内容 */}
</div>
```
