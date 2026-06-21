const express = require('express');
const router = express.Router();
const imageGenerator = require('../services/imageGenerator');

router.post('/panel', async (req, res, next) => {
  try {
    const { prompt, sceneType = 'default', style = 'manga', size = 'standard' } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '提示词 prompt 不能为空' }
      });
    }

    const result = await imageGenerator.generatePanel({
      prompt,
      sceneType,
      style,
      size
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

router.post('/batch', async (req, res, next) => {
  try {
    const { panels, style = 'manga' } = req.body;

    if (!Array.isArray(panels) || panels.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'panels 必须为非空数组' }
      });
    }

    const results = await imageGenerator.generateBatch(panels, style);

    res.json({
      success: true,
      data: {
        panels: results,
        total: results.length
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
