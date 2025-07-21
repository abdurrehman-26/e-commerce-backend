import cloudinary from "../utils/cloudinary.js"; // or wherever your cloudinary config is

export const generateCloudinarySignature = (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'product-images';

    // ✅ Must provide api_secret
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiSecret) {
      throw new Error('Missing CLOUDINARY_API_SECRET');
    }

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret
    );

    res.json({
      timestamp,
      signature,
      apiKey: cloudinary.config().api_key,   // ✅ works
      cloudName: cloudinary.config().cloud_name, // ✅ works
      folder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
};
