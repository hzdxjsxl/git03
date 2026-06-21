const express = require('express');
const router = express.Router();
const libraryService = require('../services/libraryService');

router.get('/templates', async (req, res, next) => {
  try {
    const { category, sceneType, keyword, limit, offset } = req.query;
    
    const result = await libraryService.getTemplates({
      category,
      sceneType,
      keyword,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

router.get('/template/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await libraryService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: '模板不存在' }
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (err) {
    next(err);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await libraryService.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    next(err);
  }
});

router.get('/scenes', async (req, res, next) => {
  try {
    const sceneTypes = await libraryService.getSceneTypes();
    res.json({
      success: true,
      data: sceneTypes
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
