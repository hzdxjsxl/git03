import express, { type Request, type Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __require = createRequire(import.meta.url);
const pdfParse = __require('pdf-parse');
const mammoth = __require('mammoth');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，仅支持 .txt, .pdf, .doc, .docx'));
    }
  },
});

async function extractTextFromPdf(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text || '';
}

async function extractTextFromWord(filePath: string, ext: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return result.value || '';
  } else {
    return dataBuffer.toString('utf8');
  }
}

function extractTextFromTxt(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

router.post('/parse', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: '未找到上传的文件' });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let text = '';

    switch (ext) {
      case '.pdf':
        text = await extractTextFromPdf(req.file.path);
        break;
      case '.doc':
      case '.docx':
        text = await extractTextFromWord(req.file.path, ext);
        break;
      case '.txt':
        text = extractTextFromTxt(req.file.path);
        break;
      default:
        res.status(400).json({ success: false, error: '不支持的文件格式' });
        return;
    }

    if (!text || text.trim().length === 0) {
      res.status(400).json({ success: false, error: '未能从文件中提取到文本内容' });
      return;
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        text: text.trim(),
        fileName: req.file.originalname,
        fileSize: req.file.size,
        charCount: text.trim().length,
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('File parse error:', error);
    res.status(500).json({ success: false, error: '文件解析失败: ' + (error as Error).message });
  }
});

router.get('/template', (req: Request, res: Response) => {
  const templatePath = path.join(__dirname, '../data/contract-template.txt');
  if (fs.existsSync(templatePath)) {
    const text = fs.readFileSync(templatePath, 'utf8');
    res.json({ success: true, data: { text: text.trim(), name: '标准买卖合同模板' } });
  } else {
    res.status(404).json({ success: false, error: '模板文件不存在' });
  }
});

export default router;
