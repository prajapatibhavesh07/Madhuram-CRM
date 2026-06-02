const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const authenticate = require("../middleware/authMiddleware");
const CallHistoryController = require("../controllers/CallHistoryController");

// Setup Multer for Recordings
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/recordings/';
        if (!require('fs').existsSync(dir)) {
            require('fs').mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'recording-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max for audio
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp3|wav|amr|m4a|aac|ogg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname || mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only audio files are allowed!'));
    }
});

router.get("/", authenticate, CallHistoryController.getAll);
router.post("/", authenticate, upload.single('recording'), CallHistoryController.create);
router.post("/bulk", authenticate, CallHistoryController.bulkCreate);
router.put("/:id", authenticate, CallHistoryController.update);
router.delete("/:id", authenticate, CallHistoryController.delete);

module.exports = router;
