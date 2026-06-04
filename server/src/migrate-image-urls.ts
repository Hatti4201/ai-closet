import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import ClothingItem from './models/ClothingItem';

(async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to MongoDB');

  const items = await ClothingItem.find({});
  let updated = 0;

  for (const item of items) {
    let changed = false;
    item.images = item.images.map((img) => {
      // Strip any absolute prefix so only /uploads/filename remains
      const match = img.url.match(/\/uploads\/.+$/);
      if (match && img.url !== match[0]) {
        changed = true;
        return { url: match[0], isMain: img.isMain };
      }
      return img;
    }) as typeof item.images;

    if (changed) {
      await item.save();
      updated++;
      console.log(`Fixed: ${item.name}`);
    }
  }

  console.log(`\nMigration complete. ${updated} item(s) updated.`);
  await mongoose.disconnect();
})();
