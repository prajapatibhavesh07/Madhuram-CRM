const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const jobController = require('../controllers/JobController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/logos/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

router.post('/', upload.single('logo'), jobController.createJob);
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);
router.put('/:id', upload.single('logo'), jobController.updateJob);
router.delete('/:id', jobController.deleteJob);
router.post('/bulk-delete', jobController.deleteMultipleJobs);
router.post('/:id/email-candidates', jobController.emailCandidates);
router.post('/:id/share-hr', jobController.shareCandidatesWithHR);

module.exports = router;
