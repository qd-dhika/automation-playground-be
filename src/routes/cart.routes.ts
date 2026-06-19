import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listCart, addItem, updateItem, deleteItem } from '../controllers/cart.controller';

const router = Router();
router.use(requireAuth);
router.get('/', listCart);
router.post('/', addItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
