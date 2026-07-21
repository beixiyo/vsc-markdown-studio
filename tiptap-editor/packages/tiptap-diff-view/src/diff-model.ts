import { diffChars, diffLines } from 'diff'

/** 从两份 Markdown 文本生成可直接渲染的行级 Diff 模型 */
export function createDiffRows(before: string, after: string): DiffRow[] {
  const changes = diffLines(before, after)
  const rows: DiffRow[] = []
  let oldLineNumber = 1
  let newLineNumber = 1
  let changeIndex = 0

  for (let index = 0; index < changes.length;) {
    const change = changes[index]

    if (!change.added && !change.removed) {
      for (const text of splitLines(change.value)) {
        rows.push({
          key: `normal-${oldLineNumber}-${newLineNumber}`,
          oldLine: createLine(oldLineNumber++, text, 'normal'),
          newLine: createLine(newLineNumber++, text, 'normal'),
        })
      }
      index++
      continue
    }

    const deletedLines: string[] = []
    const insertedLines: string[] = []

    while (index < changes.length && (changes[index].added || changes[index].removed)) {
      const current = changes[index]
      const target = current.removed
        ? deletedLines
        : insertedLines

      target.push(...splitLines(current.value))
      index++
    }

    const blockLength = Math.max(deletedLines.length, insertedLines.length)
    for (let offset = 0; offset < blockLength; offset++) {
      const oldText = deletedLines[offset]
      const newText = insertedLines[offset]
      const key = `change-${changeIndex}-${offset}`
      const segments = oldText !== undefined && newText !== undefined
        ? createChangedSegments(oldText, newText)
        : undefined

      rows.push({
        key,
        oldLine: oldText === undefined
          ? undefined
          : createLine(oldLineNumber++, oldText, 'delete', segments?.old),
        newLine: newText === undefined
          ? undefined
          : createLine(newLineNumber++, newText, 'insert', segments?.new),
      })
    }
    changeIndex++
  }

  return rows
}

/** 为 overview ruler 提取所有真实的新增和删除位置 */
export function createDiffMarkers(rows: DiffRow[]): DiffMarker[] {
  return rows.flatMap((row, rowIndex) => {
    const markers: DiffMarker[] = []

    if (row.oldLine?.type === 'delete') {
      markers.push({
        key: `${row.key}-delete`,
        rowKey: row.key,
        rowIndex,
        lineNumber: row.oldLine.lineNumber,
        type: 'delete',
      })
    }

    if (row.newLine?.type === 'insert') {
      markers.push({
        key: `${row.key}-insert`,
        rowKey: row.key,
        rowIndex,
        lineNumber: row.newLine.lineNumber,
        type: 'insert',
      })
    }

    return markers
  })
}

function createChangedSegments(oldText: string, newText: string) {
  const changes = diffChars(oldText, newText)
  let oldOffset = 0
  let newOffset = 0

  return {
    old: changes
      .filter(change => !change.added)
      .map((change) => {
        const segment = {
          key: `old-${oldOffset}-${change.removed
            ? 'changed'
            : 'same'}`,
          text: change.value,
          changed: Boolean(change.removed),
        }
        oldOffset += change.value.length
        return segment
      }),
    new: changes
      .filter(change => !change.removed)
      .map((change) => {
        const segment = {
          key: `new-${newOffset}-${change.added
            ? 'changed'
            : 'same'}`,
          text: change.value,
          changed: Boolean(change.added),
        }
        newOffset += change.value.length
        return segment
      }),
  }
}

function createLine(
  lineNumber: number,
  text: string,
  type: DiffLineType,
  segments?: DiffSegment[],
): DiffLine {
  return { lineNumber, text, type, segments }
}

function splitLines(value: string) {
  const lines = value.split('\n')
  if (lines.at(-1) === '')
    lines.pop()

  return lines
}

/** 单行 Diff 数据 */
export type DiffLine = {
  lineNumber: number
  text: string
  type: DiffLineType
  segments?: DiffSegment[]
}

/** 双栏中同一视觉行的数据 */
export type DiffRow = {
  key: string
  oldLine?: DiffLine
  newLine?: DiffLine
}

/** overview ruler 的变更标记 */
export type DiffMarker = {
  key: string
  rowKey: string
  rowIndex: number
  lineNumber: number
  type: Extract<DiffLineType, 'insert' | 'delete'>
}

export type DiffSegment = {
  key: string
  text: string
  changed: boolean
}

export type DiffLineType = 'normal' | 'insert' | 'delete'
