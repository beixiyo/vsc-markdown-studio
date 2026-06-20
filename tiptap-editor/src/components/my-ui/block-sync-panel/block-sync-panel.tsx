'use client'

import type { Editor } from '@tiptap/react'
import type { BackendBlock, DiffLogEntry, RebuildResult } from './use-block-sync-panel'
import { Button } from 'comps'
import { memo } from 'react'
import { cn } from 'utils'
import { useBlockSyncPanel } from './use-block-sync-panel'

/**
 * 块级 id-diff 同步测试面板
 *
 * 模拟一条真实闭环：首开后端为空 →「同步并迁移」整篇播种 → 编辑产生增量 →
 *「从后端重建」按 id 回灌主编辑器并用 checksum 校验整条往返无损
 * 整体撑满抽屉高度，三个区域各自独立滚动
 */
export const BlockSyncPanel = memo<BlockSyncPanelProps>(({ editor, className }) => {
  const panel = useBlockSyncPanel(editor)

  return (
    <div className={ cn('h-full flex flex-col gap-2', className) }>
      {/* 状态 + 操作（定高） */}
      <div className="shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <PhaseBadge migrated={ panel.migrated } version={ panel.backendVersion } />
          <span className="font-mono text-text2">
            base
            { ' ' }
            { panel.baseVersion }
            { ' ' }
            ｜client
            { ' ' }
            { panel.clientId.slice(0, 10) || '—' }
          </span>
        </div>

        <p className="text-xs text-text2 leading-relaxed">
          { panel.migrated
            ? '在左侧编辑器打字 / 增删段落，下方实时显示按块增量；改完点「从后端重建」回灌验证往返无损。'
            : '后端尚无此文档（模拟旧版仅有 markdown、待升级到块协议）。先点「同步并迁移」整篇播种。' }
        </p>

        {/* 第一行：迁移 / 全量 + 后端控制 */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={ panel.migrated
              ? 'ghost'
              : 'primary' }
            onClick={ panel.migrate }
            disabled={ !panel.ready }
          >
            { panel.migrated
              ? '整篇重推'
              : '同步并迁移到后端' }
          </Button>
          <Button size="sm" variant="ghost" onClick={ panel.flushNow } disabled={ !panel.ready }>立即 flush</Button>
          <Button size="sm" variant="ghost" onClick={ panel.baseline } disabled={ !panel.ready }>设为基线</Button>
          <Button size="sm" variant="ghost" onClick={ panel.simulateDrift } disabled={ !panel.ready }>模拟漂移</Button>
          <Button size="sm" variant="ghost" onClick={ panel.resetBackend } disabled={ !panel.ready }>重置后端</Button>
        </div>

        {/* 第二行：从后端拉取重建 → 回灌主编辑器 + 还原 */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={ panel.rebuildFromBackend } disabled={ !panel.migrated }>从后端重建文档</Button>
          <Button size="sm" variant="ghost" onClick={ panel.restoreSnapshot } disabled={ !panel.canRestore }>还原快照</Button>
          { panel.rebuild && <RebuildBadge result={ panel.rebuild } /> }
        </div>
      </div>

      {/* 增量日志（可滚动，点选查看 payload） */}
      <PanelSection title={ `增量日志（${panel.log.length}，点选查看 payload）` } className="flex-[1.1]">
        { panel.log.length === 0
          ? <Hint>暂无增量。先「同步并迁移」，再到左侧编辑试试。</Hint>
          : (
              <ul className="flex flex-col gap-1.5 p-1.5">
                { panel.log.map(entry => (
                  <DiffLogItem
                    key={ entry.payload.seq }
                    entry={ entry }
                    selected={ entry.payload.seq === panel.selectedSeq }
                    onSelect={ panel.selectEntry }
                  />
                )) }
              </ul>
            ) }
      </PanelSection>

      {/* 发出的完整数据（可滚动） */}
      <PanelSection title="发出的数据（payload JSON）" className="flex-1">
        { panel.selected
          ? (
              <pre className="p-2 text-[11px] leading-relaxed font-mono text-text2 whitespace-pre-wrap break-words">
                { JSON.stringify(panel.selected.payload, null, 2) }
              </pre>
            )
          : <Hint>选中一条增量即可查看其完整 payload。</Hint> }
      </PanelSection>

      {/* mock 后端按 id 存的块（可滚动） */}
      <PanelSection title={ `mock 后端存储（按 id 存完整内容，${panel.backendBlocks.length} 块）` } className="flex-1">
        { panel.backendBlocks.length === 0
          ? <Hint>后端为空。</Hint>
          : (
              <ul className="flex flex-col gap-1 p-1.5">
                { panel.backendBlocks.map(block => (
                  <BackendBlockItem key={ block.id } block={ block } />
                )) }
              </ul>
            ) }
      </PanelSection>
    </div>
  )
})

BlockSyncPanel.displayName = 'BlockSyncPanel'

/** 阶段徽章：后端是否已迁移 */
const PhaseBadge = memo<{ migrated: boolean, version: number }>(({ migrated, version }) => (
  <span className={ cn(
    'px-2 py-0.5 rounded-full font-medium',
    migrated
      ? 'bg-systemGreen/10 text-systemGreen'
      : 'bg-systemOrange/10 text-systemOrange',
  ) }
  >
    { migrated
      ? `已迁移 · 后端 v${version}`
      : '后端无此文档 · 待迁移' }
  </span>
))

PhaseBadge.displayName = 'PhaseBadge'

/** 往返校验徽章：主判据为内容无损，raw checksum 仅作参考 */
const RebuildBadge = memo<{ result: RebuildResult }>(({ result }) => {
  const tone = result.status === 'ok'
    ? 'bg-systemGreen/10 text-systemGreen'
    : result.status === 'mismatch'
      ? 'bg-systemRed/10 text-systemRed'
      : 'bg-systemOrange/10 text-systemOrange'

  const text = result.status === 'ok'
    ? `✓ 内容无损往返 · ${result.blocks} 块`
    : result.status === 'mismatch'
      ? `✗ 第 ${(result.diffIndex ?? 0) + 1} 块（${result.diffType}）内容不一致`
      : '⚠ 重建失败'

  return (
    <>
      <span className={ cn('px-2 py-0.5 rounded-full text-[11px] font-medium', tone) } title={ result.message }>
        { text }
      </span>
      { result.status === 'ok' && !result.checksumMatch && (
        <span className="text-[10px] text-text2/70" title="markdown/html 往返后 image 等节点的临时 id 会重新生成，内容不受影响">
          raw checksum 不同（节点临时 id 重生成 · 内容无损）
        </span>
      ) }
    </>
  )
})

RebuildBadge.displayName = 'RebuildBadge'

/** 区块：标题（定高）+ 独立滚动区 */
const PanelSection = memo<React.PropsWithChildren<{ title: string, className?: string }>>(({ title, className, children }) => (
  <section className={ cn('flex flex-col min-h-0', className) }>
    <h4 className="shrink-0 mb-1 text-xs font-medium text-text2">{ title }</h4>
    <div className="flex-1 min-h-0 overflow-auto rounded-md border border-border bg-background2">
      { children }
    </div>
  </section>
))

PanelSection.displayName = 'PanelSection'

const Hint = memo<React.PropsWithChildren>(({ children }) => (
  <p className="p-2 text-xs text-text2/70">{ children }</p>
))

Hint.displayName = 'Hint'

const BackendBlockItem = memo<{ block: BackendBlock }>(({ block }) => (
  <li className="px-2 py-1.5 rounded-md border border-border bg-background text-xs">
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-text2">{ block.id.slice(0, 12) }</span>
      <span className="text-text2/70">{ block.type }</span>
      <span className={ cn(
        'ml-auto px-1.5 py-0.5 rounded font-mono text-[10px]',
        block.content.format === 'markdown'
          ? 'bg-systemBlue/10 text-systemBlue'
          : 'bg-systemOrange/10 text-systemOrange',
      ) }
      >
        { block.content.format }
      </span>
      { block.lossy && <span className="px-1.5 py-0.5 rounded bg-systemRed/10 text-systemRed font-mono text-[10px]">lossy</span> }
    </div>
    <span className="block truncate text-text">{ blockText(block) || '(空块)' }</span>
  </li>
))

BackendBlockItem.displayName = 'BackendBlockItem'

const DiffLogItem = memo<{
  entry: DiffLogEntry
  selected: boolean
  onSelect: (seq: number) => void
}>(({ entry, selected, onSelect }) => {
      const { payload } = entry
      const saved = entry.fullBytes > 0
        ? Math.max(0, Math.round((1 - entry.bytes / entry.fullBytes) * 100))
        : 0

      return (
        <li>
          <button
            type="button"
            onClick={ () => onSelect(payload.seq) }
            className={ cn(
              'w-full text-left px-2 py-1.5 rounded-md border text-xs flex flex-col gap-1 transition-colors',
              selected
                ? 'border-systemOrange bg-systemOrange/10'
                : 'border-border bg-background hover:bg-background2',
            ) }
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-text2">
                #
                { payload.seq }
                { ' ' }
                base=
                { payload.baseVersion }
              </span>
              <span className={ cn(
                'px-1.5 py-0.5 rounded-full text-[10px]',
                entry.outcome === 'ack'
                  ? 'bg-systemGreen/10 text-systemGreen'
                  : 'bg-systemOrange/10 text-systemOrange',
              ) }
              >
                { entry.outcome }
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              { payload.ops.length === 0
                ? <span className="text-text2/70">仅顺序变化</span>
                : payload.ops.map(op => (
                    <span
                      key={ op.id }
                      className={ cn(
                        'px-1.5 py-0.5 rounded font-mono text-[10px]',
                        op.op === 'upsert'
                          ? 'bg-systemGreen/10 text-systemGreen'
                          : 'bg-systemRed/10 text-systemRed',
                      ) }
                    >
                      { op.op }
                      { ' ' }
                      { op.id.slice(0, 8) }
                      { op.op === 'upsert' && ` ${op.type}` }
                    </span>
                  )) }
            </div>

            <span className="text-text2/70">
              传输
              { ' ' }
              { entry.bytes }
              { ' ' }
              B ／ 全量
              { ' ' }
              { entry.fullBytes }
              { ' ' }
              B
              { entry.fullBytes > 0 && ` ·省 ${saved}%` }
            </span>
          </button>
        </li>
      )
    })

DiffLogItem.displayName = 'DiffLogItem'

/** 后端块内容预览（markdown / html 取字符串，json 取序列化串） */
function blockText(block: BackendBlock): string {
  const { value } = block.content
  return typeof value === 'string'
    ? value
    : JSON.stringify(value)
}

export type BlockSyncPanelProps = {
  /** 编辑器实例 */
  editor: Editor | null
  className?: string
}
