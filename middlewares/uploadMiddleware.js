const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Temp folder for uploads (Cloudinary pe upload hone ke baad delete ho jaayegi)
const tempDir = path.join(__dirname, "..", "temp_uploads");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Unique filename: timestamp + original name
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

// File filter — sirf allowed types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "profilePic" || file.fieldname === "projectImage") {
    // Sirf images allow
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error(`${file.fieldname} ke liye sirf image files allowed hain (jpg, png, webp)`), false);
    }
  } else if (file.fieldname === "resume") {
    // Sirf PDF allow
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Resume ke liye sirf PDF file allowed hai"), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5MB per file
  },
});

// Middleware: profilePic, resume, and projectImage fields handle karega
const uploadFields = upload.fields([
  { name: "profilePic", maxCount: 1 },
  { name: "resume", maxCount: 1 },
  { name: "projectImage", maxCount: 1 },
]);

// Multer error handler wrapper — taaki multer errors properly handle ho
const handleUpload = (req, res, next) => {
  uploadFields(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size 5MB se zyada nahi honi chahiye!",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

module.exports = { handleUpload };
