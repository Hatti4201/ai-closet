import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import fs from 'fs';
import mongoose from 'mongoose';
import cloudinary from './config/cloudinary';
import ClothingItem from './models/ClothingItem';

const UPLOADS_DIR = path.join(__dirname, '../uploads');

const isLocalUrl = (url: string) =>
  url.startsWith('/uploads/') || url.includes('localhost');

const localFilename = (url: string): string =>
  url.split('/uploads/')[1];

(async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to MongoDB\n');

  const items = await ClothingItem.find({});
  let totalUploaded = 0;
  let totalSkipped = 0;

  for (const item of items) {
    let changed = false;
    const newImages: { url: string; isMain: boolean }[] = [];

    for (const img of item.images) {
      if (!isLocalUrl(img.url)) {
        // Already a Cloudinary URL — skip
        newImages.push({ url: img.url, isMain: img.isMain });
        totalSkipped++;
        continue;
      }

      const filename = localFilename(img.url);
      const filePath = path.join(UPLOADS_DIR, filename);

      if (!fs.existsSync(filePath)) {
        console.warn(`  File missing, skipping: ${filename}`);
        newImages.push({ url: img.url, isMain: img.isMain });
        continue;
      }

      try {
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'ai-closet/clothing',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        });
        newImages.push({ url: result.secure_url, isMain: img.isMain });
        fs.unlinkSync(filePath);
        console.log(`  ✓ ${item.name} — ${filename}`);
        console.log(`    → ${result.secure_url}`);
        totalUploaded++;
        changed = true;
      } catch (err: unknown) {
        const e = err as { message?: string };
        console.error(`  ✗ Failed ${filename}: ${e.message}`);
        newImages.push({ url: img.url, isMain: img.isMain });
      }
    }

    if (changed) {
      // Use updateOne to bypass toJSON transform and store raw Cloudinary URLs
      await ClothingItem.updateOne(
        { _id: item._id },
        { $set: { images: newImages } }
      );
      console.log(`  Saved: ${item.name}\n`);
    }
  }

  console.log('─────────────────────────────────');
  console.log(`Migrated : ${totalUploaded} image(s)`);
  console.log(`Skipped  : ${totalSkipped} already on Cloudinary`);

  const remaining = fs.readdirSync(UPLOADS_DIR).filter(f => f !== '.gitkeep');
  console.log(`Local files left: ${remaining.length}`);

  await mongoose.disconnect();
})();
