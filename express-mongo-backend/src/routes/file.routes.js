const express = require('express');
const router = express.Router();
const fileController = require('../controllers/FileController');
const authenticate = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup Multer Storage for general documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/documents/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authenticate);

router.get('/', fileController.getFiles);
router.post('/', upload.single('file'), fileController.uploadFile);
router.post('/:id/versions', upload.single('file'), fileController.uploadNewVersion);
router.patch('/:id/tags', fileController.addTag);
router.delete('/:id/tags', fileController.removeTag);
router.delete('/:id', fileController.deleteFile);

module.exports = router;
