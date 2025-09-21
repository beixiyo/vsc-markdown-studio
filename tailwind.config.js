// @ts-check
import * as Variable from './packages/md/src/styles/variable'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [],
  theme: {
    extend: {
      /** 颜色 */
      colors: {
        lightBg: Variable.lightBg,
        innerBg: Variable.innerBg,
        primary: Variable.primaryColor,
        border: Variable.borderColor,
        light: Variable.lightTextColor,

        success: Variable.successColor,
        info: Variable.infoColor,
        danger: Variable.dangerColor,
      },

      /** 动画 */
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-3px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(4px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-6px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(6px, 0, 0)' },
        },
      },
      animation: {
        shake: 'shake .4s cubic-bezier(0.28, -0.44, 0.65, 1.55) 2 both',
      },
    },
  },
  plugins: [
    /** 自定义工具类 */
    function ({ addUtilities, addComponents, theme }) {
      /** 隐藏滚动条 */
      addUtilities({
        '.hide-scroll': {
          /* Firefox */
          'scrollbar-width': 'none',
          /* IE & Edge */
          '-ms-overflow-style': 'none',
          /* Safari & Chrome */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      })

      /** 居中工具 */
      addComponents({
        '.center-x': {
          left: '50%',
          transform: 'translateX(-50%)',
        },
        '.center-y': {
          top: '50%',
          transform: 'translateY(-50%)',
        },
        '.center': {
          '@apply center-x center-y': {},
        },
      })

      /** 调色快捷类 (text + bg) */
      const toning = [
        'green',
        'blue',
        'purple',
        'orange',
        'red',
        'yellow',
        'gray',
        'slate',
      ]
      toning.forEach((color) => {
        const text = Variable[`${color}TextColor`]
        const darkText = Variable[`${color}DarkTextColor`]
        const bg = Variable[`${color}BgColor`]
        const darkBg = Variable[`${color}DarkBgColor`]
        const border = Variable[`${color}BorderColor`]
        const darkBorder = Variable[`${color}DarkBorderColor`]

        addComponents({
          [`.toning-${color}`]: {
            'color': text,
            'backgroundColor': bg,
            '.dark &': {
              color: darkText,
              backgroundColor: darkBg,
            },
          },
          [`.toning-${color}-text`]: {
            'color': text,
            '.dark &': {
              color: darkText,
            },
          },
          [`.toning-${color}-border`]: {
            'borderColor': border,
            '.dark &': {
              borderColor: darkBorder,
            },
          },
        })
      })
    },
  ],
}
