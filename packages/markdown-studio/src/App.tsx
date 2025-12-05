import { YDocProvider } from '@y-sweet/react'
import { useTheme } from 'hooks'
import { Document } from './components/Editor'

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
