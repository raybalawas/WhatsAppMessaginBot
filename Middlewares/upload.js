// Middlewares/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // We accept CSV for 'csvfile' and common docs/images for 'design'
  if (file.fieldname === "csvfile") {
    const ok =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      (file.originalname && file.originalname.toLowerCase().endsWith(".csv"));
    return cb(ok ? null : new Error("Only CSV allowed for csvfile"), ok);
  }
  if (file.fieldname === "design") {
    // allow pdf, docx, png, jpg, jpeg
    const ok =
      /pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|png|jpg|jpeg/i.test(
        file.mimetype
      ) || /\.(pdf|doc|docx|png|jpg|jpeg)$/i.test(file.originalname || "");
    return cb(ok ? null : new Error("Invalid design file type"), ok);
  }
  // Any other unexpected field -> reject (prevents Unexpected field)
  return cb(new Error("Unexpected field"), false);
};

// const fileFilter = (req, file, cb) => {
//   if (file.fieldname === "csvfile") {
//     return file.originalname.toLowerCase().endsWith(".csv")
//       ? cb(null, true)
//       : cb(new Error("Only CSV allowed for csvfile"), false);
//   }
//   if (file.fieldname === "design") {
//     return /\.(pdf|doc|docx|png|jpg|jpeg|mp4)$/i.test(file.originalname)
//       ? cb(null, true)
//       : cb(new Error("Invalid design file type"), false);
//   }
//   cb(new Error("Unexpected field"), false);
// };

const upload = multer({
  storage: storage,
  // dest:  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

export default upload;
