import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

interface UploadOptions {
    folder: string;
    allowedFormats: string[];
    maxSize: number;
    transformation?: any[];
}

/**
 * Factory function to create specialized upload middleware
 */
const createUploadMiddleware = (options: UploadOptions) => {
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: options.folder,
            resource_type: 'image',
            allowed_formats: options.allowedFormats,
            transformation: options.transformation,
            use_filename: true,
            unique_filename: true,
        } as any,
    });

    return multer({
        storage: storage,
        limits: {
            fileSize: options.maxSize,
        },
        fileFilter: (req, file, cb) => {
            const isImage = file.mimetype.startsWith('image/');
            const isPdf = file.mimetype === 'application/pdf';
            const isPdfAllowed = options.allowedFormats.includes('pdf');

            if (isImage || (isPdf && isPdfAllowed)) {
                cb(null, true);
            } else {
                cb(new Error(`Invalid file type. Allowed: ${options.allowedFormats.join(', ')}`));
            }
        }
    });
};

// Medical reports: Images & PDFs (5MB limit)
export const reportUpload = createUploadMiddleware({
    folder: 'medical-reports',
    allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 5 * 1024 * 1024,
});

// Profile pictures: Images only (2MB limit, auto-resized)
export const profileUpload = createUploadMiddleware({
    folder: 'profile-images',
    allowedFormats: ['jpg', 'jpeg', 'png'],
    maxSize: 2 * 1024 * 1024,
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
});
