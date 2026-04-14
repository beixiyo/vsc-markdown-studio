import ReactDOM from 'react-dom/client'
import { LANGUAGES, TiptapI18nProvider } from 'tiptap-api/react'
import App from './App'
import './styles/index.scss'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <TiptapI18nProvider
    defaultLanguage={ LANGUAGES.ZH_CN }
    storage={ { enabled: true, key: 'markdown-mobile-tiptap-language' } }
  >
    <App />
  </TiptapI18nProvider>,
)
