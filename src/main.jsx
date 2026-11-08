import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Auth from './Auth.jsx'
import Planning from './Planning.jsx'
import Admin from './Admin.jsx'
import Links from './Links.jsx'
import TestModeBar from './components/TestModeBar.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <TestModeBar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/autenticacao" element={<Auth />} />
        <Route path="/planejamento" element={<Planning />} />
        <Route path="/links" element={<Links />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
