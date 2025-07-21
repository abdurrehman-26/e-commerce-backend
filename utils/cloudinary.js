import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  secure: true,
  // If CLOUDINARY_URL is set, cloudinary config will auto-parse it, so no need to pass keys here explicitly
});

export default cloudinary;
