import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('[ERROR]', err.message);
  console.error(err.stack);

  // Multer-specific errors (file too large, too many files, etc.)
  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'Image is too large. Maximum size is 20 MB.',
      LIMIT_FILE_COUNT: 'Too many images. Maximum is 3.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
    };
    res.status(400).json({ message: messages[err.code] ?? err.message });
    return;
  }

  // Cloudinary / any other upstream error
  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({ message: err.message || 'Server error' });
};
