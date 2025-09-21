import { BlockNoteSchema, defaultBlockSpecs, defaultStyleSpecs, filterSuggestionItems } from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import {
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  GridSuggestionMenuController,
  SuggestionMenuController,
  useCreateBlockNote,
} from '@blocknote/react'
import { useTheme } from 'hooks'
import { useRef } from 'react'
import {
  ColorfulCandyGradient,
  GorgeousPurpleRedGradient,
  MetallicGradient,
  MysticNightGradient,
  MysticPurpleBlueGradient,
  NaturalGreenGradient,
  SkyBlueGradient,
  SnowyGlacierGradient,
  StarryNightGradient,
  TropicalSummerGradient,
  WarmSunshineGradient,
} from './blocknoteExts/GradientStyles'
import { LabelInputBlock, labelInputMenuItem } from './blocknoteExts/labelInput'
import { MermaidBlock, mermaidMenuItem } from './blocknoteExts/mermaid'
import { CustomFormatToolbar } from './components/CustomFormatToolbar'
import { useNotify } from './hooks/useNotify'
import { useSetupMDBridge } from './hooks/useSetupMDBridge'
import { useVSCode } from './hooks/useVSCode'
import { TestPanel } from './test/TestPanel'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

export default function App() {
  useTheme()

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      mermaid: MermaidBlock,
      labelInput: LabelInputBlock,
    },
    styleSpecs: {
      ...defaultStyleSpecs,
      mysticPurpleBlue: MysticPurpleBlueGradient,
      skyBlue: SkyBlueGradient,
      gorgeousPurpleRed: GorgeousPurpleRedGradient,
      warmSunshine: WarmSunshineGradient,
      naturalGreen: NaturalGreenGradient,
      mysticNight: MysticNightGradient,
      colorfulCandy: ColorfulCandyGradient,
      starryNight: StarryNightGradient,
      metallic: MetallicGradient,
      snowyGlacier: SnowyGlacierGradient,
      tropicalSummer: TropicalSummerGradient,
    },
  })

  const editor = useCreateBlockNote({
    schema,
    initialContent: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '这是神秘紫蓝渐变色文字',
            styles: { mysticPurpleBlue: true },
          },
        ],
      },
      {
        type: 'labelInput',
        props: {
          label: '张三',
        },
        content: [
          {
            type: 'text',
            text: '大家好，今天我们来讨论一下项目的进展。',
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
            text: '好的，我这边前端部分已经完成了 80%。',
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

  return <div
    className="w-full bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50"
    ref={ editorElRef }
  >
    <BlockNoteView
      className="!rounded-none"
      editor={ editor }
      emojiPicker={ false }
      slashMenu={ false }
      formattingToolbar={ false }
    >
      <FormattingToolbarController
        formattingToolbar={ CustomFormatToolbar }
      />

      <SuggestionMenuController
        triggerCharacter="/"
        getItems={ async (query: string) => {
          const items = [
            ...getDefaultReactSlashMenuItems(editor),
            mermaidMenuItem(),
            labelInputMenuItem(),
          ] as any[]
          return filterSuggestionItems(items, query)
        } }
      />

      <GridSuggestionMenuController
        triggerCharacter=":"
        columns={ 5 }
        minQueryLength={ 2 }
      />
    </BlockNoteView>
    <TestPanel />
  </div>
}
