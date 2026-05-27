
import './App.css'
import MetroMapStage from './components/Stage'
import { I18nProvider } from './i18n'

function App() {

  return (
    <I18nProvider>
      <div>
        <MetroMapStage />
      </div>
    </I18nProvider>
  )
}

export default App
