require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const sharp = require("sharp");
const { ZipArchive } = require("archiver");
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// --------------------------------------------------
// Config
// --------------------------------------------------

const EVENT_NAME = process.env.NAME_OF_EVENT || "default-event";

const dataDir = process.env.DATA_PATH
  ? path.resolve(process.env.DATA_PATH)
  : path.join(__dirname, "..", "data");

const mainDirEvents = path.join(dataDir, "events");
const eventDir = path.join(mainDirEvents, EVENT_NAME);
const originalsDir = path.join(eventDir, "originals");
const thumbnailsDir = path.join(eventDir, "thumbnails");

// Creating directories
fs.mkdirSync(mainDirEvents, { recursive: true });
fs.mkdirSync(originalsDir, { recursive: true });
fs.mkdirSync(thumbnailsDir, { recursive: true });

// --------------------------------------------------
// MULTER
// --------------------------------------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, originalsDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB
  },
  fileFilter: (req, file, cb) => {
    // MIME types
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/heic-sequence",
      "image/heif-sequence",
      "video/mp4",
      "video/quicktime",
      "video/x-m4v",
    ];

    // Allowed extensions
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".heic",
      ".heif",
      ".mp4",
      ".mov",
      ".m4v",
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    // Check MIME type or extention
    if (!allowedMimeTypes.includes(file.mimetype) && !allowedExtensions.includes(ext)) {
      console.warn(`WARNING: Rejected file: ${file.originalname} (${file.mimetype}, ${ext})`);
      return cb(new Error(`Illegal file type: ${file.mimetype} (${ext})`));
    }

    cb(null, true);
  },
});

// --------------------------------------------------
// Static files
// --------------------------------------------------

app.use(`/photos/${EVENT_NAME}`, express.static(originalsDir, {
  dotfiles: "deny",
  extensions: ["jpg", "jpeg", "png", "webp", "heic", "heif", "mp4", "mov"],
}));

app.use(`/thumbnails/${EVENT_NAME}`, express.static(thumbnailsDir, {
  dotfiles: "deny",
  extensions: ["webp", "jpg", "jpeg"],
}));

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    event: EVENT_NAME,
    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------------------
// Event info
// --------------------------------------------------

app.get("/api/event", (req, res) => {
  res.json({
    name: EVENT_NAME,
    dataDir,
    originalsDir,
    thumbnailsDir,
  });
});

// --------------------------------------------------
// List of photos and videos
// --------------------------------------------------

app.get("/api/photos", (req, res) => {
  try {
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".heic",
      ".heif",
      ".mp4",
      ".mov",
      ".m4v",
    ];

    const files = fs.readdirSync(originalsDir).filter((filename) => {
      const extension = path.extname(filename).toLowerCase();
      return allowedExtensions.includes(extension);
    });

    const photos = files.map((filename) => {
      const filePath = path.join(originalsDir, filename);
      const stats = fs.statSync(filePath);
      const extension = path.extname(filename).toLowerCase();
      const isVideo = [".mp4", ".mov", ".m4v"].includes(extension);
      const type = isVideo ? "video" : "photo";
      const thumbnailExtension = isVideo ? ".jpg" : ".webp";
      const thumbnailFilename = path.parse(filename).name + thumbnailExtension;

      return {
        filename,
        originalName: filename,
        type,
        size: stats.size,
        createdAt: stats.birthtime,
        originalUrl: `/photos/${EVENT_NAME}/${filename}`,
        thumbnailUrl: `/thumbnails/${EVENT_NAME}/${thumbnailFilename}`,
      };
    });

    res.json(photos);
  } catch (error) {
    console.error("ERROR: Error listing photos:", error);
    res.status(500).json({
      error: "Cannot list photos",
      details: error.message,
    });
  }
});

// --------------------------------------------------
// Thumbnail generation functions
// --------------------------------------------------

async function createHeicThumbnail(originalPath, thumbnailPath) {
  try {
    // try Sharp
    await sharp(originalPath)
      .rotate()
      .resize({
        width: 500,
        height: 500,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
  } catch (error) {
    console.warn("WARNING: Sharp HEIC failed, trying FFmpeg:", error.message);

    // Fallback to FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(originalPath)
        .outputOptions(["-frames:v 1", "-q:v 2"])
        .size("500x500")
        .output(thumbnailPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });
  }
}

async function createVideoThumbnail(originalPath, thumbnailPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(originalPath)
      .screenshots({
        timestamps: ["2"], // 2 sekunda
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: "800x?",
      })
      .on("end", resolve)
      .on("error", (err) => {
        console.error("ERROR: FFmpeg thumbnail error:", err.message);
        reject(err);
      });
  });
}

async function createPhotoThumbnail(originalPath, thumbnailPath) {
  await sharp(originalPath)
    .rotate()
    .resize({
      width: 500,
      height: 500,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toFile(thumbnailPath);
}

// --------------------------------------------------
// UPLOAD PHOTOS
// --------------------------------------------------

app.post(
  "/api/photos",
  upload.array("photos", 100),
  async (req, res, next) => {
    try {
      console.log("INFO: Upload request received");
      console.log("Files:", req.files?.map(f => ({
        originalname: f.originalname,
        filename: f.filename,
        mimetype: f.mimetype,
        size: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
      })));

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: "Not uploaded any files",
        });
      }

      const uploaded = [];

      for (const file of req.files) {
        const originalPath = file.path;
        const extension = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.filename, path.extname(file.filename));

        let type;
        let thumbnailFilename;
        let thumbnailPath;

        try {
          // ------------------------------------------
          // HEIC / HEIF
          // ------------------------------------------
          if (["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"].includes(file.mimetype) ||
            [".heic", ".heif"].includes(extension)) {

            type = "photo";
            thumbnailFilename = `${baseName}.jpg`;
            thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

            console.log(`📷 Processing HEIC: ${file.originalname}`);
            await createHeicThumbnail(originalPath, thumbnailPath);

            uploaded.push({
              filename: file.filename,
              originalName: file.originalname,
              type: "photo",
              size: file.size,
              mimeType: file.mimetype,
              originalUrl: `/photos/${EVENT_NAME}/${file.filename}`,
              thumbnailUrl: `/thumbnails/${EVENT_NAME}/${thumbnailFilename}`,
            });
          }
          // ------------------------------------------
          // Regular images
          // ------------------------------------------
          else if (file.mimetype.startsWith("image/")) {
            type = "photo";
            thumbnailFilename = `${baseName}.webp`;
            thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

            console.log(`INFO: Processing image: ${file.originalname}`);
            await createPhotoThumbnail(originalPath, thumbnailPath);

            uploaded.push({
              filename: file.filename,
              originalName: file.originalname,
              type: "photo",
              size: file.size,
              mimeType: file.mimetype,
              originalUrl: `/photos/${EVENT_NAME}/${file.filename}`,
              thumbnailUrl: `/thumbnails/${EVENT_NAME}/${thumbnailFilename}`,
            });
          }
          // ------------------------------------------
          // Videos
          // ------------------------------------------
          else if (file.mimetype.startsWith("video/") || [".mp4", ".mov", ".m4v"].includes(extension)) {
            type = "video";
            thumbnailFilename = `${baseName}.jpg`;
            thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

            console.log(`INFO: Processing video: ${file.originalname}`);
            await createVideoThumbnail(originalPath, thumbnailPath);

            uploaded.push({
              filename: file.filename,
              originalName: file.originalname,
              type: "video",
              size: file.size,
              mimeType: file.mimetype,
              originalUrl: `/photos/${EVENT_NAME}/${file.filename}`,
              thumbnailUrl: `/thumbnails/${EVENT_NAME}/${thumbnailFilename}`,
            });
          }
          // ------------------------------------------
          // Unknown type
          // ------------------------------------------
          else {
            console.warn(`WARNING: Skipping unknown file type: ${file.originalname} (${file.mimetype})`);
            continue;
          }
        } catch (fileError) {
          console.error(`ERROR: Error processing ${file.originalname}:`, fileError.message);
          // Continue other files 
          uploaded.push({
            filename: file.filename,
            originalName: file.originalname,
            type: "unknown",
            size: file.size,
            mimeType: file.mimetype,
            error: fileError.message,
          });
        }
      }

      console.log(`INFO: Upload complete: ${uploaded.length} files`);

      res.status(201).json({
        message: "FILES UPLOADED.",
        files: uploaded,
      });
    } catch (error) {
      console.error("ERROR: Upload error:", error);
      next(error);
    }
  }
);

// --------------------------------------------------
// Download photos in ZIP
// --------------------------------------------------

app.post("/api/photos/download", async (req, res, next) => {
  try {
    const { filenames } = req.body;

    if (!Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({
        error: "No marked photos.",
      });
    }

    const filesToAdd = [];

    for (const filename of filenames) {
      const safeFilename = path.basename(filename);
      const filePath = path.join(originalsDir, safeFilename);

      if (fs.existsSync(filePath)) {
        filesToAdd.push({
          path: filePath,
          name: safeFilename,
        });
      }
    }

    if (filesToAdd.length === 0) {
      return res.status(404).json({
        error: "Cannot find marked photos.",
      });
    }

    // HEADERS
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${EVENT_NAME}-photos.zip"`
    );

    // ZIP
    const archive = new ZipArchive({
      store: true,
    });
    archive.on("error", (error) => {
      console.error("ZIP ERROR:", error);
      if (!res.headersSent) {
        next(error);
      } else {
        res.destroy(error);
      }
    });

    archive.pipe(res);

    for (const file of filesToAdd) {
      archive.file(file.path, {
        name: file.name,
      });
    }

    await archive.finalize();
  } catch (error) {
    console.error("ERROR: Download error:", error);
    if (!res.headersSent) {
      next(error);
    } else {
      res.destroy(error);
    }
  }
});

// --------------------------------------------------
// ERROR HANDLING
// --------------------------------------------------

app.use((error, req, res, next) => {
  console.error("ERROR: Global error handler:", error);

  // Multer errors
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "File too large. Maximum size is 1GB.",
    });
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      error: "Too many files. Maximum is 100.",
    });
  }

  // Multer file filter error
  if (error.message?.includes("Illegal file type")) {
    return res.status(400).json({
      error: error.message,
    });
  }

  // Default error
  res.status(400).json({
    error: error.message || "Unknown error",
  });
});

// --------------------------------------------------
// START
// --------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════╗
║  📸 Photo Upload Server                ║
║  ──────────────────────────────────    ║
║  Event: ${EVENT_NAME.padEnd(27)}║
║  Port:  ${PORT.toString().padEnd(28)}║
║  Data:  ${dataDir.padEnd(27)}║
╚════════════════════════════════════════╝
  `);
});