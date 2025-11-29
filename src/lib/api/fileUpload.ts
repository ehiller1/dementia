/**
 * File Upload API for Excel/CSV data sources
 * Handles file upload, processing, and integration with agent orchestration
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const conversationId = req.body.conversationId || 'default';
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${conversationId}_${timestamp}_${name}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Store uploaded file metadata for agent access
const uploadedFiles = new Map();

/**
 * Process uploaded file and extract metadata
 */
async function processUploadedFile(filePath, originalName, conversationId) {
  try {
    const ext = path.extname(originalName).toLowerCase();
    let rowCount = 0;
    let preview = '';
    
    if (ext === '.csv') {
      // For CSV files, count rows and get preview
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      rowCount = Math.max(0, lines.length - 1); // Subtract header row
      
      // Create preview from first few lines
      const previewLines = lines.slice(0, 3);
      preview = `${rowCount} rows detected. Headers: ${previewLines[0]?.split(',').slice(0, 3).join(', ')}...`;
    } else {
      // For Excel files, we'll need to use a library like xlsx to read
      // For now, just estimate based on file size
      const stats = fs.statSync(filePath);
      rowCount = Math.floor(stats.size / 100); // Rough estimate
      preview = `Excel file processed. Estimated ${rowCount} rows.`;
    }
    
    const fileMetadata = {
      originalName,
      filePath,
      conversationId,
      fileType: ext === '.csv' ? 'csv' : 'excel',
      rowCount,
      preview,
      uploadedAt: new Date().toISOString(),
      size: fs.statSync(filePath).size
    };
    
    // Store metadata for agent access
    uploadedFiles.set(conversationId, fileMetadata);
    
    return fileMetadata;
  } catch (error) {
    console.error('Error processing uploaded file:', error);
    throw error;
  }
}

/**
 * Get uploaded file metadata for a conversation
 */
export function getUploadedFileForConversation(conversationId) {
  return uploadedFiles.get(conversationId) || null;
}

/**
 * Express middleware for file upload
 */
export const uploadMiddleware = upload.single('file');

/**
 * Handle file upload request
 */
export async function handleFileUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const conversationId = req.body.conversationId || 'default';
    const fileMetadata = await processUploadedFile(
      req.file.path,
      req.file.originalname,
      conversationId
    );
    
    console.log(`📁 File uploaded for conversation ${conversationId}:`, fileMetadata.originalName);
    
    res.json({
      success: true,
      filePath: req.file.path,
      fileName: req.file.originalname,
      conversationId,
      rowCount: fileMetadata.rowCount,
      preview: fileMetadata.preview,
      fileType: fileMetadata.fileType
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'File upload failed',
      message: error.message 
    });
  }
}

/**
 * Clean up old uploaded files (optional cleanup function)
 */
export function cleanupOldFiles(maxAgeHours = 24) {
  const uploadDir = path.join(__dirname, '../../../uploads');
  if (!fs.existsSync(uploadDir)) return;
  
  const files = fs.readdirSync(uploadDir);
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000;
  
  files.forEach(file => {
    const filePath = path.join(uploadDir, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtime.getTime() > maxAge) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleaned up old file: ${file}`);
    }
  });
}
