const { writeStyle } = require('@jl-org/js-to-style')

writeStyle({
  jsPath: './src/styles/variable.ts',
  cssPath: './src/styles/css/autoVariables.css',
  scssPath: './src/styles/scss/autoVariables.scss',
})
