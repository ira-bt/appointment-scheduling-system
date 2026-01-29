import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { ROUTES } from '../constants/routes';

const router = Router();

// All routes here are protected
router.use(protect);

router.get(ROUTES.USERS.ME, UserController.getMe);

export default router;
