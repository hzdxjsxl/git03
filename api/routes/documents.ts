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

function validateTextQuality(text: string): { valid: boolean; message?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, message: '未能从文件中提取到文本内容' };
  }
  const totalChars = text.length;
  const printableChars = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffefA-Za-z0-9\s\n\r\t.,;:!?()（）【】《》、，。；：？！—…·\-\/\\'""]/g)?.length || 0;
  const printableRatio = printableChars / totalChars;
  if (printableRatio < 0.6) {
    return { valid: false, message: '提取的文本乱码比例过高，可能是文件格式不支持。建议将老式.doc格式另存为.docx后重试。' };
  }
  return { valid: true };
}

function cleanExtractedText(text: string): string {
  let cleaned = text
    .replace(/\u0000/g, '')
    .replace(/\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u0008/g, '')
    .replace(/\u000b|\u000c|\u000e|\u000f/g, '')
    .replace(/\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017/g, '')
    .replace(/\u0018|\u0019|\u001a|\u001b|\u001c|\u001d|\u001e|\u001f/g, '')
    .replace(/\u007f/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t\u00a0]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned;
}

async function extractTextFromPdf(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  const text = data.text || '';
  return cleanExtractedText(text);
}

async function extractTextFromWord(filePath: string, ext: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);

  if (ext === '.doc') {
    throw new Error('检测到老式 .doc 格式文档（Word 97-2003），当前解析器不支持此二进制格式。请将文档在 Word 中另存为 .docx 格式后重新上传。');
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    const text = result.value || '';
    return cleanExtractedText(text);
  }

  throw new Error('不支持的Word文档格式');
}

function detectEncoding(buffer: Buffer): 'utf8' | 'gbk' | 'gb2312' {
  const utf8Bom = buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
  if (utf8Bom) return 'utf8';

  let hasHighBytes = false;
  for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
    if (buffer[i] > 0x7F) {
      hasHighBytes = true;
      break;
    }
  }
  if (!hasHighBytes) return 'utf8';

  return 'utf8';
}

function extractTextFromTxt(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  const encoding = detectEncoding(buffer);
  let text = buffer.toString(encoding === 'utf8' ? 'utf8' : 'utf8');

  if (encoding === 'utf8') {
    const quality = validateTextQuality(text);
    if (!quality.valid) {
      const tryDecode = buffer.toString('latin1');
      const cleaned = cleanExtractedText(tryDecode);
      const quality2 = validateTextQuality(cleaned);
      if (quality2.valid) {
        return cleaned;
      }
    }
  }

  return cleanExtractedText(text);
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
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return;
    }

    const qualityCheck = validateTextQuality(text);
    if (!qualityCheck.valid) {
      res.status(400).json({ success: false, error: qualityCheck.message });
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return;
    }

    const trimmed = text.trim();
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        text: trimmed,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        charCount: trimmed.length,
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
