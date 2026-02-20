import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a35',
            color: '#e8e8f5',
            border: '1px solid #2a2a4a',
            borderRadius: '10px',
            fontSize: '14px'
          },
          success: { iconTheme: { primary: '#10d48e', secondary: '#1a1a35' } },
          error: { iconTheme: { primary: '#e94560', secondary: '#1a1a35' } }
        }}
      />
      <App />
    </AuthProvider>
  </React.StrictMode>
)
