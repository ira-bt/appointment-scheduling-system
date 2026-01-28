import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateRegisterBody, validateLoginBody } from '../utils/validation.util';
import { ROUTES } from '../constants/routes';

const router = Router();

router.post(ROUTES.AUTH.REGISTER, validateRegisterBody, UserController.register);
router.post(ROUTES.AUTH.LOGIN, validateLoginBody, UserController.login);
router.post(ROUTES.AUTH.REFRESH, UserController.refreshToken);

export default router;
