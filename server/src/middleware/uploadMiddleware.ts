import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary, { hasCloudinaryConfig } from "../config/cloudinary";

const memoryStorage = multer.memoryStorage();

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ai-closet/clothing",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "heic", "heif", "gif", "bmp", "tiff"],
    transformation: [{ width: 1200, height: 1200, crop: "limit" }, { quality: "auto" }],
  } as object,
});

export const upload = multer({
  storage: hasCloudinaryConfig() ? cloudinaryStorage : memoryStorage,
  limits: { files: 3, fileSize: 20 * 1024 * 1024 },
});
