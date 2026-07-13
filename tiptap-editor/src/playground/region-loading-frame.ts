import type { RegionLoadingFrameClasses } from 'tiptap-region'

export const REGION_LOADING_FRAME_CLASSES = {
  frame: 'relative z-0 !my-0 py-2 after:pointer-events-none after:absolute after:inset-0 after:-z-1 after:border-x after:border-transparent after:content-[\'\'] after:[background:linear-gradient(rgb(var(--background)),rgb(var(--background)))_padding-box,linear-gradient(105deg,rgb(var(--brand)/0.55),rgb(215_154_255/0.62),rgb(111_141_255/0.45))_border-box]',
  single: '!my-2.5 after:rounded-lg after:border-y',
  first: '!mt-2.5 after:rounded-t-lg after:border-t',
  last: '!mb-2.5 after:rounded-b-lg after:border-b',
  shell: 'box-border flex min-h-8.5 w-auto items-center border border-transparent px-3 pt-2 pb-2.5 [background:linear-gradient(rgb(var(--background)),rgb(var(--background)))_padding-box,linear-gradient(105deg,rgb(var(--brand)/0.55),rgb(215_154_255/0.62),rgb(111_141_255/0.45))_border-box]',
  placeholder: 'my-2.5 min-h-11 rounded-lg',
  tail: 'mt-0 mb-2.5 rounded-b-lg border-t-0',
  dots: 'inline-flex h-2.5 items-center gap-1.25',
  dot: 'size-1 animate-bounce rounded-full bg-text/55 motion-reduce:animate-none',
  dotVariants: ['[animation-delay:0ms]', '[animation-delay:120ms]', '[animation-delay:240ms]'],
} satisfies RegionLoadingFrameClasses
