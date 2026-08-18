require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const sharp = require("sharp");
const { ZipArchive } = require("archiver");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --------------------------------------------------
// Config
// --------------------------------------------------

const EVENT_NAME = process.env.NAME_OF_EVENT;

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

    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 50 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Illegal file type"));
    }

    cb(null, true);
  },
});

// --------------------------------------------------
// Share photos
// --------------------------------------------------

app.use(`/photos/${EVENT_NAME}`, express.static(originalsDir));

app.use(`/thumbnails/${EVENT_NAME}`, express.static(thumbnailsDir));

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

// --------------------------------------------------
// Event info
// --------------------------------------------------

app.get("/api/event", (req, res) => {
  res.json({
    name: EVENT_NAME,
  });
});

// --------------------------------------------------
// List of photos
// --------------------------------------------------

app.get("/api/photos", (req, res) => {
  const files = fs.readdirSync(originalsDir).filter((filename) => {
    const extension = path.extname(filename).toLowerCase();

    return [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"].includes(
      extension,
    );
  });

  const photos = files.map((filename) => {
    const filePath = path.join(originalsDir, filename);

    const stats = fs.statSync(filePath);

    const thumbnailFilename = path.parse(filename).name + ".webp";

    return {
      filename,

      size: stats.size,

      createdAt: stats.birthtime,

      originalUrl: `/photos/${EVENT_NAME}/${filename}`,

      thumbnailUrl: `/thumbnails/${EVENT_NAME}/${thumbnailFilename}`,
    };
  });

  res.json(photos);
});

// --------------------------------------------------
// UPLOAD PHOTOS
// --------------------------------------------------

app.post("/api/photos", upload.array("photos", 100), async (req, res, next) => {
  try {
    const photos = [];

    for (const file of req.files) {
      const thumbnailFilename = path.parse(file.filename).name + ".webp";

      const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

      // ------------------------------------------
      // Create miniature
      // ------------------------------------------

      await sharp(file.path)
        .rotate()
        .resize({
          width: 500,
          height: 500,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 80,
        })
        .toFile(thumbnailPath);

      // ------------------------------------------
      //  API Response
      // ------------------------------------------

      photos.push({
        filename: file.filename,

        originalName: file.originalname,

        size: file.size,

        originalUrl: `/photos/${EVENT_NAME}/${file.filename}`,

        thumbnailUrl: `/thumbnails/${EVENT_NAME}/${thumbnailFilename}`,
      });
    }

    res.status(201).json({
      uploaded: photos.length,
      photos,
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// Downloading photos in ZIP
// --------------------------------------------------

app.post("/api/photos/download", async (req, res, next) => {
  try {
    const { filenames } = req.body;

    if (!Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({
        error: "No marked any photo.",
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

    // --------------------------------------------
    // HEADERS
    // --------------------------------------------

    res.statusCode = 200;

    res.setHeader("Content-Type", "application/zip");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${EVENT_NAME}-photos.zip"`,
    );

    // --------------------------------------------
    // ZIP
    // --------------------------------------------

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

    // ZIP → HTTP response
    archive.pipe(res);

    // Adding files
    for (const file of filesToAdd) {
      archive.file(file.path, {
        name: file.name,
      });
    }

    // Waiting for ZIP end
    await archive.finalize();
  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      next(error);
    } else {
      res.destroy(error);
    }
  }
});
// --------------------------------------------------
// OBSŁUGA BŁĘDÓW
// --------------------------------------------------

app.use((error, req, res, next) => {
  console.error(error);

  res.status(400).json({
    error: error.message,
  });
});

// --------------------------------------------------
// START
// --------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server działa na http://localhost:${PORT}`);
});
