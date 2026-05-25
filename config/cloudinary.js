const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @param {string} resourceType - "image" or "raw" (for PDFs)
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = async (filePath, folder, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: false, // Multer already makes it unique
      // Image ke liye auto quality & format optimization
      ...(resourceType === "image" && {
        transformation: [
          { quality: "auto", fetch_format: "auto" },
        ],
      }),
    });

    // Upload hone ke baad local temp file delete kar do
    fs.unlink(filePath, (err) => {
      if (err) console.error("Temp file delete error:", err.message);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    // Error hone par bhi temp file delete karo
    fs.unlink(filePath, (err) => {
      if (err) console.error("Temp file delete error:", err.message);
    });
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - "image" or "raw"
 * @returns {Promise<object>}
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log(`✅ Cloudinary se delete hua: ${publicId}`, result);
    return result;
  } catch (error) {
    console.error(`❌ Cloudinary delete error for ${publicId}:`, error.message);
    throw error;
  }
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
