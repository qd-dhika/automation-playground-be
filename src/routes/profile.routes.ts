import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getMyProfile, updateMyProfile, changeMyPassword } from '../controllers/profile.controller';

const router = Router();
router.use(requireAuth);
router.get('/', getMyProfile);
router.put('/', updateMyProfile);
router.put('/password', changeMyPassword);

export default router;
