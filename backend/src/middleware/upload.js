import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from '../config/env.js';

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  }
});

const allowedMimeTypes = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  pdf: ['application/pdf'],
  audio: ['audio/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'],
  document: ['text/plain', 'text/markdown', 'application/json']
};

function fileFilter(req, file, cb) {
  const mime = file.mimetype;
  let detectedType = null;

  for (const [type, mimes] of Object.entries(allowedMimeTypes)) {
    if (mimes.includes(mime)) {
      detectedType = type;
      break;
    }
  }

  // Also support audio recorded via browser MediaRecorder which can have 'audio/webm;codecs=opus'
  if (mime.startsWith('audio/')) {
    detectedType = 'audio';
  } else if (mime.startsWith('image/')) {
    detectedType = 'image';
  }

  if (detectedType) {
    file.detectedType = detectedType;
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${mime}. Allowed: Images, PDFs, Audio, and Text.`), false);
  }
}

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024
  },
  fileFilter
});
