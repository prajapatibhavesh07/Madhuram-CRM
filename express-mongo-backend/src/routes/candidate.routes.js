const express = require("express");
const router = express.Router();
const path = require("path");
const candidateController = require("../controllers/candidate.controller");

const multer = require("multer");

const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/resumes/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Increased to 5MB for multiple files
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Format not allowed! (PDF, DOC, DOCX, JPG, PNG only)'));
        }
    }
});

const cpUpload = upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'photograph', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'aadhaarCard', maxCount: 1 },
    { name: 'educationProof', maxCount: 1 },
    { name: 'offerLetter', maxCount: 1 },
    { name: 'relativeLetter', maxCount: 1 },
    { name: 'resignationLetter', maxCount: 1 },
    { name: 'salarySlip', maxCount: 1 },
    { name: 'cheque', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
]);

// Apply authentication to all candidate routes
router.use(authenticate);

// Restricted access based on flowchart: Super Admin, Admin, Manager, Team Lead, Recruiter can access
const allowedRoles = ["Super Admin", "Admin", "Manager", "Team Lead", "Recruiter"];

router.post("/", authorize(allowedRoles), cpUpload, candidateController.createCandidate);
router.get("/", authorize(allowedRoles), candidateController.getCandidates);
router.get("/:id", authorize(allowedRoles), candidateController.getCandidateById);
router.patch("/:id", authorize(allowedRoles), cpUpload, candidateController.updateCandidate);
router.delete("/:id", authorize(["Super Admin", "Admin"]), candidateController.deleteCandidate);
router.post("/bulk-delete", authorize(["Super Admin", "Admin"]), candidateController.bulkDeleteCandidates);
router.post("/bulk-switch-recruiter", authorize(["Super Admin", "Admin", "Manager", "Team Lead"]), candidateController.bulkSwitchRecruiter);
router.post("/send-email", authorize(allowedRoles), candidateController.sendBulkEmail);
router.put("/:id/approve", authorize(["Super Admin", "Admin", "Manager", "Team Lead"]), candidateController.approveCandidate);
router.post("/check-duplicate", authorize(allowedRoles), candidateController.checkDuplicate);
router.post("/parse-resume", authorize(allowedRoles), upload.single('resume'), candidateController.parseResume);
router.post("/:id/request-update", authorize(allowedRoles), candidateController.requestProfileUpdate);

module.exports = router;
