const express = require("express");
const router = express.Router();
const chatController = require("../controllers/ChatAssistantController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.use(authenticate);

// Restricted access: AI Assistant available for Admins, Managers, and Team Leads
const allowedRoles = ["Super Admin", "Admin", "Manager", "Team Lead"];

router.post("/chat", authorize(allowedRoles), chatController.askAssistant);
router.post("/suggest-companies", authorize(allowedRoles), chatController.getCompanySuggestions);
router.post("/generate-resume", authorize(allowedRoles), chatController.generateResume);
router.post("/generate-custom-resume", authorize(allowedRoles), chatController.generateCustomResume);
router.post("/score", authorize([...allowedRoles, "Recruiter"]), chatController.scoreCandidate);

module.exports = router;
