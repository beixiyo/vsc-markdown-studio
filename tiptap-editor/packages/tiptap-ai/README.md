# AI 功能重新设计（方案讨论稿）

本设计仅讨论抽象与配置，不涉及具体实现。

## 核心目标
- 高度抽象：仅暴露两个数据源（流式 / 非流式），直接接收响应，无需用户传入 URL 等底层信息
- 选区透传：将用户选中的文本与位置信息传递给调用者，由调用者决定流式或非流式调用
- 配置驱动：通过配置对象定义适配器、响应结构、UI 行为，保持可扩展
- 决策闭环：提供接受 / 拒绝交互，处理完毕后进入特殊高亮提示

## 核心角色
- AIAdapter：标准化接口，分为 `streamingAdapter` 与 `batchAdapter`
- AIOrchestrator：路由到对应适配器，转为统一事件流（start / chunk / done / error）
- Preview Layer（预览装订层）：承载预览内容与高亮，不直接写正文

## 数据与配置（示意）
- SelectionPayload：选中文本、范围信息、版本号
- ResponseSchema：通过配置声明响应字段（如 text、delta、meta），未知字段透传 meta
- UIBehaviorConfig：高亮样式、按钮文案、快捷键、loading 与流进度指示
- AIConfig：注册适配器、选择策略（预览或自动应用）、撤销策略、超时与重试等

| 配置块 | 作用 | 关键字段示例 |
| -- | -- | -- |
| AIConfig | 适配器注册与策略 | adapters、mode、retry、timeout |
| ResponseSchema | 响应字段声明与透传 | text、delta、meta |
| UIBehaviorConfig | 预览高亮与交互文案 | highlightTokens、ctaText、shortcuts |

## 数据流
1. 选区封装为 SelectionPayload，交给 AIOrchestrator
2. 调用者选择流式或非流式 → Orchestrator 调用对应 Adapter
3. Adapter 产出标准事件：start → chunk（流式）→ done / error
4. 预览层渲染响应，不写正文；完成后进入可接受 / 拒绝态

## 接受 / 拒绝
- 接受：从预览层一次性写入正文，形成可撤销操作；避免 chunk 污染撤销栈
- 拒绝：移除预览与高亮，若已写入正文则执行一次 undo
- 建议默认使用预览装订层方案，减少 undo/redo 干扰

## 高亮策略
- 处理中：蓝紫系进度高亮或波纹
- 预览待决策：琥珀或青绿描边/底纹（特殊高亮，直到接受或拒绝）
- 已拒绝：淡灰消退
- 错误：红色提示

## 事件与回调（建议）
- onSelection：将选区传给外部调用者
- onPreviewUpdate：流式 chunk 或非流式完成后推送预览
- onReadyForDecision：预览完成，显示接受 / 拒绝
- onAccept / onReject：提交或丢弃预览
- onError / onCancel：错误或取消

## 最小接口（示意）
- initAI(config: AIConfig)
- sendSelection(payload: SelectionPayload, mode: stream | batch)
- acceptPreview() / rejectPreview() / cancelRunning()
- on(event, handler)：覆盖 start / chunk / done / error / readyForDecision / accept / reject / cancel，继承 [](./src/Eventbus.ts) 实现

## 兼容与扩展
- 适配器可扩展：检索增强、工具调用等保持同一事件模型
- UI 行为可配置：按钮、快捷键、悬浮工具条、ghost text 等均走 UIBehaviorConfig
- 向后兼容：未知响应字段透传 meta，避免强绑定供应商字段
