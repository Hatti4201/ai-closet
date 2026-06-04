import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { generate, saveLook, getLooks, getLookDetail, updateLook, deleteLook } from '../controllers/recommendationController';
import { protect } from '../middleware/authMiddleware';

const ac = (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

router.use(protect);

router.post('/generate', ac(generate));
router.post('/', ac(saveLook));
router.get('/', ac(getLooks));
router.get('/:id', ac(getLookDetail));
router.put('/:id', ac(updateLook));
router.delete('/:id', ac(deleteLook));

export default router;
