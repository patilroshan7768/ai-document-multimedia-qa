import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './hooks/useToast'
import Navbar from './components/Navbar'
import Home from './pages/Home'

/**
 * App root — wraps the app in the toast provider and router.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Catch-all → Home */}
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </ToastProvider>
    </BrowserRouter>
  )
}
