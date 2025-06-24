import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
    throw new Error('Root element not found')
}

const isDevelopment = import.meta.env.DEV;

ReactDOM.createRoot(rootElement).render(
    isDevelopment ? (
        // En développement : sans StrictMode pour éviter les double-mounts
        <App />
    ) : (
        // En production : avec StrictMode pour les bonnes pratiques
        <React.StrictMode>
            <App />
        </React.StrictMode>
    )
)