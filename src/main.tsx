import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Inside the Android app the files are already local: no service worker there,
// it would only add a cache layer between the app and its own assets.
const isNative = Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor)

if ('serviceWorker' in navigator && import.meta.env.PROD && !isNative) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* offline mode not available */
    })
  })
}
