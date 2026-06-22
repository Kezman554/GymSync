import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import PhoneScreen from './phone/PhoneScreen'
import TvScreen from './tv/TvScreen'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/phone" replace /> },
  { path: '/phone', element: <PhoneScreen /> },
  { path: '/tv', element: <TvScreen /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
