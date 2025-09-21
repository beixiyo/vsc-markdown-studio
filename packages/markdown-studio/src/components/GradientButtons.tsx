import type { GradientStyleType } from '../types/gradient'
import { useBlockNoteEditor, useComponentsContext, useSelectedBlocks } from '@blocknote/react'
import { Palette } from 'lucide-react'
import { memo, useMemo } from 'react'
import { GRADIENT_STYLES } from '../types/gradient'

/**
 * 渐变样式按钮组件
 */
export const GradientStyleButton = memo<{
  styleType: GradientStyleType
  label: string
  className: string
}>(({ styleType, label, className }) => {
  const editor = useBlockNoteEditor()
  const Components = useComponentsContext()!
  const selectedBlocks = useSelectedBlocks(editor)

  /** 检查是否选中了支持文本样式的块 */
  const shouldShow = useMemo(() => {
    if (selectedBlocks.length === 0)
      return false

    /** 检查是否选中了 Mermaid 块 */
    const hasMermaidBlock = selectedBlocks.some(block => (block as any).type === 'mermaid')
    if (hasMermaidBlock)
      return false

    /** 检查是否选中了支持文本样式的块 */
    const supportedTypes = ['paragraph', 'heading', 'bulletListItem', 'numberedListItem', 'checkListItem']
    return selectedBlocks.some(block => supportedTypes.includes(block.type))
  }, [selectedBlocks])

  if (!shouldShow) {
    return null
  }

  return (
    <Components.FormattingToolbar.Button
      label={ label }
      mainTooltip={ label }
      icon={ <Palette size={ 16 } /> }
      onClick={ () => {
        window.MDBridge?.command.setGradientStyle(styleType)
      } }
      className={ className }
    />
  )
})

GradientStyleButton.displayName = 'GradientStyleButton'

/**
 * 根据配置生成渐变按钮组件
 */
function createGradientButton(styleType: GradientStyleType) {
  const config = GRADIENT_STYLES[styleType]

  const ButtonComponent = memo(() => (
    <GradientStyleButton
      styleType={ styleType }
      label={ config.label }
      className={ config.buttonClassName }
    />
  ))

  ButtonComponent.displayName = `${config.label}Button`

  return ButtonComponent
}

/**
 * 神秘紫蓝渐变按钮
 */
export const MysticPurpleBlueButton = createGradientButton('mysticPurpleBlue')

/**
 * 天空蓝渐变按钮
 */
export const SkyBlueButton = createGradientButton('skyBlue')

/**
 * 瑰丽紫红渐变按钮
 */
export const GorgeousPurpleRedButton = createGradientButton('gorgeousPurpleRed')

/**
 * 温暖阳光渐变按钮
 */
export const WarmSunshineButton = createGradientButton('warmSunshine')

/**
 * 自然绿意渐变按钮
 */
export const NaturalGreenButton = createGradientButton('naturalGreen')

/**
 * 神秘暗夜渐变按钮
 */
export const MysticNightButton = createGradientButton('mysticNight')

/**
 * 多彩糖果渐变按钮
 */
export const ColorfulCandyButton = createGradientButton('colorfulCandy')

/**
 * 星空夜幕渐变按钮
 */
export const StarryNightButton = createGradientButton('starryNight')

/**
 * 金属质感渐变按钮
 */
export const MetallicButton = createGradientButton('metallic')

/**
 * 雪山冰川渐变按钮
 */
export const SnowyGlacierButton = createGradientButton('snowyGlacier')

/**
 * 热带夏日渐变按钮
 */
export const TropicalSummerButton = createGradientButton('tropicalSummer')
