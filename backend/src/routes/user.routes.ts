import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateUpdateProfileBody } from '../utils/validation.util';
import { profileUpload } from '../middleware/upload.middleware';
import { protect } from '../middleware/auth.middleware';
import { ROUTES } from '../constants/routes';

const router = Router();

// All routes here are protected
router.use(protect);

router.get(ROUTES.USERS.ME, UserController.getMe);
router.put(ROUTES.USERS.UPDATE_PROFILE, validateUpdateProfileBody, UserController.updateProfile);
router.post(ROUTES.USERS.UPLOAD_PROFILE_IMAGE, profileUpload.single('profileImage'), UserController.uploadProfileImage);

export default router;
