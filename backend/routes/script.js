const express = require('express');
const router = express.Router();
const scriptParser = require('../services/scriptParser');

router.post('/parse', async (req, res, next) => {
  try {
    const { content, format = 'auto' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: '剧本文本 content 不能为空' }
      });
    }

    const result = await scriptParser.parseScript(content, format);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

router.post('/to-panels', async (req, res, next) => {
  try {
    const { parsedScript, layoutPreference = 'balanced' } = req.body;

    if (!parsedScript) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: 'parsedScript 不能为空' }
      });
    }

    const panels = await scriptParser.convertToPanels(parsedScript, layoutPreference);

    res.json({
      success: true,
      data: {
        panels,
        layout: layoutPreference,
        total: panels.length
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
