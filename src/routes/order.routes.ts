import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { checkout, listOrders, getOrder } from '../controllers/order.controller';

const router = Router();
router.use(requireAuth);
router.post('/', checkout);
router.get('/', listOrders);
router.get('/:id', getOrder);

export default router;
