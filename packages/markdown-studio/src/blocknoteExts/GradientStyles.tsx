import { createReactStyleSpec } from '@blocknote/react'

/**
 * 神秘紫蓝渐变样式
 */
export const MysticPurpleBlueGradient = createReactStyleSpec(
  {
    type: 'mysticPurpleBlue',
    propSchema: 'boolean',
  },
  {
    render: props => (
      <span
        className="gradient-mystic-purple-blue"
        ref={ props.contentRef }
      />
    ),
  },
)

/**
 * 天空蓝渐变样式
 */
export const SkyBlueGradient = createReactStyleSpec(
  {
    type: 'skyBlue',
    propSchema: 'boolean',
  },
  {
    render: props => (
      <span
        className="gradient-sky-blue"
        ref={ props.contentRef }
      />
    ),
  },
)

/**
 * 瑰丽紫红渐变样式
 */
export const GorgeousPurpleRedGradient = createReactStyleSpec(
  {
    type: 'gorgeousPurpleRed',
    propSchema: 'boolean',
  },
  {
    render: props => (
      <span
        className="gradient-gorgeous-purple-red"
        ref={ props.contentRef }
      />
    ),
  },
)

/**
 * 温暖阳光渐变样式
 */
export const WarmSunshineGradient = createReactStyleSpec(
  {
    type: 'warmSunshine',
    propSchema: 'boolean',
  },
  {
    render: props => (
      <span
        className="gradient-warm-sunshine"
        ref={ props.contentRef }
      />
    ),
  },
)

/**
 * 自然绿意渐变样式
 */
export const NaturalGreenGradient = createReactStyleSpec(
  {
    type: 'naturalGreen',
    propSchema: 'boolean',
  },
  {
    render: props => (
      <span
        className="gradient-natural-green"
        ref={ props.contentRef }
      />
    ),
  },
)

/**
 * 神秘暗夜渐变样式
 */
export const MysticNightGradient = createReactStyleSpec(
  {
    type: 'mysticNight',
    propSchema: 'boolean',
  },
  {
    render: props => (
      <span
        className="gradient-mystic-night"
        ref={ props.contentRef }
      />
    ),
  },
)

/**
 * 多彩糖果渐变样式
 */
export const ColorfulCandyGradient = createReactStyleSpec(
  {
    type: 'colorfulCandy',
    propSchema: 'boolean',
  },
  {
    render: props => (
      <span
        className="gradient-colorful-candy"
        ref={ props.contentRef }
      />
    ),
  },
)

/**
 * 星空夜幕渐变样式
 */
export const StarryNightGradient = createReactStyleSpec(
  {
    type: 'starryNight',
    propSchema: 'boolean',
  },
  {
    render: props => (
      <span
        className="gradient-starry-night"
        ref={ props.contentRef }
      />
    ),
  },
)

/**
 * 金属质感渐变样式
 */
export const MetallicGradient = createReactStyleSpec(
  {
    type: 'metallic',
    propSchema: 'boolean',
  },
  {
    render: props => (
      <span
        className="gradient-metallic"
        ref={ props.contentRef }
      />
    ),
  },
)

/**
 * 雪山冰川渐变样式
 */
export const SnowyGlacierGradient = createReactStyleSpec(
  {
    type: 'snowyGlacier',
    propSchema: 'boolean',
  },
  {
    render: props => (
      <span
        className="gradient-snowy-glacier"
        ref={ props.contentRef }
      />
    ),
  },
)

/**
 * 热带夏日渐变样式
 */
export const TropicalSummerGradient = createReactStyleSpec(
  {
    type: 'tropicalSummer',
    propSchema: 'boolean',
  },
  {
    render: props => (
      <span
        className="gradient-tropical-summer"
        ref={ props.contentRef }
      />
    ),
  },
)
