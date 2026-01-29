import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateRegisterBody, validateLoginBody, validateForgotPasswordBody, validateResetPasswordBody, validateChangePasswordBody } from '../utils/validation.util';
import { protect } from '../middleware/auth.middleware';
import { ROUTES } from '../constants/routes';

const router = Router();

router.post(ROUTES.AUTH.REGISTER, validateRegisterBody, UserController.register);
router.post(ROUTES.AUTH.LOGIN, validateLoginBody, UserController.login);
router.post(ROUTES.AUTH.REFRESH, UserController.refreshToken);
router.post(ROUTES.AUTH.FORGOT_PASSWORD, validateForgotPasswordBody, UserController.forgotPassword);
router.post(ROUTES.AUTH.RESET_PASSWORD, validateResetPasswordBody, UserController.resetPassword);
router.post(ROUTES.AUTH.CHANGE_PASSWORD, protect, validateChangePasswordBody, UserController.changePassword);

export default router;
