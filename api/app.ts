import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { generateArticles } from './data/articles.js'
import { createSearchIndex, InvertedIndex } from './data/invertedIndex.js'
import recommendRoutes from './routes/recommend.js'
import articlesRoutes from './routes/articles.js'
import type { ArticleContent } from '../shared/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const articlesData = generateArticles(500)
export const searchIndex: InvertedIndex = createSearchIndex(articlesData.map(a => a.meta))
export const articleContents: Map<string, ArticleContent> = new Map(
  articlesData.map(a => [a.content.id, a.content])
)

console.log(`[Server] Indexed ${searchIndex.size()} articles`)

app.use('/api/recommend', recommendRoutes)
app.use('/api/articles', articlesRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      articlesCount: searchIndex.size(),
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
