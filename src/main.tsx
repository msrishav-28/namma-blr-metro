import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <App />
  // </StrictMode>,
)

requestAnimationFrame(() => {
  document.querySelectorAll('[data-seo-prerender-outside-root]').forEach((element) => {
    element.setAttribute('hidden', '')
  })
})

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
