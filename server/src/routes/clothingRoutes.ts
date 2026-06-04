import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { createClothing, getClothingItems, getClothingDetail, updateClothing, deleteClothing } from '../controllers/clothingController';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

// Wrap async handlers so thrown errors reach the Express error middleware in Express 4
const ac = (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

router.use(protect);

router.post('/', upload.array('images', 3), ac(createClothing));
router.get('/', ac(getClothingItems));
router.get('/:id', ac(getClothingDetail));
router.put('/:id', upload.array('images', 3), ac(updateClothing));
router.delete('/:id', ac(deleteClothing));

export default router;
