import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

/**
 * Головна точка входу додатку.
 * Рендерить кореневий компонент App у режимі суворої перевірки React.
 *
 * @function
 * @returns {void}
 */
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)