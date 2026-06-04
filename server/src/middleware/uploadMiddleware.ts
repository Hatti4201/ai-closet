import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ai-closet/clothing',
    // Accept all common image formats including iPhone HEIC
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp', 'tiff'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }],
  } as object,
});

export const upload = multer({
  storage,
  limits: { files: 3, fileSize: 20 * 1024 * 1024 }, // 20 MB per file
});
