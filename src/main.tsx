import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PlannerShell from './PlannerShell.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlannerShell />
  </StrictMode>,
)
