/**
 * 风险规则API路由
 * 提供规则查询、分类获取等接口
 */
import { Router, type Request, type Response } from 'express'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

interface Rule {
  id: string
  name: string
  category: string
  level: 'high' | 'medium' | 'low' | 'info'
  description: string
  patterns: string[]
  suggestion: string
  regulation: string
}

interface RulesData {
  rules: Rule[]
}

let rulesData: RulesData | null = null

const loadRulesData = async (): Promise<RulesData> => {
  if (rulesData) {
    return rulesData
  }
  const dataPath = path.join(__dirname, '..', 'data', 'rules.json')
  const rawData = await readFile(dataPath, 'utf-8')
  rulesData = JSON.parse(rawData) as RulesData
  return rulesData
}

/**
 * 获取所有规则，支持按分类和风险级别过滤
 * GET /api/rules?category=xxx&level=xxx
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, level } = req.query

    const data = await loadRulesData()
    let filteredRules = [...data.rules]

    if (category && typeof category === 'string') {
      filteredRules = filteredRules.filter(rule => rule.category === category)
    }

    if (level && typeof level === 'string') {
      filteredRules = filteredRules.filter(rule => rule.level === level)
    }

    res.status(200).json({
      success: true,
      data: filteredRules,
      total: filteredRules.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '加载规则数据失败',
    })
  }
})

/**
 * 获取所有分类列表
 * GET /api/rules/categories
 */
router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await loadRulesData()
    const categories = [...new Set(data.rules.map(rule => rule.category))]

    res.status(200).json({
      success: true,
      data: categories,
      total: categories.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '加载分类数据失败',
    })
  }
})

/**
 * 获取单条规则详情
 * GET /api/rules/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const data = await loadRulesData()

    const rule = data.rules.find(r => r.id === id)

    if (!rule) {
      res.status(404).json({
        success: false,
        error: '规则不存在',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: rule,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '加载规则详情失败',
    })
  }
})

export default router
