import fs from 'fs';
import path from 'path';
import cloudinary from '../config/cloudinary';

// New uploads go straight to Cloudinary; file.path is the secure URL.
// Legacy uploads stored as /uploads/filename or http://localhost:PORT/uploads/filename
// are still served by Express static middleware for backward compatibility.

export const buildImageUrl = (filename: string): string => `/uploads/${filename}`;

export const toAbsoluteUrl = (relativeOrAbsolute: string): string => {
  if (relativeOrAbsolute.startsWith('http')) return relativeOrAbsolute;
  const base = (process.env.API_BASE_URL || 'http://localhost:5001').replace(/\/$/, '');
  return `${base}${relativeOrAbsolute}`;
};

const extractCloudinaryPublicId = (url: string): string | null => {
  const match = url.match(/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  return match ? match[1] : null;
};

export const deleteImageFile = async (imageUrl: string): Promise<void> => {
  if (imageUrl.includes('res.cloudinary.com')) {
    const publicId = extractCloudinaryPublicId(imageUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // best-effort
      }
    }
    return;
  }

  // Legacy local file
  try {
    const filename = imageUrl.split('/uploads/')[1];
    if (!filename) return;
    const filePath = path.join(__dirname, '../../uploads', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // best-effort
  }
};
