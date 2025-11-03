import { YDocProvider } from '@y-sweet/react'
import { useTheme } from 'hooks'
import { Document } from './components/Editor'
/**
 * @link https://www.blocknotejs.org/docs/features/custom-schemas/custom-blocks
 */
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import 'custom-blocknote-gradient-styles/index.css'
import 'styles/index.css'

export default function App() {
  useTheme()

  return (
    <YDocProvider
      docId="markdown-studio"
      authEndpoint="https://demos.y-sweet.dev/api/auth"
    >
      <Document />
    </YDocProvider>
  )
}
