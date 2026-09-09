import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import meRouter from './routes/me.js'
import checklistsRouter from './routes/checklists.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '10mb' }))

  // Simple request log
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`)
    next()
  })

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ts: Date.now() })
  })

  // Routes
  app.use('/api', meRouter)
  app.use('/api/checklists', checklistsRouter)

  // 404 fallback
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  // Error handler
  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  })

  return app
}