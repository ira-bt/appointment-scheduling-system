import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import { Request } from 'express';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'medical-reports',
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
    } as any,
});

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDFs are allowed'));
        }
    }
});
