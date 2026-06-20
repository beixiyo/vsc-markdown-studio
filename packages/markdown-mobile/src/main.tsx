import ReactDOM from 'react-dom/client'
import { LANGUAGES, TiptapI18nProvider } from 'tiptap-api/react'
import App from './App'
import './styles/index.scss'
import './tailwind.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <TiptapI18nProvider
    defaultLanguage={ LANGUAGES.ZH_CN }
    persistence={ { enabled: true, key: 'markdown-mobile-tiptap-language' } }
  >
    <App />
  </TiptapI18nProvider>,
)
