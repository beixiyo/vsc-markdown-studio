const { writeStyle } = require('@jl-org/js-to-style')
const { resolve } = require('path')

writeStyle({
  jsPath: resolve(__dirname, '../packages/styles/variable.ts'),
  cssPath: resolve(__dirname, '../packages/styles/css/autoVariables.css'),
  scssPath: resolve(__dirname, '../packages/styles/scss/autoVariables.scss'),
})
