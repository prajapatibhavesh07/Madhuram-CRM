const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// Only Admin/Super Admin can manage system settings
const adminRoles = ["Super Admin", "Admin"];

router.get("/", authenticate, authorize(adminRoles), settingsController.getSettings);
router.put("/", authenticate, authorize(adminRoles), settingsController.updateSettings);

module.exports = router;
