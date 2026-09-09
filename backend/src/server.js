import 'dotenv/config'
import { createApp } from './app.js'

const app = createApp()
const PORT = process.env.PORT || 5175

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`)
})