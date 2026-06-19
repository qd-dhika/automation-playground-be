import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import {
  stats,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listUsers,
  updateUser,
  deleteUser,
  listOrders,
  updateOrder,
} from '../controllers/admin.controller';

const router = Router();

router.use(requireAdmin);

router.get('/stats', stats);
router.get('/products', listProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/users', listUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/orders', listOrders);
router.put('/orders/:id', updateOrder);

export default router;
