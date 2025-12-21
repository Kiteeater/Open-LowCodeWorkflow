import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { workerClient } from './utils/worker-client'

// 测试 Worker 通信
workerClient.testConnection('Main Thread');


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
