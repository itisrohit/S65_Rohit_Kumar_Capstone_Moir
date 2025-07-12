import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  } as any
});

// Create upload middleware
export const uploadProfileImage = multer({ 
  storage: profileStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  }
});

// Utility function to delete images
export const deleteImage = async (publicId: string) => {
  return cloudinary.uploader.destroy(publicId);
};

export default cloudinary;