import type { SpeakerAttributes } from 'tiptap-nodes/speaker'
import type { SpeakerType } from './types/Speaker'

/** Native → Tiptap：数字字段转成字符串 key 的 speakerMap */
export function speakersToMap(speakers: SpeakerType[]): Record<string, { name: string, id?: string, label?: string }> {
  const map: Record<string, { name: string, id?: string, label?: string }> = {}
  for (const s of speakers) {
    if (s == null || s.originalLabel == null)
      continue
    map[String(s.originalLabel)] = {
      name: s.name ?? '',
      id: s.id != null
        ? String(s.id)
        : undefined,
      label: s.label != null
        ? String(s.label)
        : undefined,
    }
  }
  return map
}

/** Tiptap → Native：字符串属性还原为数字的 SpeakerTappedPayload */
export function speakerAttrsToNativePayload(attrs: SpeakerAttributes) {
  const toNum = (v: unknown): number => {
    const n = typeof v === 'number'
      ? v
      : Number(v)
    return Number.isFinite(n)
      ? n
      : 0
  }
  const name = attrs.name ?? ''
  return {
    label: toNum(attrs.label),
    originalLabel: toNum(attrs.originalLabel),
    id: attrs.id != null
      ? toNum(attrs.id)
      : undefined,
    name,
    speakerName: `@${name}`,
  }
}
